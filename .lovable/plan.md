

## Corrigir acesso aos modelos de vagas

### Situacao atual

Os 9 modelos de vagas ja estao cadastrados corretamente na tabela `job_templates` com todos os dados dos PDFs. O problema e que a policy RLS atual tenta acessar `auth.users` diretamente, o que causa erro de permissao (403). A correcao proposta anteriormente (funcao `is_template_authorized_email`) nao foi aplicada.

### O que sera feito

Criar uma migration SQL que:

1. Cria a funcao `is_template_authorized_email()` com `SECURITY DEFINER` que verifica se o email do usuario logado esta na lista autorizada
2. Remove a policy existente que nao funciona
3. Recria a policy usando a nova funcao

### Emails autorizados

- rebeca.liberato@letsmake.com.br
- mauricio@marqponto.com.br
- thaina@marqponto.com.br

### Detalhes tecnicos

**Migration SQL:**

```sql
-- Funcao SECURITY DEFINER para verificar email autorizado
CREATE OR REPLACE FUNCTION public.is_template_authorized_email()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT (SELECT email FROM auth.users WHERE id = auth.uid()) 
    IN ('rebeca.liberato@letsmake.com.br', 'mauricio@marqponto.com.br', 'thaina@marqponto.com.br')
$$;

-- Remover policy antiga
DROP POLICY IF EXISTS "Authorized users can view job templates" ON public.job_templates;

-- Recriar policy com a funcao segura
CREATE POLICY "Authorized users can view job templates"
ON public.job_templates
FOR SELECT
USING (is_template_authorized_email());
```

**Nenhuma alteracao em codigo frontend** - o hook `useJobTemplates.ts` e o `NewJobDialog.tsx` ja estao prontos e funcionando. Apenas a policy do banco precisa ser corrigida para liberar o acesso.

