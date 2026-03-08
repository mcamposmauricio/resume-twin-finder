

## Analise da Query `insert_migration_2.sql`

A query contem **14 vagas** (linhas 4-16) e **~178 candidaturas** (linhas 22-199), todas para o user `DF2A4ABF-6754-447B-A179-E02D4D16B502` (Lets Make). Ambos os INSERTs usam `ON CONFLICT (id) DO NOTHING`.

---

### Problemas Identificados

**1. RLS vai bloquear os INSERTs (CRITICO)**

- `job_postings` tem policy INSERT: `auth.uid() = user_id`. Sem estar logado como esse usuario, o INSERT falha.
- `job_applications` tem policy INSERT: `job_posting_id IN (SELECT id FROM job_postings WHERE status = 'active')`. Porem **10 das 14 vagas tem status `closed`**, entao as candidaturas dessas vagas serao rejeitadas pelo RLS.
- **Solucao**: A query precisa ser executada com privilegios de service role (que bypassa RLS). Vou gerar a query corrigida envolta em bloco que desabilita temporariamente RLS nas duas tabelas, executa os inserts, e reabilita.

**2. Slugs com acentos e caracteres especiais**

Exemplos: `líder-de-operação-de-loja---natal/rn---partage-norte`, `operador(a)-de-loja---maceió/al--pátio-maceió`

Caracteres como `í`, `ã`, `ç`, `/`, `(`, `)` vao quebrar URLs.

**Correcao na query**: Normalizar cada slug manualmente para ASCII sem acentos, barras ou parenteses.

**3. `salary_range` com ponto-e-virgula**

Exemplos: `R$ 1;540.00`, `R$ 2;000.00`

**Correcao na query**: Trocar `;` por `.` em todos os valores.

**4. `resume_filename` contem URL completa**

Em vez do nome do arquivo, contem a URL inteira do Azure. O sistema ja suporta URLs externas no `resume_url` (correcao anterior), mas o `resume_filename` deveria ser so o nome do arquivo para exibicao na UI.

**Correcao na query**: Extrair o UUID + extensao da URL ou setar como `curriculo.pdf` para todos.

**5. Location invalido**

Linhas 5 e 14: `location` = `','` (apenas virgula). Isso aparece feio na UI.

**Correcao na query**: Substituir por NULL.

**6. HTML nas descricoes**

As descricoes contem HTML com entities (`&aacute;`, `&ccedil;`) e tags (`<ul>`, `<li>`, `<h3>`). O codigo ja foi atualizado para renderizar HTML sanitizado via `renderFormattedText` -- **nenhuma correcao necessaria**.

**7. URLs externas de curriculo**

Todas apontam para Azure Blob Storage. O `getResumeUrl` e `downloadResume` ja foram atualizados para suportar URLs externas -- **nenhuma correcao necessaria**.

---

### Plano de Implementacao

**Gerar query SQL corrigida** (`docs/insert_migration_corrected.sql`) com:

1. Bloco `BEGIN/COMMIT` com desabilitacao temporaria de RLS nas tabelas `job_postings` e `job_applications` para permitir inserts com service role
2. Slugs normalizados (sem acentos, sem `/()`, hifens limpos)
3. `salary_range` corrigido (`; -> .`)
4. `resume_filename` extraido da URL (apenas o nome do arquivo PDF)
5. `location` = `','` substituido por NULL
6. Manter `ON CONFLICT (id) DO NOTHING` para seguranca

Nenhuma mudanca de codigo e necessaria -- todas as adaptacoes de UI (HTML, URLs externas) ja foram implementadas anteriormente.

### Arquivos

| Arquivo | Acao |
|---|---|
| `docs/insert_migration_corrected.sql` | Atualizar com a query corrigida pronta para rodar no banco |

