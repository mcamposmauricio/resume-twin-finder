

## Plano: Correcoes para Migracao de Dados Externos

Sao 5 pontos problematicos identificados na query `insert_migration_1.sql`. Proponho correcoes tanto na **query SQL** quanto no **codigo do sistema** para garantir compatibilidade com dados migrados.

---

### 1. HTML nas descricoes → Suporte a renderizacao HTML

**Problema**: Campos `description` e `requirements` contem HTML (`<ul>`, `<li>`, `&aacute;` etc). O sistema renderiza texto plano.

**Correcao no codigo** (nao na query): Atualizar `src/lib/formatText.tsx` para detectar conteudo HTML e renderizar com `dangerouslySetInnerHTML` (sanitizado). Atualizar `PublicApplication.tsx` (linha 314) para usar `renderFormattedText` tambem no campo `description`. Isso beneficia tanto dados migrados quanto futuros conteudos.

**Arquivos**: `src/lib/formatText.tsx`, `src/pages/PublicApplication.tsx`

---

### 2. Slugs malformados → Normalizar na query

**Problema**: `public_slug` contem acentos, barras, parenteses (ex: `líder-de-operação-de-loja---natal/rn`).

**Correcao na query**: Fornecer uma funcao SQL `normalize_slug(text)` que remove acentos via `unaccent`, substitui caracteres especiais por hifens, e limpa duplicatas. Aplicar nos INSERTs. Tambem garantir unicidade adicionando sufixo numerico se necessario.

**Acao**: Gerar query corrigida com slugs normalizados.

---

### 3. URLs externas de curriculo (Azure) → Adaptar codigo

**Problema**: `resume_url` aponta para Azure Blob Storage. O `getResumeUrl` tenta gerar signed URL do bucket interno e falha.

**Correcao no codigo**: Em `useJobApplications.ts`, modificar `getResumeUrl` para detectar URLs externas (comecam com `http`) e retorna-las diretamente sem passar pelo storage. Mesma logica no `downloadResume`.

Em `ApplicationDetailPanel.tsx`, o iframe de preview ja funciona com URL direta -- nao precisa mudar.

**Arquivos**: `src/hooks/useJobApplications.ts`

---

### 4. `resume_filename` com URL completa → Corrigir na query

**Problema**: Alguns registros tem a URL completa no campo `resume_filename` em vez de apenas o nome do arquivo.

**Correcao na query**: Extrair apenas o nome do arquivo da URL usando `substring` ou regex. Para valores invalidos (ex: `'Pdf'`, `'Doce'`), setar como NULL.

---

### 5. `salary_range` com ponto-e-virgula → Corrigir na query

**Problema**: Valores como `R$ 1;540.00` usam `;` como separador de milhar.

**Correcao na query**: Substituir `;` por `.` nos valores de `salary_range`.

---

### Resumo de mudancas

| Local | Mudanca |
|---|---|
| `src/lib/formatText.tsx` | Detectar HTML e renderizar com sanitizacao |
| `src/pages/PublicApplication.tsx` | Usar `renderFormattedText` no campo `description` |
| `src/hooks/useJobApplications.ts` | `getResumeUrl`/`downloadResume`: suportar URLs externas |
| Query SQL (fornecida ao usuario) | Normalizar slugs, corrigir `resume_filename`, corrigir `salary_range` |

