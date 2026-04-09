

## Plano: Corrigir links de vagas, PDFs em branco e testar fluxos via UI

### Problema 1: Link público da vaga quebrado (`/vaga/` vs `/apply/`)

**Causa raiz**: Inconsistência de rotas. A rota no React Router é `/apply/:slug`, mas dois arquivos usam `/vaga/`:
- `src/pages/JobPostingDetails.tsx` (linhas 265, 272, 282) — exibe e copia link com `/vaga/`
- `src/components/jobs/JobPostingCard.tsx` (linha 185) — copia link com `/vaga/`

Outros pontos já usam `/apply/` corretamente:
- `ShareJobLink.tsx` → `/apply/${slug}`
- `PublicCareers.tsx` → `navigate('/apply/${job.public_slug}')`

**Solução**: Substituir `/vaga/` por `/apply/` nos dois arquivos afetados. Alternativamente, adicionar uma rota `/vaga/:slug` apontando para `PublicApplication` — mas isso criaria duplicação. Melhor padronizar em `/apply/`.

**Arquivos a modificar**:
| Arquivo | Mudança |
|---------|---------|
| `src/pages/JobPostingDetails.tsx` | Trocar 3 ocorrências de `/vaga/` por `/apply/` (linhas 265, 272, 282) |
| `src/components/jobs/JobPostingCard.tsx` | Trocar 1 ocorrência de `/vaga/` por `/apply/` (linha 185) |

### Problema 2: PDFs de currículo em branco

Os PDFs no bucket `resumes` continuam com ~2.8KB (vazios). Necessário gerar um PDF realista com `reportlab` e re-upload via Edge Function temporária.

**Etapas**:
1. Script Python com reportlab gerando currículo fictício de 1 página com nome, experiência, formação e tagline "EXEMPLO"
2. Buscar todos os `resume_url` das candidaturas do marco@ no banco
3. Fazer upload do PDF gerado para cada path existente (sobrescrever) via Edge Function temporária com `service_role`

### Problema 3: Testar fluxos via UI

Após as correções, testar no browser:
1. Abrir `/apply/{slug}` de uma vaga ativa do marco@ — preencher formulário e enviar candidatura
2. Logar como marco@ e criar uma nova vaga via UI (`/vagas/nova`)
3. Verificar que o link público da vaga recém-criada funciona

