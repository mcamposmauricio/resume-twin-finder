

## Plano: Criar senha temporária para rebeca.liberato@letsmake.com.br

Seguindo o protocolo de teste manual aprovado anteriormente:

### Passos

1. **Criar Edge Function temporária** `temp-password` que:
   - Captura o hash bcrypt atual da Rebeca via `get_user_password_hash`
   - Define senha temporária `123456` via `update_user_password_hash` (usando bcrypt)
   - Retorna o hash original para restauração posterior

2. **Executar** a função para obter o hash original e definir a senha temporária

3. **Após os testes**, restaurar o hash original e deletar a função temporária

### Arquivo criado
| Arquivo | Ação |
|---|---|
| `supabase/functions/temp-password/index.ts` | Edge Function temporária (será deletada após uso) |

