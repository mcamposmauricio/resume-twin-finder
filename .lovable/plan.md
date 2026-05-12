## Problema

O popup do SSO MarQ HR não fecha porque:

1. `LoginHub.tsx` detecta popup via `window.opener && window.opener !== window`
2. Após o redirect cross-origin para `https://sso.marqhr.com` e volta para `/login-hub`, o browser zera `window.opener` (política COOP / navegação cross-origin)
3. Resultado: a checagem falha, o branch de `window.close()` nunca roda e a tela de login manual aparece dentro do popup

`postMessage(window.opener, ...)` também não funcionaria pelo mesmo motivo.

## Correção

Trocar a forma de detectar e de comunicar com a janela pai por algo que sobreviva à navegação cross-origin.

### `src/pages/Auth.tsx` (`handleMarqHrLogin`)

- Manter `window.open(..., 'marqhr-sso', ...)` (o segundo argumento já é o `window.name` que persiste no popup mesmo após o redirect)
- Adicionar um `BroadcastChannel('marqhr-sso')` ao montar o componente

### `src/pages/Auth.tsx` (listener)

- Substituir o listener `window.addEventListener('message', ...)` por um listener no `BroadcastChannel('marqhr-sso')`
- Ao receber `{ type: 'marqhr-sso', access_token }`, executar o mesmo fluxo atual (`exchange-hub-token` → `setSession`)
- Fechar e desinscrever o canal no cleanup

### `src/pages/LoginHub.tsx` (branch popup)

- Trocar a detecção por `window.name === 'marqhr-sso'` (sobrevive ao cross-origin)
- Coletar todos os `searchParams` num objeto `payload` e fazer `console.log('MarQ HR SSO callback JSON:', payload)` (mantém o comportamento já solicitado)
- Postar via `BroadcastChannel('marqhr-sso')` com `{ type: 'marqhr-sso', ...payload }` (envia `access_token`, `refresh_token` etc.)
- Chamar `window.close()` em seguida; como fallback, exibir uma mensagem curta "Pode fechar esta janela" caso o browser bloqueie o close

### Notas técnicas

- `BroadcastChannel` funciona entre janelas da mesma origin (Auth e LoginHub estão ambas em `app.marqtalent.com.br` / preview), então é o canal certo aqui
- Não mexer no edge function `exchange-hub-token` nem em backend
- Sem mudanças de UI visíveis fora do popup
