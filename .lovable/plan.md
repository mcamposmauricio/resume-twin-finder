

## Plano: Extrair dados dos currículos (PDF) para preencher candidaturas vazias

### Contexto

Existem candidaturas com `applicant_name`, `applicant_email` e `form_data` vazios, mas que possuem currículo (PDF) anexado. A única fonte de dados é o próprio PDF.

### Abordagem

Criar uma Edge Function temporária que:

1. Busca todas as candidaturas com `applicant_name IS NULL` e `resume_url IS NOT NULL`
2. Para cada uma, baixa o PDF do storage
3. Envia o conteúdo para o modelo Gemini 2.5 Flash (via Lovable AI) para extrair: nome, email, telefone
4. Atualiza `applicant_name`, `applicant_email` e `form_data` com os dados extraídos

### Edge Function: `extract-application-data`

```
POST /extract-application-data
Body: { "dry_run": true } // preview sem salvar
       { "dry_run": false } // extrai e salva
```

**Fluxo:**
1. Query candidaturas com `applicant_name IS NULL AND resume_url IS NOT NULL`
2. Para cada candidatura:
   - Baixar PDF do bucket `resumes` (ou URL externa)
   - Converter para base64
   - Enviar ao Gemini com prompt: "Extraia nome completo, email e telefone deste currículo. Retorne JSON."
   - Atualizar a row com os dados extraídos
3. Retornar relatório com quantas foram processadas

### Arquivos

| Arquivo | Ação |
|---|---|
| `supabase/functions/extract-application-data/index.ts` | Edge Function temporária |

### Observações
- Função temporária — será deletada após o uso
- Usa `dry_run: true` primeiro para validar antes de salvar
- Processa em lotes para evitar timeout

