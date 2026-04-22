
## Plano: corrigir tela branca causada por erro de hook do React

### Diagnóstico
O problema não está na lógica do `AuthContext` em si. O `AuthProvider` está usando hooks de forma válida, mas o erro `Cannot read properties of null (reading 'useState')` indica um cenário de **invalid hook call** durante o boot da aplicação.

Pelo código atual, a causa mais provável é:
1. **React sendo carregado/bundlado em mais de uma instância** no ambiente do Vite, ou
2. **cache pré-bundlado do Vite inconsistente** após as mudanças recentes de layout/sidebar e novas dependências de UI.

### O que será feito

#### 1) Forçar resolução única de React no Vite
Atualizar `vite.config.ts` para garantir que `react` e `react-dom` sejam sempre deduplicados no bundle.

**Arquivo**
- `vite.config.ts`

**Mudança**
- Adicionar `resolve.dedupe: ['react', 'react-dom']`
- Se necessário, complementar com alias explícito para a mesma origem de `react` e `react-dom`

Isso evita que componentes diferentes acabem consumindo instâncias diferentes do React em tempo de execução.

#### 2) Normalizar a estratégia de dependências
O projeto hoje mantém **mais de um lockfile** (`package-lock.json`, `bun.lock`, `bun.lockb`), o que aumenta o risco de resolução inconsistente entre ambientes.

**Arquivos impactados**
- `package-lock.json`
- `bun.lock`
- `bun.lockb`

**Mudança**
- Padronizar para **um único gerenciador de pacotes**
- Remover os lockfiles extras para evitar instalações divergentes no ambiente de build/preview

#### 3) Limpar o cache pré-bundlado do Vite
Depois da correção de resolução, será necessário reconstruir o cache do bundler.

**Ação necessária**
- Limpar o cache de dependências geradas pelo Vite
- Reinstalar dependências de forma consistente
- Reiniciar o preview

Isso é importante porque o erro atual pode persistir mesmo com código correto, se o preview continuar usando bundle antigo corrompido.

#### 4) Validar o boot mínimo da aplicação
Após a correção, validar esta sequência:
- `src/main.tsx` monta a aplicação normalmente
- `src/App.tsx` renderiza `AuthProvider` sem crash
- rotas `/auth` e `/vagas` deixam de exibir tela branca
- componentes novos de layout (`AppLayout`, `AppSidebar`, `UserProfileCard`, `CompanySelector`) carregam sem provocar novo erro de runtime

### Arquivos a revisar/ajustar
| Arquivo | Ajuste |
|---|---|
| `vite.config.ts` | Deduplicar `react` e `react-dom` |
| `package-lock.json` / `bun.lock` / `bun.lockb` | Manter apenas um lockfile oficial |
| ambiente de build/cache | Limpar cache do Vite e reconstruir dependências |

### Resultado esperado
- A tela branca some
- O `AuthProvider` volta a renderizar normalmente
- O sistema carrega novamente em `/auth` e `/vagas`
- O novo layout com menu lateral passa a aparecer sem quebrar o boot do app

### Observação técnica
O código lido em `AuthContext.tsx`, `App.tsx`, `AppLayout.tsx` e `AppSidebar.tsx` não mostra uso inválido de hooks. Por isso, a correção deve focar primeiro em **resolver o bundling do React**, não em reescrever o contexto de autenticação.
