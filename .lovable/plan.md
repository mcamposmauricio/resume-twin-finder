

## Plano: Trigger "☰ Menu" no header e sidebar offcanvas

### Referência visual
Print mostra um botão "**≡ Menu**" (ícone + label) no canto superior esquerdo do header, indicando que a sidebar está totalmente fechada. Ao clicar, ela abre por cima/empurra o conteúdo. Quando aberta, o mesmo botão fecha a sidebar.

### Mudanças

| Arquivo | Mudança |
|---|---|
| `src/components/layout/AppSidebar.tsx` | Trocar `collapsible="icon"` por `collapsible="offcanvas"` para que a sidebar **suma totalmente** quando fechada (em vez de virar uma faixa de ícones). Remover toda a lógica condicional `collapsed ? ... : ...` (logo "C" mini, ocultar labels, etc.) — quando offcanvas a sidebar só é renderizada no estado expandido, então sempre mostramos logo + busca + labels completos. Manter o resto da estrutura igual. |
| `src/components/layout/AppLayout.tsx` | Substituir o `<SidebarTrigger />` (que só mostra o ícone) por um botão customizado com **ícone `Menu` + label "Menu"** lado a lado, usando `useSidebar()` para chamar `toggleSidebar()`. Estilo: `ghost` button, `gap-2`, `text-sm`, `font-body`, `text-muted-foreground hover:text-foreground`. O botão fica sempre visível no header (h-12), independentemente do estado da sidebar. |

### Detalhes técnicos

- **Comportamento offcanvas**: o componente `Sidebar` do shadcn já suporta `collapsible="offcanvas"` nativamente — quando fechada, ela desliza para fora da tela (`left: -var(--sidebar-width)`) e o conteúdo principal ocupa 100% da largura.
- **Trigger sempre visível**: como o botão fica no `<header>` do `AppLayout` (fora da sidebar), ele permanece visível em ambos os estados. Usar o hook `useSidebar()` em vez do componente `SidebarTrigger` para customizar a aparência (ícone + texto).
- **Estado inicial**: manter `defaultOpen` padrão (`true`) do `SidebarProvider`, mas em mobile a sidebar já abre como sheet automaticamente.
- **Código do novo trigger** (no header):
  ```tsx
  const { toggleSidebar } = useSidebar();
  <Button variant="ghost" size="sm" onClick={toggleSidebar} className="gap-2 font-body">
    <Menu className="h-4 w-4" />
    <span className="text-sm">Menu</span>
  </Button>
  ```
  Como `useSidebar()` precisa estar dentro do `SidebarProvider`, extrair o header para um pequeno componente interno `<TopHeader />` declarado dentro do mesmo arquivo, ou mover apenas o botão para um componente `MenuToggle`.

### Estrutura resultante
```text
Header (h-12, sempre visível)
├── [☰ Menu]  ← clica para abrir/fechar a sidebar
└── CompanySelector

Sidebar (offcanvas)
├── Estado fechado: completamente fora da tela, conteúdo ocupa 100%
└── Estado aberto: 256px, empurra/sobrepõe o conteúdo
```

### Arquivos não alterados
`UserProfileCard.tsx`, `CompanySelector.tsx`, páginas internas e demais componentes — a mudança é isolada ao layout de navegação.

