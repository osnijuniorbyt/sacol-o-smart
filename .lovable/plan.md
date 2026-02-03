
# Plano: Integrar Nova Logo com Container Proporcional

## Análise da Situação Atual
- Container da logo: `h-[200px] sm:h-[220px]`
- Imagem usando `object-cover` que corta a logo
- A nova imagem (IMG_8216.jpeg) tem fundo cinza claro que combina naturalmente com o card

## Mudanças Propostas

### 1. Atualizar Asset da Logo
- Copiar `user-uploads://IMG_8216.jpeg` para `src/assets/logo-hortii-login.png`
- Esta imagem já tem o fundo ideal que harmoniza com o card

### 2. Aumentar Container da Logo
Ajustar a altura para ser mais proporcional ao mobile:
- Mobile: `h-[280px]` (aumentado de 200px)
- Desktop: `h-[320px]` (aumentado de 220px)

### 3. Ajustar Exibição da Imagem
- Mudar de `object-cover` para `object-contain` 
- Isso garante que a logo apareça inteira e proporcionalmente
- Centralizar verticalmente com `object-center`

### 4. Harmonização do Fundo
- Adicionar um background sutil atrás da imagem que combine com as bordas do card
- Cor: `bg-[hsl(40,15%,92%)]` (cinza claro semelhante ao fundo da imagem)

## Código a Modificar

**Arquivo:** `src/pages/Login.tsx` (linhas 102-122)

```tsx
// Container maior para a logo - ANTES
<div className="relative h-[200px] sm:h-[220px]">

// Container maior para a logo - DEPOIS
<div className="relative h-[280px] sm:h-[320px] bg-[hsl(40,15%,92%)]">
  <img 
    src={logoLogin}
    alt="Horti Campos - Hortifruti e Produtos Naturais"
    className="absolute inset-0 w-full h-full object-contain object-center p-4"
  />
```

## Resultado Esperado
- Logo visível e proporcional em telas mobile
- Fundo da imagem integrado perfeitamente com o card
- Container maior para dar destaque à marca
- Padding interno (`p-4`) para respiro visual
