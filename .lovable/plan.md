

## Correção: Upload de currículo em mobile + mensagens de erro amigáveis

### Problema
O upload de currículo falha em mobile quando o nome do arquivo contém acentos/caracteres especiais. Além disso, as mensagens de erro são genéricas e não orientam o usuário.

### Correções em `src/pages/PublicApplication.tsx`

**1. Sanitizar nome do arquivo**
```typescript
const sanitize = (name: string) =>
  name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9._-]/g, '_');
```

**2. Validação de tamanho (5MB)**
Antes do upload, rejeitar arquivos grandes com mensagem clara.

**3. Mensagens de erro amigáveis e orientadoras**

| Situação | Mensagem atual | Nova mensagem |
|---|---|---|
| Arquivo muito grande | *(nenhuma)* | "Seu arquivo excede o limite de 5MB. Tente salvar o PDF com qualidade reduzida ou remover imagens do currículo." |
| Formato inválido | *(nenhuma)* | "Formato não suportado. Envie seu currículo em PDF ou DOC/DOCX." |
| Falha no upload | Erro genérico do Supabase | "Não conseguimos enviar seu currículo. Verifique sua conexão com a internet e tente novamente." |
| Candidatura duplicada | "Você já se candidatou para esta vaga com este e-mail." | *(manter — já é clara)* |
| Erro geral no envio | Mensagem técnica do `error.message` | "Ocorreu um erro ao enviar sua candidatura. Tente novamente em alguns instantes. Se o problema persistir, entre em contato com a empresa." |
| Campos obrigatórios vazios | "Este campo é obrigatório" | *(manter — já é clara)* |
| Currículo não anexado | "Por favor, anexe seu currículo" | "Você precisa anexar seu currículo para se candidatar. Aceitamos arquivos PDF ou DOC (máx. 5MB)." |

**4. Validação no momento da seleção do arquivo** (não só no submit)
Ao selecionar o arquivo, já validar formato e tamanho e mostrar feedback imediato com toast, em vez de esperar o submit.

### Arquivo alterado

| Arquivo | Mudança |
|---|---|
| `src/pages/PublicApplication.tsx` | Sanitização, validação antecipada, mensagens amigáveis |

