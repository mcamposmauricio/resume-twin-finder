

## Atualizar o Prompt Reutilizavel em `docs/activity-log-prompt.md`

Reescrever o arquivo `docs/activity-log-prompt.md` com um prompt completo e generico que descreve todo o Painel Administrativo do CompareCV (nao apenas o log de atividades), mas de forma que qualquer pessoa possa copiar e colar em outro projeto Lovable para replicar a estrutura.

### O que o prompt vai descrever (baseado no que existe hoje no CompareCV):

**Painel Administrativo completo com 2 abas:**

1. **Aba "Usuarios"** - Gerenciamento de usuarios
   - Tabela com: nome, email, empresa, telefone, metricas de uso (itens consumidos, tokens, saldo)
   - Filtros: busca por email, busca por empresa, filtro por status (todos/ativos/apenas cadastro/bloqueados)
   - Acoes por usuario: adicionar creditos/tokens (dialog com saldo atual e preview do novo saldo), bloquear/desbloquear (dialog de confirmacao com aviso)
   - Badges de status: verde (ativo), cinza (apenas cadastro), vermelho (bloqueado)
   - Alerta visual quando saldo esta baixo
   - Paginacao server-side (25 por pagina)
   - Precisa de uma database function (RPC) para buscar usuarios com stats agregadas

2. **Aba "Atividades"** - Log de atividades e telemetria
   - Tabela com: data/hora, usuario, empresa, acao, detalhes
   - Filtros avancados: email, empresa, tipo de acao (multi-select com checkboxes), data (dia unico ou periodo com calendario), toggle "Apenas erros"
   - Badges coloridas: azul para acoes normais, vermelha com icone de alerta para erros
   - Exibicao de `error_message` do metadata nos detalhes
   - Botao de limpar filtros
   - Contagem total de registros
   - Paginacao server-side (50 por pagina)

**Componentes do sistema:**

- Tabela `activity_logs` com RLS (INSERT aberto, SELECT restrito ao admin)
- Hook `useActivityLog.ts` com funcao fire-and-forget
- Tipos de acao genericos (sucesso + erro) que o usuario adapta
- Instrumentacao em catch blocks de todas as paginas
- Database function RPC para agregar stats de usuarios
- Backfill retroativo via SQL
- Protecao: verificacao de email no frontend + RLS no backend

### Arquivo a modificar

| Arquivo | Acao |
|---|---|
| `docs/activity-log-prompt.md` | Reescrever com prompt generico completo |

O prompt sera escrito em portugues, com instrucoes claras de onde substituir valores especificos do projeto (email admin, nomes de tabelas, etc.), e com placeholders marcados como `[SUBSTITUIR]`.
