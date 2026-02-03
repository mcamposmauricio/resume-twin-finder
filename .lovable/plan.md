
## Plano: Configuracoes de Plataforma, Clonagem de Vagas e Pagina Publica de Carreiras

### Visao Geral

Refatorar o sistema para:
1. Mover personalizacao (logo, cor, nome) para nivel de plataforma (profiles)
2. Adicionar opcao de criar vaga do zero ou clonar uma existente
3. Criar pagina publica de carreiras com todas as vagas ativas da empresa

---

### 1. Personalizacao a Nivel de Plataforma

**Situacao Atual:**
- Campos `company_name`, `company_logo_url` e `brand_color` estao na tabela `job_postings`
- Cada vaga pode ter branding diferente

**Mudanca:**
- Mover campos de branding para a tabela `profiles`:
  - `company_logo_url` (novo)
  - `brand_color` (novo)
  - `careers_page_slug` (novo - slug unico para pagina de carreiras)
  - `careers_page_enabled` (novo - controla se a pagina esta ativa)
- O campo `company_name` ja existe em `profiles`
- Remover esses campos do formulario de criacao de vaga
- Criar nova pagina de configuracoes para personalizar a marca

**Nova Rota:**
- `/configuracoes` - Pagina com configuracoes de marca e pagina de carreiras

---

### 2. Criar Vaga: Do Zero ou Clonar

**Fluxo Proposto:**
1. Ao clicar em "Nova Vaga", abre um Dialog
2. Usuario escolhe:
   - "Comecar do zero" → navega para `/vagas/nova`
   - "Clonar vaga existente" → lista de vagas para selecionar
3. Ao clonar, todos os campos sao pre-preenchidos:
   - Titulo, descricao, requisitos, localizacao, faixa salarial, tipo de trabalho
   - Formulario de candidatura (form_template_id)
4. A vaga clonada inicia como rascunho com novo ID e slug

---

### 3. Pagina Publica de Carreiras

**URL:** `/carreiras/:slug`

**Funcionalidades:**
- Exibe header com logo/nome da empresa (da tabela profiles)
- Lista todas as vagas com status `active` do usuario
- Cada vaga mostra: titulo, localizacao, tipo de trabalho
- Ao clicar em uma vaga, redireciona para `/apply/:job_slug`
- Filtros opcionais: tipo de trabalho, localizacao

**Componentes:**
- Header com branding da empresa
- Grid/Lista de vagas
- Card de vaga com informacoes resumidas
- Estado vazio quando nao ha vagas

---

### Detalhes Tecnicos

**Migracao de Banco de Dados:**
```sql
-- Adicionar campos de branding na tabela profiles
ALTER TABLE profiles 
  ADD COLUMN company_logo_url TEXT,
  ADD COLUMN brand_color TEXT DEFAULT '#3B82F6',
  ADD COLUMN careers_page_slug TEXT UNIQUE,
  ADD COLUMN careers_page_enabled BOOLEAN DEFAULT false;

-- Migrar dados existentes das vagas para profiles
-- (executar UPDATE para cada usuario, pegando os valores da primeira vaga)
UPDATE profiles p
SET 
  company_logo_url = COALESCE(p.company_logo_url, (
    SELECT company_logo_url FROM job_postings jp 
    WHERE jp.user_id = p.user_id AND jp.company_logo_url IS NOT NULL 
    LIMIT 1
  )),
  brand_color = COALESCE(p.brand_color, (
    SELECT brand_color FROM job_postings jp 
    WHERE jp.user_id = p.user_id AND jp.brand_color IS NOT NULL 
    LIMIT 1
  ));

-- Criar funcao para gerar slug unico de carreiras
CREATE OR REPLACE FUNCTION generate_careers_slug(company text)
RETURNS text AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter int := 0;
BEGIN
  base_slug := lower(regexp_replace(company, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := regexp_replace(base_slug, '^-|-$', '', 'g');
  final_slug := base_slug;
  
  WHILE EXISTS(SELECT 1 FROM profiles WHERE careers_page_slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;
```

**RLS para Pagina de Carreiras:**
```sql
-- Permitir acesso publico a profiles com careers_page_enabled
CREATE POLICY "Public can view careers-enabled profiles"
ON profiles FOR SELECT
USING (careers_page_enabled = true);
```

**Arquivos a Criar:**

1. `src/pages/Settings.tsx`
   - Configuracoes de marca (nome, logo, cor)
   - Configuracoes da pagina de carreiras (slug, habilitar/desabilitar)
   - Preview em tempo real

2. `src/pages/PublicCareers.tsx`
   - Pagina publica de carreiras
   - Lista vagas ativas do usuario pelo slug

3. `src/components/jobs/NewJobDialog.tsx`
   - Dialog para escolher: comecar do zero ou clonar
   - Lista de vagas existentes para clonar

**Arquivos a Modificar:**

1. `src/pages/JobPostingForm.tsx`
   - Remover secao "Personalizacao da Pagina"
   - Receber props de vaga clonada (via query params ou state)

2. `src/pages/JobPostings.tsx`
   - Trocar navegacao direta por abertura do NewJobDialog

3. `src/pages/PublicApplication.tsx`
   - Buscar branding do profile em vez da job_posting
   - Adicionar link "Ver outras vagas" para pagina de carreiras

4. `src/hooks/useJobPostings.ts`
   - Adicionar funcao `cloneJobPosting`

5. `src/App.tsx`
   - Adicionar rota `/configuracoes`
   - Adicionar rota `/carreiras/:slug`

6. `src/types/jobs.ts`
   - Remover campos de branding do JobPosting type (opcional - pode manter para compatibilidade)

---

### Interface Visual - Dialog Nova Vaga

```text
+------------------------------------------+
|           Criar Nova Vaga                |
+------------------------------------------+
|                                          |
|  Como deseja criar a vaga?               |
|                                          |
|  [        Comecar do Zero           ]    |
|  Crie uma vaga completamente nova        |
|                                          |
|  [    Clonar Vaga Existente        ]     |
|  Copie os dados de uma vaga anterior     |
|                                          |
+------------------------------------------+

Ao clicar em "Clonar Vaga Existente":

+------------------------------------------+
|       Selecione a vaga para clonar       |
+------------------------------------------+
|  [Buscar...]                             |
|                                          |
|  - Desenvolvedor Full Stack (Ativa)      |
|  - Analista de Marketing (Encerrada)     |
|  - Designer UX/UI (Rascunho)             |
|                                          |
|  [Cancelar]             [Clonar]         |
+------------------------------------------+
```

### Interface Visual - Pagina de Configuracoes

```text
+----------------------------------------------------------+
|  <- Configuracoes                                         |
|                                                          |
|  [Marca]  [Pagina de Carreiras]                          |
|  ======                                                   |
|                                                          |
|  +------------------------------------------------------+|
|  | Identidade Visual                                     ||
|  |                                                       ||
|  | Nome da empresa: [MarQ Ponto                    ]     ||
|  |                                                       ||
|  | Logo da empresa:                                      ||
|  | [https://exemplo.com/logo.png                   ]     ||
|  | [Preview do logo se URL valida]                       ||
|  |                                                       ||
|  | Cor principal: [#3B82F6] [===]                        ||
|  +------------------------------------------------------+|
|                                                          |
|  [Salvar Alteracoes]                                     |
+----------------------------------------------------------+

Aba Pagina de Carreiras:

+----------------------------------------------------------+
|  +------------------------------------------------------+|
|  | Pagina Publica de Carreiras                          ||
|  |                                                       ||
|  | [x] Habilitar pagina de carreiras                    ||
|  |                                                       ||
|  | URL da pagina:                                        ||
|  | /carreiras/[marq-ponto                          ]     ||
|  |                                                       ||
|  | Link completo:                                        ||
|  | https://site.com/carreiras/marq-ponto [Copiar]       ||
|  +------------------------------------------------------+|
+----------------------------------------------------------+
```

### Interface Visual - Pagina de Carreiras

```text
+----------------------------------------------------------+
|  [Logo MarQ]                      Trabalhe Conosco        |
+----------------------------------------------------------+
|                                                          |
|  Junte-se ao time MarQ Ponto!                            |
|  Confira nossas vagas abertas                            |
|                                                          |
|  Filtros: [Todos os tipos v] [Todas localidades v]       |
|                                                          |
|  +------------------------------------------------------+|
|  | Desenvolvedor Full Stack Senior                       ||
|  | Remoto | Sao Paulo, SP                                ||
|  | R$ 12.000 - R$ 18.000                                 ||
|  |                                          [Candidatar] ||
|  +------------------------------------------------------+|
|  | Analista de RH                                        ||
|  | Hibrido | Rio de Janeiro, RJ                          ||
|  |                                          [Candidatar] ||
|  +------------------------------------------------------+|
|                                                          |
|  Powered by Resume AI                                    |
+----------------------------------------------------------+
```

---

### Passos de Implementacao

1. **Migracoes de banco**: Adicionar campos no profiles e criar politicas RLS
2. **Criar NewJobDialog**: Dialog para escolher modo de criacao
3. **Modificar JobPostings.tsx**: Integrar dialog ao botao Nova Vaga
4. **Modificar JobPostingForm.tsx**: Remover personalizacao, aceitar clone state
5. **Criar Settings.tsx**: Pagina de configuracoes com abas
6. **Criar PublicCareers.tsx**: Pagina publica de carreiras
7. **Atualizar PublicApplication.tsx**: Buscar branding do profile
8. **Atualizar App.tsx**: Adicionar novas rotas
9. **Atualizar navegacao**: Adicionar link para configuracoes no dashboard

---

### Compatibilidade e Migracao

- Os campos de branding na `job_postings` serao mantidos por retrocompatibilidade
- A `PublicApplication` primeiro tentara usar o branding do profile; se nao existir, usa da vaga
- Isso permite que vagas antigas continuem funcionando enquanto usuarios migram para o novo sistema
