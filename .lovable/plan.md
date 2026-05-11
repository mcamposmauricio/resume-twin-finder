## Objetivo

Refazer o layout da página `src/pages/Auth.tsx` para reproduzir o layout do print: tela dividida em duas colunas, lado esquerdo azul (gradient primary) com logo, headline grande, subtítulo e lista de bullets verdes; lado direito branco com o card de login (Google + Email/Senha + botão "Logar com a MarQ HR" mantido). Usaremos as cores atuais do design system (primary `#1B59F8`) — não as cores do TrackFlow — e textos da MarQTalent.

## Layout

```
┌────────────────────────────┬──────────────────────────────┐
│ [Logo branca]              │                              │
│                            │     Entrar na sua conta      │
│                            │   Acesse seu portal de vagas │
│ Recrute melhor —           │                              │
│ do anúncio da vaga         │   [ Continuar com Google ]   │
│ à contratação.             │   ──────── ou ────────       │
│                            │   Email   [_____________]    │
│ Portal de vagas, pipeline  │   Senha   [_____________]    │
│ e banco de talentos em     │              Esqueceu senha? │
│ um só lugar.               │   [        Entrar         ]  │
│                            │   ──────── ou ────────       │
│ ✓ Publique vagas ...       │   [ Logar com a MarQ HR  ]   │
│ ✓ Receba candidaturas ...  │                              │
│ ✓ Pipeline visual ...      │   Não tem conta? Criar agora │
│ ✓ Banco de talentos ...    │                              │
│                            │   ✓ Sem cartão  ✓ Comece já  │
└────────────────────────────┴──────────────────────────────┘
```

- Mobile: empilhar — coluna azul vira um header curto, formulário abaixo.

## Conteúdo (textos)

Lado esquerdo (sobre fundo azul, texto branco):
- Logo branca (`@/assets/Logo_branca.svg`) no topo.
- Headline: **"Recrute melhor — do anúncio da vaga à contratação."**
- Subtítulo: "Portal de vagas, pipeline de recrutamento e banco de talentos em um só lugar. Feito para times de RH e gestores que contratam com agilidade."
- Bullets (ícone check verde):
  - Publique vagas com página de carreiras própria
  - Receba candidaturas com formulários personalizados
  - Organize seu pipeline em Kanban visual
  - Centralize todo o seu banco de talentos

Lado direito (card de login, mantém comportamento atual):
- Título: "Entrar na sua conta" / "Criar sua conta"
- Subtítulo: "Digite suas credenciais para acessar a MarQTalent" / "Comece a usar a MarQTalent gratuitamente"
- Botão Google ("Continuar com Google") no topo (já existe? — se não, manter sem; ver Notas)
- Divisor "ou"
- Inputs Email / Senha (e demais campos do signup) — mantidos
- Link "Esqueceu a senha?" (mantém)
- Botão **Entrar** primário azul
- Divisor "ou"
- Botão **Logar com a MarQ HR** (mantém, estilo secundário/outline para não competir com Entrar)
- Link "Não tem conta? Criar agora"
- Trust signals abaixo: "✓ Sem cartão de crédito" e "✓ Comece em poucos minutos"

Footer (rodapé inferior direito ou abaixo do card): "© 2026 MarQTalent powered by [logo MarQ]" — mantém.

## Detalhes técnicos

- Editar apenas `src/pages/Auth.tsx`. Sem mudanças em lógica de auth, validação, signup ou tracking — só reorganização de JSX/Tailwind.
- Container raiz: `min-h-screen grid lg:grid-cols-2`.
- Coluna esquerda: `bg-gradient-to-br from-primary to-primary-dark text-primary-foreground p-12 hidden lg:flex flex-col justify-between` (em mobile vira `bg-primary` compacto no topo).
- Coluna direita: `bg-background flex items-center justify-center p-6 lg:p-12`, contendo o card existente (`max-w-md`).
- Bullets: ícone `CheckCircle` em círculo verde (`bg-success/20 text-success` ou verde sólido) + texto branco.
- Manter cores do design system (`primary`, `primary-foreground`, `card`, `foreground`, `muted-foreground`, `success`). Não usar cores hardcoded.
- Inverter o par de botões: **"Entrar"** volta a ser primário azul (estilo padrão `bg-primary`), e **"Logar com a MarQ HR"** vira estilo secundário (`bg-card border border-border`) para hierarquia visual coerente com o print, onde o CTA principal é o login direto.
- Remover a hero section atual no topo ("Seu portal de vagas completo / para recrutar melhor") e os 3 cards de passos do meio — substituídos pela coluna azul.
- Botão Google: **não há login Google implementado hoje** — ver pergunta abaixo.

## Pergunta antes de implementar

O print mostra um botão "Continuar com Google" no topo do form. Hoje o projeto **não tem login Google ativo**. Posso:
1. Adicionar login Google via Lovable Cloud (recomendado), OU
2. Pular o botão Google e manter apenas Email/Senha + MarQ HR.

Vou assumir **opção 2 (sem Google)** salvo orientação contrária — assim a entrega visual fica idêntica ao print exceto por esse botão, sem mexer em backend.
