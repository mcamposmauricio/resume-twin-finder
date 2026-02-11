

## Corrigir modal de seleção de modelo de vaga

### Problemas identificados

1. **Titulo incorreto**: O titulo do dialog mostra "Selecione a vaga para clonar" quando esta no modo template. Deveria mostrar "Selecione o modelo" para o modo template.

2. **Warning de acessibilidade**: O dialog nao tem `DialogDescription`, gerando warning no console ("Missing Description or aria-describedby").

3. **Warning de ref**: O `DialogHeader` e um function component sem `forwardRef`, gerando warning quando o Radix tenta passar ref.

### Correções no arquivo `src/components/jobs/NewJobDialog.tsx`

**Linha 97 - Titulo condicional para 3 modos:**
```
{mode === 'choice' ? 'Criar Nova Vaga' : mode === 'clone' ? 'Selecione a vaga para clonar' : 'Selecione o modelo'}
```

**Adicionar `DialogDescription`** importando do dialog e incluindo uma descricao visualmente oculta para acessibilidade (usando `className="sr-only"`).

### Nenhuma outra alteracao necessaria

O restante do componente (busca, lista de templates, navegacao) esta funcionando corretamente.

