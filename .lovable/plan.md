## Favoritar candidato (estrela) — Opção A

### Backend
- `ALTER TABLE job_applications ADD COLUMN is_favorite boolean NOT NULL DEFAULT false;`
- Índice parcial: `CREATE INDEX ON job_applications(job_posting_id) WHERE is_favorite;`
- RLS: já existe `UPDATE` para o dono da vaga, então favoritar funciona sem mudanças.
- `get_talent_pool`: adicionar `bool_or(ja.is_favorite) AS t_is_favorite` no agregado e ordenar `ORDER BY t_is_favorite DESC, t_score DESC, t_latest_date DESC`. Adicionar param opcional `p_only_favorites boolean`.
- `get_talent_applications`: incluir `is_favorite` no retorno.

### Frontend
1. **Novo componente** `FavoriteStarButton.tsx` — botão com ícone `Star` (lucide). Quando `isFavorite`: estrela preenchida amarela. Ao clicar pra favoritar (false→true), dispara `canvas-confetti` preset `fireworks` (~1.2s) ancorado no botão. Ao desfavoritar, sem animação. Update otimista + rollback em erro.
2. **`TalentCard.tsx`** — estrela no canto superior direito; quando favoritado, borda destacada (`ring-1 ring-amber-300`) + leve fundo âmbar. Ao favoritar pelo Banco de Talentos, marca a candidatura mais recente daquele e-mail (`latest_application_id` — adicionar no retorno da RPC).
3. **`TalentDetailPanel.tsx`** — estrela no header ao lado do nome. Marca a candidatura aberta na timeline (cada item da timeline também ganha estrela própria).
4. **`ApplicationCard.tsx`** + **`ApplicationDetailPanel.tsx`** (dentro de uma vaga) — estrela na candidatura, com mesmo destaque visual.
5. **`TalentFilters.tsx`** — adicionar toggle "Apenas favoritos".
6. **`useTalentPool.ts`** — novo filtro `onlyFavorites`, propaga `p_only_favorites` na RPC.
7. **`useJobApplications.ts`** — novo método `toggleFavorite(applicationId, value)`.

### Lib
- Instalar `canvas-confetti` + `@types/canvas-confetti`.

### Arquivos
- migration: ALTER + índice + atualização das 2 RPCs.
- novo: `src/components/FavoriteStarButton.tsx`
- editar: `TalentCard.tsx`, `TalentDetailPanel.tsx`, `TalentTimeline.tsx`, `TalentFilters.tsx`, `useTalentPool.ts`, `ApplicationCard.tsx`, `ApplicationDetailPanel.tsx`, `useJobApplications.ts`
