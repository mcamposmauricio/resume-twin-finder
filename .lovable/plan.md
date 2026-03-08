## Plano: Reset temporário de senha com restauração

Sim, é possível. O banco já tem as funções `get_user_password_hash` e `update_user_password_hash`. O fluxo seria:

1. **Ler o hash atual** da senha via `get_user_password_hash` → guardar
2. **Definir senha temporária** via Admin API (`updateUserById`)
3. Testar o login
4. **Restaurar o hash original** via `update_user_password_hash`

### Implementação

Criar uma **edge function temporária** `temp-password` que faz tudo em dois modos:

- `POST { action: "set", email: "..." }` → lê o hash atual, salva na resposta, define senha `Test@123456`
- `POST { action: "restore", user_id: "...", original_hash: "..." }` → restaura o hash original

### Fluxo de uso

1. Chamar com `action: "set"` → receber o `original_hash` na resposta
2. Logar com `123123` e testar
3. Chamar com `action: "restore"` passando o `original_hash` → senha original restaurada
4. Deletar a edge function

### Arquivos


| Arquivo                                     | Ação                                    |
| ------------------------------------------- | --------------------------------------- |
| `supabase/functions/temp-password/index.ts` | Criar (temporária)                      |
| `supabase/config.toml`                      | Adicionar config (será removida depois) |


A senha original fica 100% preservada porque trabalhamos diretamente com o hash bcrypt armazenado.