

## Plano: Corrigir 3 problemas do tenant demo MarQ HR

### Problemas identificados

**1. Página de carreiras não abre (`/carreiras/marq-hr`)**
- A rota existe no App.tsx e o perfil está configurado corretamente (slug `marq-hr`, `careers_page_enabled = true`).
- Preciso testar no browser para identificar o erro exato — pode ser um problema de importação ou de runtime. A query e RLS parecem corretas (profiles tem policy pública para `careers_page_enabled = true`, job_postings tem policy pública para `status = 'active'`).

**2. PDF de currículo em branco (2.846 bytes)**
- O PDF gerado tem apenas ~2.8KB — é praticamente vazio.
- **Solução**: Gerar um PDF realista com reportlab (nome, experiência, formação fictícios) e substituir todos os ~30 arquivos no bucket `resumes` com o novo PDF preenchido.

**3. Link da vaga quebrado (download de currículo)**
- Os currículos estão armazenados em `demo/{uuid}_{nome}.pdf` mas a RLS policy de SELECT no bucket `resumes` para o owner verifica `(storage.foldername(objects.name))[1] = (jp.id)::text` — ou seja, espera que a pasta seja o ID da vaga, não `demo/`.
- **Solução**: Atualizar os `resume_url` nas candidaturas para usar o path `{job_posting_id}/{uuid}_{nome}.pdf` e mover/reuploadar os arquivos com o path correto, OU adicionar uma RLS policy que permita acesso aos arquivos `demo/` para usuários autenticados que sejam donos das vagas.
- Abordagem mais simples: adicionar uma policy de SELECT mais ampla para autenticados que possuem as vagas, ou re-upload com paths corretos.

### Etapas de implementação

**Etapa 1: Diagnosticar página de carreiras**
- Navegar até `/carreiras/marq-hr` no browser para ver o erro exato
- Corrigir o que for encontrado (provavelmente problema de importação de asset ou erro de runtime)

**Etapa 2: Gerar PDF realista**
- Script Python com reportlab gerando currículo fictício completo (~1 página)
- Nome, email, telefone, experiência profissional, formação acadêmica
- Upload para substituir os ~30 PDFs existentes no bucket

**Etapa 3: Corrigir paths dos currículos no storage**
- Opção A (preferida): Adicionar RLS policy mais abrangente no bucket resumes para donos de vagas
- Opção B: Re-upload dos PDFs com paths `{job_posting_id}/{uuid}.pdf` e atualizar `resume_url` nas candidaturas

A RLS atual já tem uma policy `Users can view resumes for their jobs` com `auth.uid() IS NOT NULL` que deveria funcionar. Vou verificar se o problema é realmente RLS ou se é algo no código de download (`getResumeUrl`/`downloadResume`).

### Arquivos a modificar
| Arquivo | Motivo |
|---------|--------|
| Script Python (temporário) | Gerar PDF realista |
| Edge function temporária ou script | Re-upload PDFs e atualizar paths |
| Possível migration SQL | Adicionar/ajustar RLS no bucket resumes se necessário |

