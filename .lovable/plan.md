

## Plano: Substituir sidebar por navegação compacta no header

### Conceito

Remover a sidebar completamente e colocar a navegação como **abas/botões inline no header**, ao lado do logo. Fica mais compacto, sem ocupar espaço lateral, e toda a largura da tela fica disponível para o conteúdo.

```text
┌─────────────────────────────────────────────────────────┐
│ CompareCV  │ [Vagas] [Talentos] [Formulários] [⚙️]  │ user@  [↪]│
└─────────────────────────────────────────────────────────┘
│                                                         │
│                    conteúdo (100% largura)               │
│                                                         │
```

Em mobile, os itens ficam como ícones compactos (sem texto) para caber na mesma linha.

### Mudanças

| Arquivo | Ação |
|---|---|
| `src/components/layout/AppLayout.tsx` | Remover `SidebarProvider`, `AppSidebar`, `SidebarTrigger`. Adicionar nav inline no header com `NavLink` para cada rota. |
| `src/components/layout/AppSidebar.tsx` | Manter arquivo (não deletar), mas não será mais importado. |

### Header resultante

- Logo "CompareCV" à esquerda
- Nav items como botões/abas com ícone + texto (em desktop), só ícone (em mobile)
- Item ativo com estilo destacado (underline ou bg-primary/10)
- User email + logout à direita (como está hoje)
- Admin "Atividades" aparece condicionalmente

### Sem outras mudanças

- Nenhuma página precisa ser alterada (todas já usam `<AppLayout>`)
- Footer permanece igual
- Auth guard permanece igual

