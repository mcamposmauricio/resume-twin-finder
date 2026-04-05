

## Plano: Corrigir labels de form_data (UUIDs → labels legíveis) + Auditoria de pontas soltas

### Problema raiz

Quando o candidato se inscreve via `/apply` com um form template customizado, o `form_data` é salvo com **UUIDs como chaves** (ex: `{"9fad376f-...": "12981738779"}`). Isso acontece porque `PublicApplication.tsx` usa `field.id` como key no `formValues`.

**Consequências:**
1. A aba "Dados" no Banco de Talentos mostra UUIDs em vez de labels ("Nome completo", "Telefone", etc.)
2. O `get_talent_pool` RPC busca por `form_data->>'Telefone'` e `form_data->>'Nome completo'`, mas quando as chaves são UUIDs, a busca por telefone/nome via form_data falha silenciosamente
3. O `ApplicationDetailPanel` e `ApplicationDetailsDialog` funcionam porque recebem `formFields` como prop e fazem o mapeamento — mas o Banco de Talentos não tem acesso ao form template

### Correções

**1. `src/pages/PublicApplication.tsx` — Salvar form_data com labels como chaves (fix going forward)**

Atualmente (linha 203):
```typescript
form_data: formValues, // keys são field.id (UUIDs)
```

Novo:
```typescript
// Converter field IDs para labels antes de salvar
const labeledFormData: Record<string, any> = {};
for (const [fieldId, value] of Object.entries(formValues)) {
  const field = fields.find(f => f.id === fieldId);
  const key = field?.label || fieldId;
  labeledFormData[key] = value;
}
form_data: labeledFormData,
```

Isso também corrige automaticamente a busca no `get_talent_pool` (que busca por `form_data->>'Telefone'`, etc.)

**2. `src/components/talent/TalentDetailPanel.tsx` — Resolver UUIDs existentes para labels**

Alterar o RPC `get_talent_applications` para retornar também os campos do form_template associado, OU resolver no frontend buscando o form_template da vaga.

Abordagem: Modificar o RPC para incluir `form_fields` (o JSON dos campos do template):

```sql
-- Adicionar coluna form_fields ao retorno
SELECT ..., ft.fields AS form_fields
FROM job_applications ja
INNER JOIN job_postings jp ON jp.id = ja.job_posting_id
LEFT JOIN form_templates ft ON ft.id = jp.form_template_id
```

No frontend, usar os `form_fields` para mapear UUIDs → labels na aba "Dados".

**3. Migração de dados existentes — Converter form_data com UUIDs para labels**

Criar uma migração SQL que atualiza os `form_data` existentes, substituindo UUIDs por labels consultando o `form_templates.fields`:

```sql
UPDATE job_applications ja SET form_data = (
  SELECT jsonb_object_agg(
    COALESCE((
      SELECT f->>'label'
      FROM jsonb_array_elements(ft.fields) f
      WHERE f->>'id' = kv.key
    ), kv.key),
    kv.value
  )
  FROM jsonb_each(ja.form_data) kv
)
FROM job_postings jp
LEFT JOIN form_templates ft ON ft.id = jp.form_template_id
WHERE ja.job_posting_id = jp.id
  AND ft.fields IS NOT NULL
  AND ja.form_data::text ~ '[0-9a-f]{8}-[0-9a-f]{4}';
```

### Outros problemas encontrados na auditoria

**4. Busca por telefone no `get_talent_pool` quebrada para dados com UUID keys**
- Após a migração (item 3), isso será corrigido automaticamente pois as chaves passarão a ser "Telefone", "Nome completo" etc.

**5. `TalentDetailPanel` — filtro de campos para excluir dados pessoais**
- Atualmente filtra por nomes fixos: `['Nome completo', 'nome_completo', 'name', 'Email', 'email', ...]`
- Quando as chaves são UUIDs, nada é filtrado, então nome/email/telefone aparecem duplicados na aba "Dados"
- Após a migração, o filtro existente funcionará corretamente

### Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `src/pages/PublicApplication.tsx` | Converter field IDs para labels antes de salvar no form_data |
| Migração SQL | Converter form_data existentes de UUIDs para labels |
| Migração SQL | Atualizar `get_talent_applications` para incluir `form_fields` como fallback |
| `src/components/talent/TalentDetailPanel.tsx` | Usar form_fields do RPC para resolver chaves UUID em dados antigos |
| `src/hooks/useTalentPool.ts` | Adicionar `form_fields` ao tipo `TalentApplication` |

### Performance
- A migração de dados roda uma vez
- Após migração, nenhuma resolução de UUID necessária em runtime
- O fallback no RPC só é usado para registros antigos não migrados

