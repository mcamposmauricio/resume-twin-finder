

## Plano Atualizado: Tenant Demo com PDF de currículo replicado

### Resumo da adição

Criar **1 PDF genérico de currículo** e usá-lo como arquivo de resume para todas as ~30 candidaturas demo do marco@marqponto.com.br. O mesmo arquivo será copiado no bucket `resumes` com nomes diferentes para simular currículos distintos.

### Etapas completas

**1. Perfil e acessos** (sem mudança)
- Atualizar perfil com dados MarQ HR, careers page, logo, etc.
- Adicionar role `full_access` + atualizar funções `is_admin_email` e `is_template_authorized_email`
- Atualizar verificação admin no frontend

**2. Gerar PDF de currículo demo**
- Criar 1 PDF com reportlab contendo dados fictícios (nome, experiência, formação)
- Upload no bucket `resumes` com path `demo/{uuid}_{nome-candidato}.pdf` para cada candidatura
- Na prática: mesmo conteúdo binário, paths diferentes no storage

**3. Formulários, vagas e candidaturas** (sem mudança no escopo)
- 3 form templates, 6 vagas, ~30 candidaturas
- Cada candidatura agora terá `resume_url` e `resume_filename` preenchidos apontando para o PDF no bucket

### Implementação técnica

- PDF gerado via script Python com reportlab no sandbox
- Upload dos arquivos via Edge Function temporária (service_role) ou insert direto
- Campos `resume_url` e `resume_filename` das candidaturas preenchidos com os paths do storage

