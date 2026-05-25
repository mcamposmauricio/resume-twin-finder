## Objetivo
Substituir o email `rebeca.liberato@letsmake.com.br` por `anne.caroline.osorio@gmail.com` para o mesmo usuário (user_id `df2a4abf-6754-447b-a179-e02d4d16b502`), mantendo todo o histórico, perfil, roles, vagas e permissões intactos. Apenas a forma de login e a identificação visual mudam.

## Mudanças

### 1. Atualizar email no `auth.users`
- `UPDATE auth.users SET email = 'anne.caroline.osorio@gmail.com', email_confirmed_at = COALESCE(email_confirmed_at, now()) WHERE id = 'df2a4abf-6754-447b-a179-e02d4d16b502'`

### 2. Atualizar email no `public.profiles`
- `UPDATE profiles SET email = 'anne.caroline.osorio@gmail.com' WHERE user_id = 'df2a4abf-...'`

### 3. Atualizar função `is_template_authorized_email`
Hoje a função libera acesso a templates apenas para alguns emails fixos. Trocar `rebeca.liberato@letsmake.com.br` por `anne.caroline.osorio@gmail.com` na lista, mantendo os admins Mauricio, Thaina e Marco.

### 4. Atualizar logs antigos (opcional, mas recomendado para consistência)
- `UPDATE activity_logs SET user_email = 'anne.caroline.osorio@gmail.com' WHERE user_id = 'df2a4abf-...'`

## Observações
- O `user_id` permanece o mesmo, portanto todas as FKs (job_postings, applications, roles, etc.) continuam funcionando sem migração.
- O email novo é Gmail (não corporativo), mas a validação `is_corporate_email` só roda no signup (`handle_new_user`), não em update — sem impacto.
- A Anne deverá fazer login com o novo email. Se ela não souber a senha atual da Rebeca, será preciso usar o fluxo de reset de senha (`temp-password` ou "esqueci minha senha").
- Como é mudança de dados (não schema), uso a tool de insert/update — sem migration.
