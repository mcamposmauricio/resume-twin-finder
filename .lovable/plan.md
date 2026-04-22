

## Plano: Substituir navbar superior por menu lateral (sidebar)

### Referência visual
Baseado no print enviado: sidebar à esquerda com logo CompareCV no topo, campo de busca, item "Plataforma MarQHR" com badge "Completo!", menu principal (Vagas, Talentos, Formulários, Atividades, Configurações, Central de ajuda) e card de perfil do usuário no rodapé com avatar, nome e função.

### Mudanças

| Arquivo | Mudança |
|---------|---------|
| `src/components/layout/AppSidebar.tsx` | Reescrever do zero seguindo o design do print: header com logo CompareCV, campo de busca, item "Plataforma MarQHR" com badge "Completo!" (link externo para marqhr.com), grupo de navegação principal (Vagas, Talentos, Formulários, Atividades [admin], Configurações), item "Central de ajuda" no fim do grupo. Footer com card do usuário (avatar circular, nome/email, role) + dropdown com Ver perfil / Configurações de conta / Alterar senha / Sair. Usa `Sidebar collapsible="icon"` para colapsar para modo mini (apenas ícones). |
| `src/components/layout/AppLayout.tsx` | Substituir o header com nav inline por estrutura `SidebarProvider` + `AppSidebar` + área de conteúdo. Header superior fica fino (h-12), contendo apenas o `SidebarTrigger` à esquerda (sempre visível para abrir/fechar) e à direita o seletor "Company User Name" (dropdown de empresa, conforme print). Remover navItems daqui. Footer permanece igual mas dentro da área de conteúdo. |
| `src/components/layout/UserProfileCard.tsx` (novo) | Card de usuário no rodapé da sidebar: avatar (gerado por iniciais ou placeholder), nome, função/email, e botão de menu (três traços) que abre um popover com as ações de conta. |
| `src/components/layout/CompanySelector.tsx` (novo) | Botão pill no header com avatar da empresa + nome truncado + chevron, abre dropdown (placeholder por enquanto, já que sistema é single-tenant). |

### Estrutura de navegação

```text
Sidebar (esquerda, 256px expandida / 48px colapsada)
├── Header
│   ├── Logo CompareCV (azul)
│   └── Botão fechar (visível quando aberta)
├── Search input "Buscar"
├── Plataforma MarQHR  [badge "Completo!"] → link externo marqhr.com
├── Separador
├── Menu principal
│   ├── Vagas
│   ├── Talentos
│   ├── Formulários
│   ├── Atividades (admin only)
│   └── Configurações
├── Central de ajuda (link suporte)
└── Footer
    └── UserProfileCard
        ├── Avatar + Nome + Role/email
        └── Menu (⋮) → Ver perfil / Config. conta / Alterar senha / Sair

Header superior (fino, h-12)
├── SidebarTrigger (☰ Menu) — sempre visível
└── CompanySelector (direita)
```

### Detalhes técnicos

- **Sidebar component**: usa o shadcn `Sidebar` com `collapsible="icon"` para garantir trigger sempre visível mesmo colapsada.
- **Active state**: `NavLink` com `activeClassName="bg-primary/10 text-primary font-medium"` (já no padrão do projeto).
- **"Início"** do print: mapear para `/vagas` (página principal atual) ou criar rota `/inicio` no futuro — por enquanto, **omitir** "Início" e usar Vagas como home, mantendo paridade com a estrutura atual.
- **Busca**: input visual sem lógica nesta primeira versão (placeholder para feature futura).
- **Plataforma MarQHR**: link externo `https://marqhr.com/` com badge azul "Completo!" usando `Badge` variant info.
- **Central de ajuda**: link para `mailto:suporte@marqhr.com` ou URL de help center (placeholder por enquanto).
- **Avatar**: gerar fallback com iniciais do `userEmail` via componente `Avatar` do shadcn.
- **Mobile**: sidebar vira off-canvas automático via `Sheet` (já no shadcn Sidebar).
- **Mantém**: todas as rotas existentes, lógica de admin (`mauricio@`/`marco@`), AuthProvider, footer "powered by MarQ HR".

### Arquivos não alterados
Páginas internas (JobPostings, TalentPool, etc.) continuam usando `<AppLayout>` sem nenhuma mudança — a substituição é transparente.

