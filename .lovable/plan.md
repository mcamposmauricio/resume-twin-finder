

## Plano: Desabilitar fluxo de análise IA + Unificar acesso + Garantir fluxo funcional

### Objetivo
1. Comentar todo o fluxo de análise de currículos com IA (mantendo código para reutilização futura)
2. Todos os usuários acessam como `full_access` — visão de portal de vagas
3. Garantir que todas as funcionalidades existentes continuam funcionais (banco de talentos, vincular candidato a vaga, filtros, exportação, etc.)

### Mudanças

**1. `src/hooks/useUserRole.ts` — Forçar todos como full_access**
- Comentar a lógica de RPC `is_full_access`
- Retornar `isFullAccess: true`, `isLead: false`, `loading: false` imediatamente
- Código original fica comentado com `// [AI-FLOW] ...`

**2. `src/pages/Auth.tsx` — Redirect universal para /vagas**
- Após login bem-sucedido, redirecionar sempre para `/vagas` (sem verificar role)
- Comentar qualquer lógica que diferencia lead vs full_access no redirect

**3. `src/pages/Index.tsx` — Redirect direto para /vagas**
- Quando autenticado, redirecionar imediatamente para `/vagas`
- Comentar todo o fluxo de análise: steps, polling, handleAnalyze, processAnalysisResult, useResumeBalance, ReferralDialog, MarqBanner
- Manter apenas: auth check + redirect + loading spinner
- Código comentado marcado com `// [AI-FLOW]`

**4. `src/pages/JobPostings.tsx` — Remover guard de role**
- Remover o `useEffect` que redireciona `!isFullAccess`
- Remover a importação e uso de `useUserRole` (já que todos têm acesso)
- Remover o `if (!isFullAccess) return null`
- Manter o `roleLoading` check ou removê-lo do loading state

**5. `src/pages/TalentPool.tsx` — Remover guard de role**
- Mesmo tratamento: remover redirect de `!isFullAccess` e `useUserRole`
- O banco de talentos fica acessível a todos os autenticados

**6. `src/pages/JobPostingDetails.tsx` — Comentar análise**
- Comentar import e uso do `SendToAnalysisDialog`
- Comentar `useResumeBalance`
- Comentar botão "Enviar para Análise" e lógica associada
- Manter todo o resto funcional (Kanban, detalhes, status changes)

**7. `src/components/Dashboard.tsx` — Comentar seções de análise**
- Comentar stats de "CVs analisados", "Análises Recentes"
- Comentar botão "Nova Análise"
- Manter apenas o que for relevante para vagas (se o Dashboard ainda for usado em algum lugar)

### O que NÃO muda (garantindo fluxo funcional)
- **Banco de Talentos**: `useTalentPool`, `TalentCard`, `TalentDetailPanel`, `TalentFilters`, `TalentTimeline`, `exportTalents` — tudo intacto
- **Vincular a vaga**: `LinkToJobDialog` — funciona sem alteração
- **Vagas**: CRUD, timeline, Kanban, candidaturas — sem mudança
- **Formulários**: modelos de formulário — sem mudança
- **Páginas públicas**: `/apply/:slug`, `/carreiras/:slug` — sem mudança
- **Configurações**: todas as tabs — sem mudança
- **Edge Functions**: ficam no servidor sem alteração (analyze-resumes, etc.)
- **Tabelas e dados**: intactos

### Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `src/hooks/useUserRole.ts` | Forçar `isFullAccess: true` sempre (comentar RPC) |
| `src/pages/Auth.tsx` | Redirect direto para `/vagas` |
| `src/pages/Index.tsx` | Redirect para `/vagas`, comentar fluxo de análise |
| `src/pages/JobPostings.tsx` | Remover guard de role |
| `src/pages/TalentPool.tsx` | Remover guard de role |
| `src/pages/JobPostingDetails.tsx` | Comentar análise e saldo |
| `src/components/Dashboard.tsx` | Comentar seções de análise |

### Verificação pós-implementação
- Login redireciona para `/vagas`
- Todas as páginas acessíveis sem restrição de role
- Banco de talentos com filtros, score, paginação e exportação funcionando
- "Vincular a uma vaga" funcionando no painel do candidato
- Candidaturas via `/apply` continuam funcionando
- Nenhum erro no console relacionado a roles ou análise

