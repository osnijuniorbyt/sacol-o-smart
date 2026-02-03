
# Correção do Email de Recuperação de Senha

## Problema Identificado

O email de recuperação está chegando **sem o botão de reset**. O texto aparece, mas o link/botão para redefinir a senha não é exibido.

```text
[Email Atual]
┌─────────────────────────────────────┐
│ Reset your password                 │
│                                     │
│ "Click the button below..."         │
│                                     │
│ ← BOTÃO AUSENTE!                    │
│                                     │
│ "If you didn't request this..."     │
└─────────────────────────────────────┘
```

## Causa

O template de email padrão do sistema não está renderizando o botão corretamente. Isso pode ser devido a:
1. Template de email mal configurado
2. Problema na geração do HTML do botão

## Solução Proposta

Criar um **Edge Function customizado** para enviar emails de recuperação de senha com um template HTML completo e bem formatado.

### Arquitetura da Solução

```text
[Usuário]          [App]           [Edge Function]       [Usuário]
    │                │                    │                   │
    │ Esqueci senha  │                    │                   │
    ├───────────────►│                    │                   │
    │                │ Gera token único   │                   │
    │                │ Chama edge func    │                   │
    │                ├───────────────────►│                   │
    │                │                    │ Envia email       │
    │                │                    │ com botão visível │
    │                │                    ├──────────────────►│
    │                │◄───────────────────┤                   │
    │◄───────────────┤                    │                   │
    │ "Email enviado"│                    │                   │
```

### Arquivos a Criar/Modificar

#### 1. Nova Edge Function: `supabase/functions/send-password-reset/index.ts`
- Recebe email do usuário
- Gera link de recuperação usando Supabase Admin
- Envia email formatado com template HTML bonito
- Usa Resend (se disponível) ou serviço de email nativo

#### 2. Modificar: `src/hooks/useAuth.tsx`
- Alterar `resetPassword` para chamar a edge function ao invés de `supabase.auth.resetPasswordForEmail`

### Template de Email Proposto

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    .button {
      background-color: #10b981;
      color: white;
      padding: 16px 32px;
      text-decoration: none;
      border-radius: 8px;
      display: inline-block;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div style="text-align: center; padding: 40px;">
    <h1>🔐 Redefinir Senha</h1>
    <p>Você solicitou a redefinição de senha da sua conta Sacolo-Smart.</p>
    <p>Clique no botão abaixo para criar uma nova senha:</p>
    
    <a href="{{RESET_LINK}}" class="button">
      Redefinir Minha Senha
    </a>
    
    <p style="margin-top: 20px; color: #666; font-size: 12px;">
      Se você não solicitou isso, ignore este email.
    </p>
  </div>
</body>
</html>
```

### Detalhes Técnicos

#### Edge Function (send-password-reset/index.ts)

```typescript
// Estrutura básica
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const { email } = await req.json();
  
  // Criar cliente admin Supabase
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  
  // Gerar link de recuperação
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: {
      redirectTo: `${req.headers.get("origin")}/reset-password`,
    },
  });
  
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
  
  // Enviar email com template customizado
  // Pode usar Resend, SendGrid, ou outro serviço
  
  return new Response(JSON.stringify({ success: true }), { status: 200 });
});
```

#### Modificação no useAuth.tsx

```typescript
const resetPassword = async (email: string) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-password-reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    
    if (!response.ok) {
      const data = await response.json();
      return { error: new Error(data.error || 'Erro ao enviar email') };
    }
    
    return { error: null };
  } catch (err) {
    return { error: err as Error };
  }
};
```

### Opção Alternativa (Mais Simples)

Se preferir não criar uma edge function, podemos usar o método `generateLink` do Supabase Admin e enviar o link diretamente no email padrão, mas isso requer configurar um serviço de email externo como Resend.

### Próximos Passos

1. **Verificar se Resend está configurado** - Se não, configurar ou usar alternativa
2. **Criar a edge function** com template de email bonito
3. **Modificar o frontend** para usar a edge function
4. **Testar o fluxo completo**

### Resultado Esperado

- Email chega com botão grande e visível
- Usuário clica → abre formulário de nova senha
- Template em português com visual profissional
