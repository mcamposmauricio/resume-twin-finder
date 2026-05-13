## Objetivo
Transformar o menu lateral em um painel flutuante que sobrepõe a página, sem empurrar o conteúdo principal quando aberto.

## Comportamento desejado
- Conteúdo principal permanece estático ao abrir/fechar o menu.
- Sidebar aparece sobreposta (camada acima), com o overlay escuro já existente atrás dela.
- Fecha ao clicar no overlay, no botão de fechar ou em um item de navegação (já implementado).
- Mobile continua usando o Sheet do shadcn (já é overlay nativo) — sem mudanças.

## Mudanças técnicas

**`src/components/layout/AppLayout.tsx`**
- Remover `<AppSidebar />` da árvore flex que divide espaço com o conteúdo.
- Renderizá-la em posição fixa/absoluta sobre a página (via wrapper com `fixed inset-y-0 left-0 z-40`) apenas quando `open` for true no desktop.
- Manter `SidebarOverlay` como está (já é `fixed`).
- O `<div className="flex-1 flex flex-col min-w-0">` passa a ocupar 100% da largura sempre.

**`src/components/layout/AppSidebar.tsx`**
- Sem mudanças estruturais. Continua usando `collapsible="offcanvas"`, que no desktop renderiza via slot fixo — o ajuste no AppLayout garante que ela não participe do fluxo flex.

Alternativa considerada (descartada): trocar para `Sheet` no desktop também. Mais invasivo e perde o estilo atual da sidebar. A abordagem acima reaproveita o componente existente.

## Arquivos
- `src/components/layout/AppLayout.tsx` (editar)
