
# Plano: Aplicar Fundo Harmonizado na Nova Logo

## Referência da Memória
Conforme registrado anteriormente, a técnica usada foi aplicar um **gradiente vertical creme** (`#F9F6F0` no topo → `#EDE8DD` na base) ou um **fundo sólido creme** (`#F5F0E6`) para integração perfeita com o card.

## Mudanças a Realizar

### 1. Processar Nova Imagem
- Pegar a imagem `user-uploads://IMG_8217.jpeg`
- Aplicar fundo com gradiente vertical harmonizado:
  - Topo: `#F9F6F0` (creme claro)
  - Base: `#EDE8DD` (creme mais escuro)
- Salvar como `src/assets/logo-hortii-login.png`

### 2. Manter Container Atual
O container já está configurado corretamente:
- Altura: `h-[280px]` mobile / `h-[320px]` desktop
- `object-contain` para exibir a logo inteira
- Padding `p-4` para respiro visual

### 3. Ajustar Fundo do Container
Remover o `bg-[hsl(40,15%,92%)]` pois a imagem já terá o fundo correto integrado.

## Arquivo a Modificar
**`src/pages/Login.tsx`** - Apenas ajuste no container:
```tsx
// Remover bg do container pois a imagem já tem fundo harmonizado
<div className="relative h-[280px] sm:h-[320px]">
```

## Resultado Esperado
- Logo com fundo perfeitamente integrado ao card
- Transição suave entre logo e formulário
- Visual premium e profissional em mobile
