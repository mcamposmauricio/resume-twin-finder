

## Modelos de Vagas a partir dos PDFs

### O que sera feito

Criar uma tabela de **modelos de vagas** (job templates) pre-preenchidos com os dados extraidos dos 9 PDFs enviados. Ao criar uma nova vaga, os usuarios autorizados poderao escolher "Usar Modelo" e selecionar um dos modelos disponíveis para pre-preencher o formulario.

### Modelos que serao criados (extraidos dos PDFs)

| Cargo | Piso Salarial |
|---|---|
| Analista de Area de Gente | R$ 3.120,00 |
| Analista de Manutencao | R$ 3.120,00 |
| Assistente da Area de Gente | R$ 2.080,00 |
| Gerente de Loja | - |
| Gerente Regional Comercial | R$ 4.368,00 |
| Motorista | R$ 1.666,01 |
| Operador(a) de Loja | - |
| Operador(a) de Monitoramento | R$ 1.690,93 |
| Supervisor(a) de Loja | R$ 2.000,00 |

### Controle de acesso

Os modelos ficarao disponiveis apenas para os emails especificados:
- rebeca.liberato@letsmake.com.br
- mauricio@marqponto.com.br
- thaina@marqponto.com.br

### Fluxo do usuario

1. Clica em "Nova Vaga"
2. Ve 3 opcoes: **Comecar do Zero**, **Clonar Vaga Existente**, **Usar Modelo**
3. Ao escolher "Usar Modelo", ve a lista dos 9 modelos com titulo e descricao resumida
4. Ao selecionar um modelo, o formulario de nova vaga abre pre-preenchido com titulo, descricao, requisitos, habilidades e piso salarial

---

### Detalhes tecnicos

**1. Nova tabela: `job_templates`**

| Coluna | Tipo | Descricao |
|---|---|---|
| id | uuid | PK |
| title | text | Titulo do cargo |
| description | text | Descricao do cargo |
| requirements | text | Requisitos e habilidades |
| salary_range | text | Piso salarial |
| work_type | text | Tipo de trabalho (nullable) |
| location | text | Localizacao (nullable) |
| created_at | timestamptz | Data de criacao |

- RLS: SELECT permitido apenas para usuarios cujo email esta na lista autorizada (usando `auth.jwt() ->> 'email'`)
- Sem INSERT/UPDATE/DELETE por usuarios - dados gerenciados via migration

**2. Migration SQL**
- Cria a tabela `job_templates`
- Habilita RLS com policy restrita aos 3 emails
- Insere os 9 registros com dados extraidos dos PDFs (titulo, descricao completa, requisitos/habilidades, piso salarial)

**3. Arquivos a modificar/criar**

| Arquivo | Acao |
|---|---|
| Migration SQL | Criar tabela + seed dos 9 modelos |
| `src/components/jobs/NewJobDialog.tsx` | Adicionar opcao "Usar Modelo" e tela de selecao |
| `src/types/jobs.ts` | Adicionar tipo `JobTemplate` |
| `src/hooks/useJobTemplates.ts` | Criar hook para buscar templates |

**4. Alteracoes no NewJobDialog**
- Novo modo `'template'` alem de `'choice'` e `'clone'`
- Botao "Usar Modelo" com icone `FileText` na tela de escolha
- Tela de selecao de modelo com busca, similar a tela de clone
- Ao selecionar, navega para `/vagas/nova` com state `cloneFrom` (reutiliza o fluxo existente de pre-preenchimento)

**5. Hook useJobTemplates**
- Busca da tabela `job_templates` via Supabase client
- Retorna lista de templates disponiveis (RLS filtra automaticamente por email)

