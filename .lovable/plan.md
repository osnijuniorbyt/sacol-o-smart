

# Solução Simplificada: Email de Reset com Link Visível

## Abordagem

Em vez de configurar um serviço externo de email (Resend), vamos aproveitar o sistema de email nativo já existente, mas garantindo que o link seja sempre visível.

## O que será feito

### 1. Manter o método atual de reset
O Supabase já envia o email - vamos apenas garantir que o usuário consiga usar o link mesmo que o botão não apareça.

### 2. Melhorar a página de Login
Adicionar instruções claras na tela de "Esqueci minha senha" informando que:
- O link pode aparecer como texto no email
- Copiar e colar o link funciona se o botão não aparecer

### 3. Criar página de fallback
Uma página simples onde o usuário pode colar o link manualmente se necessário.

## Arquivos a Modificar

### src/pages/Login.tsx
- Melhorar mensagem de sucesso ao enviar email de reset
- Adicionar dica sobre verificar spam e procurar o link no corpo do email

### src/pages/ResetPassword.tsx  
- Adicionar campo para colar link manualmente (fallback)
- Melhorar instruções para o usuário

## Vantagens desta Solução

- Sem necessidade de criar conta em serviço externo
- Sem custo adicional
- Funciona imediatamente
- Não sobrecarrega o sistema

## Fluxo do Usuário

1. Usuário clica "Esqueci minha senha"
2. Recebe email do sistema
3. **Se botão aparecer**: clica e vai direto para o formulário
4. **Se botão não aparecer**: copia o link do email e cola na página de reset

