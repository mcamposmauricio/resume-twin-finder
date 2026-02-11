
## Correcoes e Melhorias

### 1. Eliminar flash/recarregamento para usuarios full_access

**Problema atual**: O fluxo e Auth → "/" (Index.tsx) → renderiza dashboard → verifica role → redireciona para "/vagas". Isso causa um flash visivel.

**Solucao**: Duas mudancas:

**a) Auth.tsx (linha 141)**: Apos login, verificar o role do usuario antes de redirecionar. Usar a RPC `is_full_access` para decidir se vai para `/` ou `/vagas`:

```typescript
// Em vez de navigate("/") direto, verificar role:
if (session) {
  const { data: isFull } = await supabase.rpc('is_full_access', { _user_id: session.user.id });
  navigate(isFull ? '/vagas' : '/', { replace: true });
}
```

Aplicar tanto no `onAuthStateChange` quanto no `getSession` inicial.

**b) Index.tsx (linhas 755-764)**: Mover a verificacao de role para ANTES do render. Se `isFullAccess` e true e estamos no step `welcome` sem URL params, retornar o spinner de loading em vez de renderizar o dashboard e depois redirecionar:

```typescript
// Antes do return principal, adicionar:
if (!loading && !roleLoading && user && isFullAccess && step === 'welcome') {
  const hasUrlParams = searchParams.get('analysisJobId') || searchParams.get('viewAnalysis');
  if (!hasUrlParams) {
    // Ja tem o useEffect fazendo navigate, so mostra loading
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-4 border-muted border-t-primary animate-spin" />
    </div>;
  }
}
```

### 2. Reorganizar menu e botoes na pagina de Acompanhamento de Vagas

**Mudancas no header de `src/pages/JobPostings.tsx`**:

- Trocar o botao "+" circular por um botao retangular mais visivel com texto "Nova Vaga" (acao principal em destaque)
- Mover "Modelos de Formulario", "Configuracoes" e "Log de Atividades" para um menu dropdown com icone de engrenagem ou tres pontos (acoes secundarias)
- Resultado: a acao principal (criar vaga) fica em destaque, e as acoes secundarias ficam organizadas num menu separado

Layout do header resultante:
```
[CompareCV powered by MarQ]           [Nova Vaga] [...] [email] [Sair]
```

Onde `[...]` abre dropdown com:
- Modelos de Formulario
- Configuracoes
- Log de Atividades (apenas mauricio@)

### Arquivos alterados

| Arquivo | Mudanca |
|---|---|
| `src/pages/Auth.tsx` | Redirect inteligente baseado em role apos login |
| `src/pages/Index.tsx` | Mostrar loading em vez de dashboard enquanto redireciona full_access |
| `src/pages/JobPostings.tsx` | Reorganizar header: botao "Nova Vaga" em destaque + menu secundario |
