

## Corrigir overflow de texto no modal de seleção

### Problema

O conteúdo do modal (especialmente as descrições dos modelos de vagas) está transbordando para fora do container do dialog. Isso acontece porque:

1. O `DialogContent` não tem controle de overflow
2. Os textos longos das descrições dos templates (extraídos dos PDFs) não estão sendo contidos corretamente dentro dos botões
3. Os botões da tela de escolha (choice) contêm `<div>` dentro de `<button>`, causando warning de DOM nesting

### Correções no `src/components/jobs/NewJobDialog.tsx`

1. **Adicionar `overflow-hidden`** ao `DialogContent` para impedir que o conteúdo vaze para fora do modal

2. **Trocar os `Button` da tela de escolha por `div` clicáveis** (com role="button" e estilos equivalentes) para eliminar o warning de `<button>` dentro de `<button>`, já que os Button contêm `<div>` internamente

3. **Adicionar `overflow-hidden` e `break-words`** nos containers de texto dos templates para garantir que descrições longas não quebrem o layout

### Alterações específicas

- Linha 95: `DialogContent className="sm:max-w-md overflow-hidden"`
- Linhas 111-157: Trocar os 3 `Button` da tela choice por `div` com `onClick`, `role="button"`, `tabIndex={0}` e classes de estilo equivalentes (`cursor-pointer border rounded-xl p-4 hover:bg-muted transition-colors`)
- Linha 238: Adicionar `overflow-hidden break-words` ao container de texto dos templates
- Linha 240: Adicionar `break-words` ao `line-clamp-2`
