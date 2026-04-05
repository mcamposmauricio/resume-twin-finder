

## Plano: Revisão completa de UI/UX e Performance do CompareCV

### Problemas Identificados

**UI/UX**

1. **Header duplicado em todas as páginas** — O header é recriado manualmente em `JobPostings`, `TalentPool`, `Settings`, etc. Não há layout compartilhado. Isso gera inconsistência visual e código duplicado.

2. **Navegação escondida em dropdown** — Banco de Talentos, Formulários e Configurações ficam dentro de um menu dropdown (ícone de engrenagem). Usuários não descobrem essas funcionalidades facilmente. Falta uma sidebar ou nav bar fixa.

3. **Timeline de vagas com step "Analisadas" ainda visível** — O fluxo de IA foi desativado, mas o step "Analisadas" (com ícone BarChart3) permanece na timeline. Gera confusão.

4. **JobPostingCard ainda mostra "Enviar para Análise" e "Pronto para análise"** — Badges e menu items do fluxo de IA (linhas 142-154, 224-231) ainda aparecem no card de vagas.

5. **Auth page com mensagens sobre IA** — A landing/auth ainda diz "Triagem de currículos com inteligência artificial", "Análise com IA", etc. — funcionalidade desativada.

6. **Formulário público sem feedback visual de progresso** — O upload de currículo não mostra barra de progresso. Em conexões lentas, parece travado.

7. **Kanban sem scroll horizontal visível** — O Kanban usa `overflow-x-auto` mas sem indicador visual de que há mais colunas à direita (especialmente em mobile/tablet).

8. **Empty states genéricos** — Vários empty states poderiam ter CTAs mais diretos (ex: "Criar primeira vaga" com botão, não só texto).

9. **Footer repetido** — Mesmo footer copiado em todas as páginas.

10. **Ausência de breadcrumbs** — Ao navegar para detalhes de uma vaga, não há indicação clara de "onde estou" além do botão voltar.

**Performance**

11. **Auth check duplicado** — Cada página faz `supabase.auth.getSession()` independentemente no `useEffect`. Deveria haver um AuthContext global.

12. **JobPostings refiltra array 5x** — Os `counts` recalculam filtrando `jobPostings` 5 vezes (linhas 97-103). Deveria ser um único loop com `useMemo`.

13. **Careers page settings fetch inline** — O fetch de `profiles` no `useEffect` de `JobPostings` não tem tratamento de erro e não usa cache.

14. **TalentCard re-renders** — Cards não são memoizados. Com muitos candidatos, cada mudança de filtro re-renderiza todos.

---

### Melhorias Propostas (priorizadas)

#### Fase 1 — Limpeza de resíduos de IA + Consistência

| Arquivo | Mudança |
|---|---|
| `src/components/jobs/JobTimeline.tsx` | Remover step "Analisadas" |
| `src/components/jobs/JobPostingCard.tsx` | Remover badge "Pronto para análise", menu "Enviar para Análise", "Já analisado", "Ver Análise" |
| `src/pages/Auth.tsx` | Atualizar copy da landing: remover referências a IA, focar em "Portal de Vagas" |
| `src/pages/JobPostings.tsx` | Remover filtro `analyzed` e contagem |

#### Fase 2 — Layout compartilhado + Navegação

| Arquivo | Mudança |
|---|---|
| `src/components/layout/AppLayout.tsx` | **Criar** — Layout com header, sidebar colapsável (mobile: bottom nav ou hamburger), footer. Centraliza auth check. |
| `src/components/layout/AppSidebar.tsx` | **Criar** — Links: Vagas, Banco de Talentos, Formulários, Configurações. Badge com contagem de vagas ativas. |
| `src/pages/JobPostings.tsx` | Envolver com AppLayout, remover header/footer duplicado |
| `src/pages/TalentPool.tsx` | Envolver com AppLayout, remover header/footer duplicado |
| `src/pages/Settings.tsx` | Envolver com AppLayout |
| `src/pages/FormTemplates.tsx` | Envolver com AppLayout |

#### Fase 3 — Performance

| Arquivo | Mudança |
|---|---|
| `src/contexts/AuthContext.tsx` | **Criar** — Context com session, userId, userEmail. Elimina auth checks duplicados em cada página. |
| `src/pages/JobPostings.tsx` | `useMemo` para counts (loop único) |
| `src/components/talent/TalentCard.tsx` | `React.memo` para evitar re-renders desnecessários |
| `src/components/jobs/JobPostingCard.tsx` | `React.memo` |

#### Fase 4 — UX Polish

| Arquivo | Mudança |
|---|---|
| `src/components/jobs/ApplicationKanban.tsx` | Adicionar indicador de scroll horizontal (fade/sombra nas bordas) |
| `src/pages/PublicApplication.tsx` | Barra de progresso no upload do currículo |
| `src/pages/JobPostings.tsx` | Empty state com botão CTA direto "Criar Vaga" |
| `src/pages/JobPostingDetails.tsx` | Breadcrumb: "Vagas > [Título da vaga]" |

---

### Detalhes Técnicos

**AppLayout** — Componente wrapper que recebe `children`. Inclui:
- Header fixo com logo + user info + logout
- Sidebar com `NavLink` components usando `useLocation` para highlight ativo
- Mobile: sidebar colapsável via Sheet ou bottom navigation bar
- Footer fixo
- Auth guard: redireciona para `/auth` se não autenticado

**AuthContext** — Provider no `App.tsx` que escuta `onAuthStateChange` e expõe `{ session, userId, userEmail, loading }`. Todas as páginas consomem via `useAuth()` hook.

**Counts otimizado**:
```typescript
const counts = useMemo(() => {
  const c = { draft: 0, active: 0, paused: 0, closed: 0, analyzed: 0 };
  for (const j of jobPostings) {
    if (j.analyzed_at) c.analyzed++;
    else if (j.status in c) c[j.status]++;
  }
  return c;
}, [jobPostings]);
```

### Ordem de execução

1. Fase 1 (limpeza) — rápido, sem risco
2. Fase 3 (AuthContext + memos) — fundação para Fase 2
3. Fase 2 (layout) — maior mudança visual
4. Fase 4 (polish) — refinamentos finais

