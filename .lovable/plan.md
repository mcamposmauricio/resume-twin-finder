

## Plano de Implementacao -- 5 Melhorias

### 1. Layout da capa da pagina de carreiras

**Problema**: O texto "Junte-se ao time..." fica sobreposto a imagem de fundo, dificultando a leitura.

**Solucao** em `src/components/careers/CareersHero.tsx`:
- Quando ha imagem hero, renderizar a imagem como um `<img>` em bloco (nao background) seguido do texto abaixo, em vez de sobreposicao
- Quando nao ha imagem, manter o layout atual com gradient

**Solucao** em `src/components/settings/CareersPageTab.tsx`:
- Adicionar um novo toggle "Exibir frase de destaque no banner" (`careers_show_hero_text`) na secao de Secoes Visiveis

**Migracao de banco**: Adicionar coluna `careers_show_hero_text boolean default true` na tabela `profiles`

**Arquivos**: `CareersHero.tsx`, `CareersPageTab.tsx`, `Settings.tsx`, `PublicCareers.tsx` + migracao

---

### 2. Templates de vaga -- requisitos em formato de lista

**Problema**: Ao preencher campos a partir de um template, requisitos aparecem como texto corrido sem quebras de linha.

**Solucao** em `src/pages/PublicApplication.tsx` (linha 318) e `src/pages/JobPostingForm.tsx`:
- Os campos `requirements` e `description` ja usam `whitespace-pre-wrap` na pagina publica -- ok
- O problema esta nos templates do banco (`job_templates`): o conteudo provavelmente ja esta armazenado com `\n` mas ao exibir no `<Textarea>` funciona bem. O problema visual e na pagina publica e nos cards.

**Solucao real**: Nas paginas publicas e cards onde `requirements` e exibido, detectar linhas que comecam com `-` ou `•` ou sao itens numerados e renderizar como `<ul><li>` em vez de `<p>`. Criar um helper `renderFormattedText(text)` que converte texto com quebras em lista HTML quando detecta padrao de lista.

**Arquivos**: Criar `src/lib/formatText.tsx`, atualizar `PublicApplication.tsx`, `CareersJobCard.tsx`

---

### 3. Fluxo do formulario -- retorno apos criar modelo

**Problema**: Ao clicar "Crie um novo" em `JobPostingForm.tsx`, vai para `/formularios/novo`. Apos salvar, volta para `/formularios` em vez de voltar para a criacao da vaga.

**Solucao**:
- Em `JobPostingForm.tsx` linha 303: passar query param `?returnTo=nova-vaga` ao navegar para `/formularios/novo`
- Em `FormTemplateEditor.tsx` linha 150: checar `searchParams.get('returnTo')`. Se for `nova-vaga`, navegar de volta para `/vagas/nova` com state contendo os dados preenchidos e o template recem-criado selecionado
- Alternativa mais simples: usar `navigate(-1)` quando `returnTo` esta presente, mas isso nao garante estado. Melhor: passar o `returnTo` e redirecionar para `/vagas/nova`

**Arquivos**: `JobPostingForm.tsx`, `FormTemplateEditor.tsx`

---

### 4. "Sobre Nos / Nossa Cultura" -- texto completo

**Problema**: `line-clamp-4` em `CareersAbout.tsx` (linhas 37 e 54) trunca o texto e nao ha como expandir.

**Solucao** em `CareersAbout.tsx`:
- Adicionar estado `expanded` por secao
- Remover `line-clamp-4` quando expandido
- Adicionar botao "Ver mais" / "Ver menos" abaixo do texto

**Arquivos**: `CareersAbout.tsx`

---

### 5. Campos separados para Missao, Visao e Valores

**Problema**: Hoje existe apenas um campo generico "Nossa Cultura". O usuario quer campos individuais para Missao, Visao e Valores, cada um ativavel/desativavel.

**Migracao de banco**: Adicionar 6 colunas na tabela `profiles`:
- `company_mission text`
- `company_vision text`
- `company_values text`
- `careers_show_mission boolean default true`
- `careers_show_vision boolean default true`
- `careers_show_values boolean default true`

**Mudancas em codigo**:
- `CompanyInfoTab.tsx`: Adicionar 3 novos `<Textarea>` para Missao, Visao e Valores
- `CareersPageTab.tsx`: Adicionar 3 novos toggles na secao de Secoes Visiveis
- `Settings.tsx`: Incluir novos campos no `ProfileSettings`, `fetchSettings` e `handleSave`
- `CareersAbout.tsx` → renomear para `CareersCompanyInfo.tsx` ou estender: renderizar cards para Sobre Nos, Cultura, Missao, Visao e Valores conforme toggles
- `PublicCareers.tsx`: Passar os novos campos e toggles para o componente

**Arquivos**: Migracao SQL, `CompanyInfoTab.tsx`, `CareersPageTab.tsx`, `Settings.tsx`, `CareersAbout.tsx`, `PublicCareers.tsx`

---

### Resumo de arquivos alterados

| Arquivo | Mudancas |
|---|---|
| Migracao SQL | `careers_show_hero_text`, `company_mission`, `company_vision`, `company_values`, `careers_show_mission`, `careers_show_vision`, `careers_show_values` |
| `CareersHero.tsx` | Layout imagem acima + texto abaixo; respeitar toggle de texto |
| `CareersAbout.tsx` | Expandir texto completo; adicionar Missao/Visao/Valores |
| `CareersPageTab.tsx` | Toggles para hero text, missao, visao, valores |
| `CompanyInfoTab.tsx` | Campos Missao, Visao, Valores |
| `Settings.tsx` | Novos campos no state, fetch e save |
| `PublicCareers.tsx` | Passar novos props |
| `src/lib/formatText.tsx` | Helper para renderizar texto como lista |
| `PublicApplication.tsx` | Usar helper de formatacao nos requisitos |
| `JobPostingForm.tsx` | Passar returnTo ao criar modelo |
| `FormTemplateEditor.tsx` | Respeitar returnTo para voltar a criacao de vaga |

