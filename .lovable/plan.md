

## Diagnóstico: Duplicidade de Requisitos nas Vagas

**Problema confirmado**: As vagas criadas a partir de templates (importados do HR Hub) contêm os requisitos **duas vezes**:

1. **Dentro do campo `description`** — o HTML da descrição já inclui uma seção `<h3>Requisitos:</h3>` com `<ul><li>` items
2. **No campo separado `requirements`** — com os mesmos dados em texto plano

Na exibição (página pública e detalhes da vaga), o código renderiza a `description` completa e depois adiciona uma seção "Requisitos" separada com o conteúdo de `requirements`, gerando duplicidade.

**Escopo**: 20+ vagas desse usuário são afetadas.

### Correções

**1. Fix na exibição — Detectar e ocultar requisitos duplicados**

Em `PublicApplication.tsx` e `JobPostingDetails.tsx`: antes de renderizar a seção separada de "Requisitos", verificar se a `description` já contém um bloco de requisitos (checando por `<h3>Requisitos` ou padrão similar). Se já contiver, não renderizar a seção separada.

```typescript
const descriptionHasRequirements = job.description?.toLowerCase().includes('requisitos');
// Só renderizar seção separada se description não tiver requisitos embutidos
{job.requirements && !descriptionHasRequirements && (
  <>
    <Separator />
    <h4>Requisitos</h4>
    ...
  </>
)}
```

**2. Fix nos dados existentes (opcional, recomendado)**

Limpar o campo `requirements` das vagas onde a `description` já contém os requisitos, evitando a duplicidade na fonte. Isso pode ser feito via SQL para as vagas afetadas.

### Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `src/pages/PublicApplication.tsx` | Condicional para não duplicar requisitos |
| `src/pages/JobPostingDetails.tsx` | Mesma condicional |

