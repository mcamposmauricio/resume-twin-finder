

## Ajustes adicionais ao plano

### 1. Esconder elementos para full_access (ja aprovado)
- Remover badge de curriculos, ReferralDialog e "Nova Analise" do menu em `src/pages/JobPostings.tsx` (linhas 171-176 e 186-189)
- Alterar botao "Configurar" para navegar para `/configuracoes?tab=careers` (linha 288)

### 2. Remover "Compartilhar em" de dentro das vagas

O componente `ShareJobLink` exibe botoes de compartilhamento em redes sociais (WhatsApp, LinkedIn, Twitter, Telegram, Email). Sera removido de 3 locais:

- **`src/components/jobs/JobPostingCard.tsx`** (linhas 204-211): Remover o bloco `ShareJobLink` que aparece nos cards de vagas ativas
- **`src/pages/JobPostingDetails.tsx`** (linhas 301-307): Remover o `ShareJobLink` da pagina de detalhes da vaga
- **`src/pages/JobPostingForm.tsx`** (linhas 194-198): Remover o `ShareJobLink` do card de sucesso apos publicacao

Em todos os casos, manter apenas o link copiavel basico se existir, ou remover completamente o componente de compartilhamento.

### 3. Nao adicionar "(Copia)" ao titulo ao usar modelo

No arquivo `src/pages/JobPostingForm.tsx`, linha 85, alterar de:
```
setTitle(clone.title ? `${clone.title} (Cópia)` : '');
```
para:
```
setTitle(clone.title || '');
```

Isso faz com que o titulo do modelo seja usado exatamente como esta, sem o sufixo "(Copia)".

### Arquivos alterados
- `src/pages/JobPostings.tsx` -- Remover badge, ReferralDialog, "Nova Analise"; corrigir link Configurar
- `src/components/jobs/JobPostingCard.tsx` -- Remover ShareJobLink
- `src/pages/JobPostingDetails.tsx` -- Remover ShareJobLink
- `src/pages/JobPostingForm.tsx` -- Remover ShareJobLink e "(Copia)" do titulo
