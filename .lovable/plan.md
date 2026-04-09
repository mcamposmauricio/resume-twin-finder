

## Plano: Reorganizar layout da página de detalhes da vaga

### Mudança
No arquivo `src/pages/JobPostingDetails.tsx`, trocar a ordem dos blocos:

**Layout atual** (linhas 235-342):
1. Descrição + Informações (grid 2/3 + 1/3) — linhas 235-309
2. Candidaturas / Kanban — linhas 311-342

**Layout novo**:
1. Informações resumidas (link público, faixa salarial, etc.) — card compacto horizontal
2. **Candidaturas / Kanban** — movido para cima
3. Descrição da vaga + Requisitos — movido para baixo

### Arquivo a modificar
| Arquivo | Mudança |
|---------|---------|
| `src/pages/JobPostingDetails.tsx` | Mover o bloco do Kanban (linhas 311-342) para antes do bloco de Descrição/Informações (linhas 235-309). O card "Informações" com link público, faixa salarial e contagem de candidaturas fica inline no header ou como card compacto antes do Kanban. A descrição e requisitos descem para o final da página. |

### Estrutura resultante
```text
Breadcrumb
Header (título, badge status, localização, data)
Actions (Editar, Pausar, Encerrar)
Card Informações (link público, salário, nº candidaturas) — compacto
Card Candidaturas + Kanban
Card Descrição + Requisitos (abaixo de tudo)
```

