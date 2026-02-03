
# Plano de Implementacao Completo - Horti Campos

## Visao Geral

Este plano implementa tres melhorias principais:
1. **Logo SVG Integrada** - Substituir imagem JPEG por componente visual puro
2. **Sistema de Aprovacao de Contas** - Controle administrativo de acesso
3. **Redefinicao de Senha** - Fluxo completo de recuperacao

---

## Parte 1: Logo SVG Integrada ao Design

### 1.1 Criar Componente BrandLogo

**Arquivo:** `src/components/BrandLogo.tsx`

O componente renderiza a marca "Horti Campos" usando SVG puro com efeitos 3D metalicos:

**Estrutura Visual:**
- **Icone Central (H com folhas):**
  - Forma arredondada com gradiente bronze/dourado
  - Letra "H" estilizada em branco com sombra interna
  - Duas folhas verdes em SVG com gradiente esmeralda
  - Efeito de brilho superior (reflexo metalico)
  
- **Tipografia:**
  - "HORTI" em peso extra-bold com gradiente dourado
  - "campos" em peso normal verde esmeralda com tracking aumentado

**Props do Componente:**
```text
interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'full' | 'icon-only' | 'text-only'
  className?: string
}
```

**Tamanhos:**
- sm: icone 32px, fonte 14px (header mobile)
- md: icone 48px, fonte 18px (sidebar)
- lg: icone 80px, fonte 24px (login)
- xl: icone 120px, fonte 32px

### 1.2 Atualizar Tela de Login

**Arquivo:** `src/pages/Login.tsx`

Alteracoes:
- Remover import da imagem JPEG
- Importar componente BrandLogo
- Substituir bloco de imagem por `<BrandLogo size="lg" variant="full" />`
- Manter container com efeitos 3D existentes

### 1.3 Atualizar Layout Principal

**Arquivo:** `src/components/Layout.tsx`

Alteracoes:
- Remover import da imagem JPEG
- Importar componente BrandLogo
- Header mobile: usar `<BrandLogo size="sm" variant="full" />`
- Sidebar: usar `<BrandLogo size="md" variant="full" />`

---

## Parte 2: Sistema de Aprovacao de Contas

### 2.1 Estrutura do Banco de Dados

**Migracao SQL:**

```text
Tabela: profiles
- id (uuid, PK, FK -> auth.users.id)
- email (text)
- full_name (text, nullable)
- is_approved (boolean, default: false)
- approved_at (timestamptz, nullable)
- approved_by (uuid, nullable)
- created_at (timestamptz, default: now())
- updated_at (timestamptz, default: now())

Tabela: user_roles (conforme instrucoes de seguranca)
- id (uuid, PK)
- user_id (uuid, FK -> auth.users.id, ON DELETE CASCADE)
- role (app_role enum: 'admin', 'moderator', 'user')
- UNIQUE(user_id, role)

Funcao: has_role (SECURITY DEFINER)
- Verifica se usuario possui determinado role
- Usado nas politicas RLS sem recursao

Trigger: create_profile_on_signup
- Executa apos INSERT em auth.users
- Cria registro em profiles com is_approved = false
```

**Politicas RLS:**
```text
profiles:
- SELECT: auth.uid() = id
- UPDATE (aprovar): apenas admins via has_role()

user_roles:
- SELECT: admins podem ver todos
- INSERT/UPDATE/DELETE: apenas admins
```

### 2.2 Hook de Autenticacao Atualizado

**Arquivo:** `src/hooks/useAuth.tsx`

Adicionar ao contexto:
```text
interface AuthContextType {
  // ... existentes ...
  isApproved: boolean | null
  isAdmin: boolean
  checkApprovalStatus: () => Promise<void>
}
```

Nova logica:
- Apos autenticacao, buscar perfil do usuario
- Verificar campo `is_approved`
- Verificar se possui role 'admin' via funcao has_role
- Expor estados para controle de rotas

### 2.3 Tela de Aguardando Aprovacao

**Arquivo:** `src/pages/PendingApproval.tsx`

Interface:
- Logo da marca (BrandLogo)
- Icone de relogio/ampulheta com animacao
- Titulo: "Aguardando Aprovacao"
- Mensagem explicativa sobre processo
- Botao de verificar novamente (refresh)
- Link para sair da conta

Visual: mesma estetica 3D metalica do login

### 2.4 Painel de Administracao de Usuarios

**Arquivo:** `src/pages/AdminUsers.tsx`

Funcionalidades:
- Listar todos os usuarios (aprovados e pendentes)
- Tabs: "Pendentes" / "Aprovados" / "Todos"
- Para cada usuario mostrar: email, data cadastro, status
- Botoes de acao: Aprovar / Revogar acesso
- Confirmacao antes de acoes criticas

**Arquivo:** `src/hooks/useUserManagement.tsx`

Hook para operacoes administrativas:
- fetchPendingUsers()
- fetchAllUsers()
- approveUser(userId)
- revokeAccess(userId)

### 2.5 Atualizacao de Rotas

**Arquivo:** `src/App.tsx`

Nova logica de rotas:
```text
1. Se nao autenticado -> Login
2. Se autenticado mas nao aprovado -> PendingApproval
3. Se autenticado e aprovado -> Rotas normais
4. Se admin -> Adicionar rota /admin/usuarios
```

Adicionar item de navegacao "Usuarios" no Layout (somente para admins)

---

## Parte 3: Redefinicao de Senha

### 3.1 Atualizar Tela de Login

**Arquivo:** `src/pages/Login.tsx`

Adicionar:
- Link "Esqueci minha senha" abaixo do campo de senha
- Dialog/Modal para inserir email de recuperacao
- Estado para controlar abertura do dialog
- Funcao para chamar resetPassword do hook

### 3.2 Funcao de Reset no Hook

**Arquivo:** `src/hooks/useAuth.tsx`

Adicionar funcao:
```text
resetPassword: async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/reset-password'
  })
  return { error }
}

updatePassword: async (newPassword: string) => {
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  })
  return { error }
}
```

### 3.3 Pagina de Nova Senha

**Arquivo:** `src/pages/ResetPassword.tsx`

Fluxo:
1. Usuario acessa via link do email
2. Supabase automaticamente loga o usuario com token
3. Pagina mostra formulario para nova senha
4. Validacao: minimo 6 caracteres, confirmacao de senha
5. Apos sucesso, redireciona para login

Visual: mesma estetica do login

### 3.4 Rota de Reset

**Arquivo:** `src/App.tsx`

Adicionar rota `/reset-password` apontando para ResetPassword.tsx

---

## Ordem de Implementacao

1. **BrandLogo.tsx** - Componente isolado
2. **Atualizar Login.tsx** - Nova logo + link esqueci senha
3. **Atualizar Layout.tsx** - Nova logo
4. **Migracao SQL** - Criar profiles e user_roles
5. **useAuth.tsx** - Adicionar verificacao de aprovacao
6. **PendingApproval.tsx** - Tela de espera
7. **useUserManagement.tsx** - Hook administrativo
8. **AdminUsers.tsx** - Painel de usuarios
9. **App.tsx** - Novas rotas e logica de redirecionamento
10. **ResetPassword.tsx** - Pagina de nova senha

---

## Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `src/components/BrandLogo.tsx` | Componente da logo em SVG |
| `src/pages/PendingApproval.tsx` | Tela aguardando aprovacao |
| `src/pages/AdminUsers.tsx` | Painel de gestao de usuarios |
| `src/pages/ResetPassword.tsx` | Pagina para redefinir senha |
| `src/hooks/useUserManagement.tsx` | Hook para operacoes de usuarios |

## Arquivos a Modificar

| Arquivo | Alteracoes |
|---------|-----------|
| `src/pages/Login.tsx` | Nova logo, link esqueci senha |
| `src/components/Layout.tsx` | Nova logo, menu admin |
| `src/hooks/useAuth.tsx` | Verificacao aprovacao, reset senha |
| `src/App.tsx` | Novas rotas, logica redirecionamento |

## Migracao de Banco

Uma migracao SQL criando:
- Enum `app_role`
- Tabela `profiles`
- Tabela `user_roles`
- Funcao `has_role`
- Trigger `create_profile_on_signup`
- Politicas RLS apropriadas

---

## Consideracoes de Seguranca

- Roles armazenados em tabela separada (nunca em profiles)
- Funcao has_role com SECURITY DEFINER para evitar recursao RLS
- Verificacao de admin sempre no servidor via RLS
- Token de reset de senha expira automaticamente (Supabase padrao)
- Trigger cria perfil nao-aprovado por padrao (fail-safe)
