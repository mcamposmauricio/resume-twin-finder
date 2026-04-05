

## Plano Atualizado: Melhorias em Configurações (compatível com dados existentes da Lets Make)

### Riscos identificados para a Lets Make

1. **Logo e Hero Image já configurados via URL** — A Lets Make já tem `company_logo_url` e `careers_hero_image_url` preenchidos com URLs externas. O componente de upload NÃO pode substituir o campo de URL, deve ser uma opção adicional (upload OU URL).
2. **Novas colunas no profiles** — Seguro, pois serão criadas com `DEFAULT NULL`. Os campos existentes não são afetados.
3. **Accordion na aba Empresa** — Puramente visual, não altera dados. Os campos existentes (tagline, about, culture, mission, vision, values) continuam idênticos.
4. **Benefícios já cadastrados** — A Lets Make pode já ter `company_benefits` preenchido como array JSON. A mudança no BenefitsEditor (multi-seleção) não altera o formato de dados, apenas o comportamento do dialog.
5. **Pipeline stages existentes** — A confirmação de delete é aditiva, não muda comportamento de stages já criados.

### Mudanças

**1. Migração SQL — Novas colunas (seguro, aditivo)**
```sql
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS company_whatsapp text,
  ADD COLUMN IF NOT EXISTS company_youtube text,
  ADD COLUMN IF NOT EXISTS company_tiktok text,
  ADD COLUMN IF NOT EXISTS company_glassdoor text;
```
Todas com default NULL — nenhum dado existente é alterado.

**2. Storage bucket para uploads (aditivo)**
```sql
INSERT INTO storage.buckets (id, name, public) 
VALUES ('company-assets', 'company-assets', true)
ON CONFLICT DO NOTHING;
```
Com RLS para o owner do arquivo. Não interfere com URLs externas existentes.

**3. `src/components/settings/ImageUploader.tsx` — Novo componente**
- Aceita upload drag-and-drop OU URL manual
- Se já existe uma URL (caso Lets Make), mostra o preview da URL atual
- Upload gera nova URL no Storage e substitui o campo
- Botão "Usar URL externa" mantém o fluxo atual como fallback

**4. `src/pages/Settings.tsx` — Sticky save bar + dirty state + novos campos**
- Detecta mudanças comparando state atual com state inicial (snapshot no load)
- Barra fixa no bottom aparece só quando há alterações
- Fetch e save incluem os 4 novos campos de redes sociais
- Campos novos inicializam como `''` (string vazia) quando NULL no banco — comportamento idêntico aos campos existentes

**5. `src/components/settings/CompanyInfoTab.tsx` — Accordion + novos campos**
- Reorganiza em 3 seções colapsáveis: "Sobre a empresa", "Missão / Visão / Valores", "Redes Sociais"
- Seções que já têm conteúdo preenchido abrem expandidas por default
- Adiciona campos WhatsApp, YouTube, TikTok, Glassdoor na seção Redes Sociais
- Props interface expandida para incluir os 4 novos campos

**6. `src/components/settings/BenefitsEditor.tsx` — Multi-seleção**
- Dialog de sugestões não fecha ao clicar — permite selecionar vários
- Formato de dados (`string[]`) permanece idêntico — sem migração necessária

**7. `src/components/settings/PipelineStagesEditor.tsx` — Confirmação de delete**
- AlertDialog antes de deletar etapa não-padrão
- Stages existentes não são afetados

### Arquivos alterados

| Arquivo | Ação |
|---|---|
| Migração SQL | 4 novas colunas + bucket storage |
| `src/pages/Settings.tsx` | Sticky save, dirty state, fetch/save dos novos campos |
| `src/components/settings/CompanyInfoTab.tsx` | Accordion, novos campos redes sociais |
| `src/components/settings/BenefitsEditor.tsx` | Multi-seleção no dialog |
| `src/components/settings/PipelineStagesEditor.tsx` | AlertDialog confirmação delete |
| `src/components/settings/ImageUploader.tsx` | Novo componente upload + URL |
| `src/components/settings/CareersPageTab.tsx` | Usar ImageUploader para hero image |

### Garantias de compatibilidade

- Nenhum campo existente é removido ou renomeado
- Nenhum default é alterado em colunas existentes
- URLs externas de logo/hero continuam funcionando (ImageUploader mostra preview e permite manter)
- `company_benefits` mantém formato `string[]`
- Pipeline stages existentes inalterados
- Todas as novas colunas são nullable — não quebram queries existentes

