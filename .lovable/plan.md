
## Plano: Ajustes no Fluxo de Criacao de Vagas e Acesso a Carreiras

### Visao Geral

Realizar quatro ajustes no sistema:
1. Integrar o NewJobDialog no botao "+" do Dashboard (home)
2. Remover o botao "Preencher Exemplo" do formulario de vaga
3. Adicionar opcao "Configuracoes" no menu dropdown do botao "+"
4. Adicionar link para pagina de carreiras na pagina de gerenciamento de vagas

---

### 1. NewJobDialog no Dashboard (Home)

**Situacao Atual:**
- O botao "Nova Vaga" no dropdown do Dashboard chama `onNewJobPosting` que navega direto para `/vagas/nova`
- O `NewJobDialog` ja existe e esta sendo usado na pagina `/vagas` (JobPostings)

**Mudanca:**
- Adicionar estado para controlar a abertura do dialog no Dashboard
- Importar e renderizar o `NewJobDialog` no Dashboard
- Alterar o click de "Nova Vaga" para abrir o dialog ao inves de navegar direto
- Buscar lista de vagas para passar ao dialog (para clonagem)

---

### 2. Remover Botao "Preencher Exemplo"

**Situacao Atual:**
- O botao esta nas linhas 189-194 do `JobPostingForm.tsx`
- Funcao `fillTestData` preenche campos com dados de exemplo

**Mudanca:**
- Remover o botao e a funcao `fillTestData`
- Manter o layout do header sem o botao

---

### 3. Adicionar "Configuracoes" no Menu "+"

**Situacao Atual:**
- O menu dropdown tem: Nova Analise, Nova Vaga, separador, Modelos de Formulario, Gerenciar Vagas, e Log de Atividades (admin only)

**Mudanca:**
- Adicionar opcao "Configuracoes" apos "Gerenciar Vagas" com icone Settings
- Navegacao para `/configuracoes`

---

### 4. Link para Pagina de Carreiras em JobPostings

**Situacao Atual:**
- A pagina de gerenciamento de vagas (`JobPostings.tsx`) nao tem link para a pagina de carreiras
- A configuracao da pagina de carreiras esta em `/configuracoes`

**Mudanca:**
- Buscar o slug da pagina de carreiras do profile do usuario
- Mostrar um banner/card com link para a pagina de carreiras quando habilitada
- Incluir botao para copiar link e abrir em nova aba

---

### Detalhes Tecnicos

**Arquivo: src/components/Dashboard.tsx**

Alteracoes:
1. Importar `NewJobDialog` e `Settings` icon
2. Adicionar estados: `showNewJobDialog` e `allJobPostings` (lista completa para clonagem)
3. Buscar todas as vagas (sem limite) para o dialog de clonagem
4. Adicionar item "Configuracoes" no dropdown
5. Alterar "Nova Vaga" para abrir o dialog
6. Renderizar o `NewJobDialog`

```text
Estrutura do Dropdown atualizada:
+------------------------------------------+
| Nova Analise                     [icon]  |
| Nova Vaga                        [icon]  |
+------------------------------------------+
| Modelos de Formulario            [icon]  |
| Gerenciar Vagas                  [icon]  |
| Configuracoes                    [icon]  | <- NOVO
+------------------------------------------+
| Log de Atividades (admin)        [icon]  |
+------------------------------------------+
```

**Arquivo: src/pages/JobPostingForm.tsx**

Alteracoes:
1. Remover funcao `fillTestData` (linhas 111-129)
2. Remover botao "Preencher Exemplo" (linhas 189-194)

**Arquivo: src/pages/JobPostings.tsx**

Alteracoes:
1. Adicionar estado para armazenar dados do perfil (careers_page_slug, careers_page_enabled)
2. Buscar dados do perfil ao carregar
3. Adicionar um card/banner acima da timeline mostrando o link da pagina de carreiras (quando habilitada)
4. Botoes para copiar link e abrir em nova aba

```text
Layout da pagina de vagas com link de carreiras:
+----------------------------------------------------------+
| <- Acompanhamento de Vagas               [Nova Vaga]     |
+----------------------------------------------------------+
| +------------------------------------------------------+ |
| | Pagina de Carreiras Ativa                            | |
| | /carreiras/empresa-exemplo   [Copiar] [Abrir]        | |
| +------------------------------------------------------+ |
|                                                          |
| [Timeline: Rascunhos | Publicadas | Pausadas | ...]      |
|                                                          |
| [Lista de vagas...]                                      |
+----------------------------------------------------------+
```

---

### Arquivos a Modificar

1. **src/components/Dashboard.tsx**
   - Importar `NewJobDialog` e `Settings` icon
   - Adicionar estados para dialog e lista de vagas
   - Buscar todas as vagas para clonagem
   - Adicionar "Configuracoes" no dropdown
   - Renderizar NewJobDialog

2. **src/pages/JobPostingForm.tsx**
   - Remover funcao `fillTestData`
   - Remover botao "Preencher Exemplo"

3. **src/pages/JobPostings.tsx**
   - Buscar e exibir link da pagina de carreiras
   - Adicionar card com link copiavel

---

### Interface Visual - Card de Carreiras na Pagina de Vagas

```text
Quando pagina de carreiras esta habilitada:
+------------------------------------------------------+
| [Globe icon]  Pagina de Carreiras                    |
| Sua pagina publica esta ativa em:                    |
| resume-twin-finder.lovable.app/carreiras/empresa     |
|                                   [Copiar] [Abrir]   |
+------------------------------------------------------+

Quando nao esta habilitada:
+------------------------------------------------------+
| [Globe icon]  Pagina de Carreiras                    |
| Configure sua pagina publica de vagas                |
|                                   [Configurar]       |
+------------------------------------------------------+
```

---

### Passos de Implementacao

1. Atualizar Dashboard.tsx com NewJobDialog e opcao Configuracoes
2. Remover botao de exemplo do JobPostingForm.tsx  
3. Adicionar banner/card de carreiras no JobPostings.tsx
