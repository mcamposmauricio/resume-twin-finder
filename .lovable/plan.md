

## Plano: Prevenir candidaturas duplicadas no formulário público

### Abordagem

Duas camadas de proteção: **banco de dados** (constraint unique) + **frontend** (verificação antes do envio).

### 1. Migration — Unique constraint parcial

```sql
CREATE UNIQUE INDEX idx_unique_application_per_email_job
ON public.job_applications (job_posting_id, lower(applicant_email))
WHERE applicant_email IS NOT NULL;
```

Isso impede duplicatas no nível do banco, mesmo que o frontend falhe.

### 2. Frontend — Verificação no `handleSubmit` (PublicApplication.tsx)

Antes de fazer upload do currículo, consultar se já existe candidatura com o mesmo email naquela vaga:

```typescript
// Check for duplicate application
const emailField = fields.find(f => f.type === 'email');
const applicantEmail = emailField ? formValues[emailField.id] : null;

if (applicantEmail) {
  const { data: existing } = await supabase
    .from('job_applications')
    .select('id')
    .eq('job_posting_id', job.id)
    .ilike('applicant_email', applicantEmail)
    .maybeSingle();

  if (existing) {
    toast({
      title: 'Candidatura já registrada',
      description: 'Você já se candidatou para esta vaga com este e-mail.',
      variant: 'destructive',
    });
    setSubmitting(false);
    return;
  }
}
```

**Problema de RLS**: A política SELECT atual só permite que o dono da vaga veja candidaturas. Precisamos de uma policy adicional para permitir que usuários anônimos verifiquem se já existe candidatura pelo email:

```sql
CREATE POLICY "Public can check own application exists"
ON public.job_applications
FOR SELECT
TO public
USING (
  job_posting_id IN (
    SELECT id FROM job_postings WHERE status = 'active'
  )
);
```

Porém isso exporia dados de candidaturas. Alternativa mais segura: usar uma **database function** `SECURITY DEFINER`:

```sql
CREATE OR REPLACE FUNCTION public.check_duplicate_application(
  _job_posting_id uuid,
  _email text
) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM job_applications
    WHERE job_posting_id = _job_posting_id
    AND lower(applicant_email) = lower(_email)
  )
$$;
```

No frontend, chamar via `supabase.rpc('check_duplicate_application', { ... })`.

### Arquivos modificados

| Arquivo | Mudança |
|---|---|
| Migration SQL | Unique index + função `check_duplicate_application` |
| `src/pages/PublicApplication.tsx` | Verificação via RPC antes do submit |

### Build error existente

Corrigir `src/pages/Index.tsx` linha 37 — remover referência a `NodeJS` namespace (usar `ReturnType<typeof setTimeout>`).

