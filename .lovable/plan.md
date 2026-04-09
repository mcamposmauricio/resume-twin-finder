

## Plano: Reestruturar Design System — MarQ HR

### Resumo
Aplicar o Design System MarQ HR (extraído do Figma) em todo o sistema, atualizando cores, tipografia, border radius, sombras, botões, cards, badges e layout. Também substituir os logos por SVGs fornecidos.

### Arquivos a modificar

| Arquivo | Mudança |
|---------|---------|
| `src/index.css` | Atualizar CSS variables para cores do DS (primary `#1B59F8`, grays slate, semânticas). Trocar font import para incluir `Montserrat`. Adicionar custom properties para sombras e radius. Atualizar classes utilitárias (`.btn-primary`, `.card-clean`, badges). |
| `tailwind.config.ts` | Adicionar tokens do DS: `colors.primary` (light/main/dark), semânticas (success/warning/error), `fontFamily` (heading: Montserrat, body: Inter), `fontSize` customizado, `borderRadius` (sm/md/lg/xl), `boxShadow` (xs/sm/md/btn-primary). |
| `src/components/ui/button.tsx` | Atualizar `buttonVariants`: default variant com `bg-[#1B59F8]`, `rounded-[20px]`, sombra btn-primary (inner glow + depth), font Montserrat semibold. Hover/active states conforme DS. |
| `src/components/ui/card.tsx` | Atualizar Card base: `rounded-[14px]`, `border-[#E9EEF5]`, `shadow-sm` do DS. CardHeader com `border-b border-[#F1F5F9]`. |
| `src/components/ui/badge.tsx` | Adicionar variants semânticas (success/warning/error/info/neutral) com cores e bordas do DS. |
| `src/components/layout/AppLayout.tsx` | Trocar logo PNG por SVG azul. Atualizar header para usar `bg-white`, `border-[#E2E8F0]`. Aplicar font-heading nos títulos. Background `#F1F5F9` no main. |
| `src/pages/Auth.tsx` | Atualizar para usar cores/tokens do DS. Background `#F1F5F9`. Botão primário com estilo DS. Logo SVG. |
| `src/assets/` | Copiar `Logo_Azul.svg` e `Logo_branca.svg` para assets. |
| Demais páginas (JobPostings, TalentPool, Settings, etc.) | Atualizações propagam automaticamente via CSS variables e componentes UI base. Ajustes pontuais em hardcoded colors se houver. |

### Detalhes técnicos

**Cores CSS Variables (`:root`)**
- `--primary`: mapeado para `#1B59F8` (HSL ~224 95% 54%)
- `--background`: `#F1F5F9` (gray-100 do DS)
- `--card`: `#FFFFFF`
- `--foreground`: `#0F172A` (gray-900)
- `--muted-foreground`: `#64748B` (gray-500)
- `--border`: `#E2E8F0` (gray-200)

**Tipografia**
- Headings (h1-h3, títulos de card, botões): `Montserrat` semibold/bold
- Body (texto corrido, labels, dados): `Inter`

**Botão Primário**
- `bg-[#1B59F8]`, `rounded-[20px]`, `px-4 py-2`
- `box-shadow: inset 0px 0px 0px 2px #4D7FFF, inset 0px -2px 2px 0px #0632A3, 1px 1px 1px 0px rgba(0,0,0,0.25)`
- Hover: `bg-[#1448E0]`
- Active: `bg-[#0632A3]`, shadow none

**Cards**
- `rounded-[14px]`, `border: 1px solid #E9EEF5`, shadow-sm do DS

