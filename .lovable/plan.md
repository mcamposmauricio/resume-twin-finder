

## Plano de Correcoes e Melhorias

---

### 1. Sincronizacao bidirecional da etapa do candidato + trocar timeline por select

**Problema**: Quando o candidato e movido no Kanban, o estado `viewingApplication` no `JobPostingDetails.tsx` nao se atualiza porque e uma copia separada do array `applications`. Alem disso, a `StageNavigator` (timeline com botoes) e complexa demais para esse contexto.

**Solucao**:

- **`src/pages/JobPostingDetails.tsx`**: Adicionar um `useEffect` que sincroniza `viewingApplication` sempre que o array `applications` mudar. Quando o Kanban atualiza a etapa, o `updateTriageStatus` ja atualiza o array local -- basta propagar isso para o `viewingApplication`:

```typescript
useEffect(() => {
  if (viewingApplication) {
    const updated = applications.find(a => a.id === viewingApplication.id);
    if (updated) setViewingApplication(updated);
  }
}, [applications]);
```

- **`src/components/jobs/ApplicationDetailPanel.tsx`**: Substituir o componente `StageNavigator` por um simples `Select` (dropdown) que mostra a etapa atual e permite trocar. Quando o usuario muda no select, chama `onUpdateTriageStatus` que atualiza o banco, que atualiza o array `applications`, que sincroniza de volta no painel. Remover import do `StageNavigator`.

---

### 2. Link publico da vaga de volta

O `ShareJobLink` (compartilhamento em redes sociais) foi removido conforme solicitado, mas o link publico copiavel tambem sumiu. Precisa voltar apenas o link, sem os botoes de compartilhamento.

**Mudancas**:

- **`src/pages/JobPostingDetails.tsx`**: Para vagas ativas, exibir no card de "Informacoes" o link publico (`/vaga/{public_slug}`) com botao de copiar e abrir em nova aba. Simples, sem componente de compartilhamento social.

- **`src/components/jobs/JobPostingCard.tsx`**: Para vagas ativas, exibir um pequeno link copiavel no rodape do card (apenas icone de link + "Copiar link").

---

### 3. Melhorias de design e usabilidade na pagina de vagas

**`src/pages/JobPostings.tsx`**:
- Simplificar o banner de Pagina de Carreiras -- esta ocupando muito espaco visual. Tornar mais compacto.

**`src/pages/JobPostingDetails.tsx`**:
- Melhorar o card de acoes: agrupar botoes de forma mais clara com labels descritivos.
- Adicionar informacao de "Link publico" no card lateral de Informacoes para vagas ativas.

**`src/components/jobs/ApplicationDetailPanel.tsx`**:
- Garantir que textos longos nos form_data nao quebrem o layout (ja tem `break-words` mas revisar containers).

---

### Arquivos alterados

| Arquivo | Mudanca |
|---|---|
| `src/pages/JobPostingDetails.tsx` | Sync do viewingApplication + link publico no card de info |
| `src/components/jobs/ApplicationDetailPanel.tsx` | Trocar StageNavigator por Select simples |
| `src/components/jobs/JobPostingCard.tsx` | Adicionar link publico copiavel para vagas ativas |

