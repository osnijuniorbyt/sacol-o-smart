
# Correção Definitiva: Fluxo de Redefinição de Senha

## Diagnóstico Confirmado pelos Logs

Os logs de autenticação mostram claramente o problema:
```
05:36:36 - Login via "implicit" (token processado)
05:36:36 - /verify retorna 303 (redirect)
```

O Supabase processa o token e cria a sessão **instantaneamente**, ANTES do React ter chance de detectar o evento `PASSWORD_RECOVERY`.

## Solução: Detecção Pré-React

```text
[Email Link] ──► [main.tsx] ──► [sessionStorage] ──► [React App]
                    │                                    │
            Detecta tokens                        Lê flag do storage
            ANTES do mount                        para permitir acesso
```

## Arquivos a Modificar

### 1. src/main.tsx
**Adicionar detecção de tokens de recuperação ANTES de montar o React:**
- Verificar se URL contém `type=recovery` no hash ou search
- Salvar flag em `sessionStorage`
- Garantir que o usuário seja direcionado para `/reset-password`

### 2. src/hooks/useAuth.tsx
**Persistir estado de recuperação:**
- Inicializar `isPasswordRecovery` lendo do `sessionStorage`
- Manter sincronização entre estado React e storage
- Limpar storage SOMENTE após senha ser atualizada com sucesso

### 3. src/pages/ResetPassword.tsx
**Simplificar lógica:**
- Remover timeout de 3 segundos
- Confiar no flag persistido para mostrar formulário
- Não redirecionar para login se está em modo recovery

## Fluxo Corrigido

1. Usuário clica no link do email
2. `main.tsx` executa ANTES do React → detecta `type=recovery` → salva em `sessionStorage`
3. React monta → `AuthProvider` lê storage → `isPasswordRecovery = true`
4. Route guards permitem acesso a `/reset-password`
5. Supabase processa token em paralelo → cria sessão
6. `ResetPassword` mostra formulário de nova senha
7. Usuário define senha → limpa `sessionStorage` → redireciona para app

## Detalhes Técnicos

### main.tsx - Código a Adicionar

```typescript
// Detectar recuperação de senha ANTES do React
const hash = window.location.hash;
const search = window.location.search;

if (hash.includes('type=recovery') || search.includes('type=recovery')) {
  sessionStorage.setItem('password_recovery_mode', 'true');
  
  // Redirecionar para /reset-password se não estiver lá
  if (!window.location.pathname.includes('reset-password')) {
    window.history.replaceState(null, '', '/reset-password' + hash);
  }
}

// Depois monta o React normalmente
createRoot(document.getElementById("root")!).render(<App />);
```

### useAuth.tsx - Alterações

```typescript
// Inicializar do sessionStorage
const [isPasswordRecovery, setIsPasswordRecovery] = useState(() => {
  return sessionStorage.getItem('password_recovery_mode') === 'true';
});

// No evento PASSWORD_RECOVERY (backup)
if (event === 'PASSWORD_RECOVERY') {
  sessionStorage.setItem('password_recovery_mode', 'true');
  setIsPasswordRecovery(true);
}

// Ao atualizar senha
const updatePassword = async (newPassword: string) => {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (!error) {
    sessionStorage.removeItem('password_recovery_mode');
    setIsPasswordRecovery(false);
  }
  return { error };
};
```

### ResetPassword.tsx - Simplificação

```typescript
// Remover o timer de 3 segundos
// Confiar apenas no estado isPasswordRecovery

// Mostrar loading apenas enquanto auth carrega
if (authLoading) {
  return <LoadingSpinner />;
}

// Se não tem sessão E não está em modo recovery → login
if (!session && !isPasswordRecovery) {
  return <Navigate to="/login" replace />;
}

// Caso contrário, mostrar o formulário
```

## Resultado Esperado

- Link do email abre diretamente o formulário de nova senha
- Sem tela preta
- Sem redirecionamento indesejado para login ou dashboard
- Funciona mesmo se usuário já estava logado antes
