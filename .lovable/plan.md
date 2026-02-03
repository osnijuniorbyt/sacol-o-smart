
# Plano: Reverter Gradiente Pôr do Sol ao Original

## Situação Atual

O gradiente foi modificado várias vezes e está atualmente com:
- Altura: `h-8` (correto)
- Cor: `hsl(36, 25%, 82%)` (saturação reduzida demais)

## Valor Original

O gradiente original era:
```css
background: linear-gradient(to bottom, transparent 0%, hsl(36, 30%, 82%) 100%)
```

## Solução

Restaurar para o valor original com saturação ligeiramente reduzida (28% em vez de 30%):

```text
src/pages/Login.tsx (linha 117)
└── Alterar: hsl(36, 25%, 82%) → hsl(36, 28%, 82%)
```

## Código

```tsx
{/* Gradiente pôr do sol na base */}
<div 
  className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none"
  style={{
    background: 'linear-gradient(to bottom, transparent 0%, hsl(36,28%,82%) 100%)',
  }}
/>
```

## Comparativo

| Versão | Saturação | Resultado |
|--------|-----------|-----------|
| Original | 30% | Valor de referência |
| Atual | 25% | Muito dessaturado |
| **Proposta** | **28%** | **Levemente menos saturado que original** |

## Resultado

O gradiente terá a transição suave original, com tom creme ligeiramente mais neutro, mantendo a harmonia com o card de login.
