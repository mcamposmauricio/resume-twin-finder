

## Plano: Executar INSERT de migração no banco de dados

### Situação
A query em `docs/insert_migration_2.sql` contém 14 vagas e ~178 candidaturas para a empresa "Lets Make". Precisa ser executada no banco com as correções identificadas anteriormente.

### Problema
As políticas de RLS vão bloquear os INSERTs:
- `job_postings`: exige `auth.uid() = user_id`
- `job_applications`: exige que a vaga tenha `status = 'active'` (10 das 14 vagas estão `closed`)

### Abordagem

Vou criar uma **edge function temporária** (`run-migration`) que executa a query usando o `SUPABASE_SERVICE_ROLE_KEY` (que bypassa RLS). A função irá:

1. **Desabilitar RLS** temporariamente nas tabelas `job_postings` e `job_applications`
2. **Inserir as 14 vagas** com `ON CONFLICT (id) DO NOTHING`
3. **Inserir as ~178 candidaturas** com `ON CONFLICT (id) DO NOTHING`
4. **Aplicar correções pós-insert**:
   - Normalizar slugs (remover acentos, barras, parênteses)
   - Corrigir `salary_range` (`;` → `.`)
   - Extrair filename de `resume_filename` quando contém URL completa
   - Substituir `location = ','` por NULL
5. **Reabilitar RLS** nas duas tabelas
6. Retornar contagem de registros inseridos

Depois de confirmar que funcionou, a edge function será deletada.

### Arquivos

| Arquivo | Ação |
|---|---|
| `supabase/functions/run-migration/index.ts` | Criar edge function temporária com a query completa |

### Execução
1. Criar e deployar a edge function
2. Chamar via `curl_edge_functions` para executar
3. Verificar dados com `read_query`
4. Deletar a edge function após sucesso

