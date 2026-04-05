

## Plano: Evolução do Banco de Talentos — Sem IA, Foco em Performance

### Escopo removido (IA)
- ~~Enriquecimento automático (skills, cargo, senioridade via AI)~~
- ~~Matching candidato ↔ vaga com score de compatibilidade~~
- ~~Busca por conteúdo do CV (indexação full-text de PDFs)~~

### O que será implementado

**1. Agregação no Postgres (performance)**
- Criar database function `get_talent_pool` que faz GROUP BY no banco, não no frontend
- Parâmetros: `p_user_id`, `p_search`, `p_job_ids[]`, `p_triage_status`, `p_has_resume`, `p_min_applications`, `p_date_from`, `p_page`, `p_page_size`
- Retorna dados já agrupados com paginação (OFFSET/LIMIT), eliminando limite de 1000 rows
- Índices em `applicant_email`, `created_at`, `job_posting_id` na `job_applications`

**2. Score simples (sem IA — cálculo SQL puro)**
- Recência: 40 pts (candidatura < 7d = 40, < 30d = 25, < 90d = 10, senão 0)
- Frequência: 30 pts (3+ apps = 30, 2 = 20, 1 = 10)
- Melhor triagem: 30 pts (deserves_analysis = 30, new = 15, low_fit = 0)
- Labels: Quente (>70), Morno (40-70), Frio (<40)

**3. Filtros avançados**
- Componente `TalentFilters.tsx` colapsável com: triagem, possui CV, data mínima, multi-seleção de vagas, qtd mínima de aplicações
- Busca expandida para telefone (via `form_data`)

**4. Exportação CSV**
- Botão exportar na página, respeita filtros
- Gera CSV no frontend com campos: nome, email, telefone, total aplicações, última vaga, data, score

**5. UI melhorada no TalentCard**
- Telefone (se disponível)
- Badge de score (quente/morno/frio com cor)
- Indicador de recência ("Novo" < 7d, "Ativo" < 30d)

**6. UI melhorada no TalentDetailPanel**
- Timeline visual vertical (ícone + linha) no lugar da tabela
- Abas: Perfil | Histórico | Dados do Formulário
- Destacar melhor candidatura (melhor triagem, não só a última)

### Arquivos

| Arquivo | Ação |
|---|---|
| Migração SQL | Criar function `get_talent_pool` + índices |
| `src/hooks/useTalentPool.ts` | Reescrever para usar RPC paginado |
| `src/pages/TalentPool.tsx` | Editar: filtros, exportação, paginação |
| `src/components/talent/TalentCard.tsx` | Editar: score, telefone, recência |
| `src/components/talent/TalentDetailPanel.tsx` | Reescrever: abas + timeline |
| `src/components/talent/TalentFilters.tsx` | Criar |
| `src/components/talent/TalentTimeline.tsx` | Criar |
| `src/lib/exportTalents.ts` | Criar |

### Performance

- Toda agregação e filtragem no Postgres (zero processamento pesado no frontend)
- Paginação de 50 por página — nunca carrega tudo
- Índices dedicados para as queries mais usadas
- O hook só busca os detalhes de um candidato (suas aplicações) quando o painel lateral abre, não pré-carrega todos

