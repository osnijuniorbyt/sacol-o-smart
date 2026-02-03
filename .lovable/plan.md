
# Plano: Restaurar Efeito Pôr do Sol no Login

## O Que Foi Removido

O gradiente sutil na base da logo que criava a transição suave (efeito "pôr do sol") foi removido na última edição:

```css
/* ANTES - tinha esse gradiente */
background: linear-gradient(to bottom, transparent 0%, hsl(36,30%,82%) 100%);
height: 32px (h-8)
```

## Solução

Restaurar apenas o gradiente de transição, mantendo as outras melhorias (safe areas, loading="eager", classe global shimmer).

## Mudança Única

```text
src/pages/Login.tsx
└── Adicionar de volta o gradiente "pôr do sol" (linhas 111-116)
    - Gradiente h-8 na base da logo
    - Transição de transparent para hsl(36,30%,82%)
    - pointer-events-none para não interferir
```

## Código Final (Logo Container)

```jsx
<div className="relative h-[280px] sm:h-[320px]">
  <img 
    src={logoLogin}
    alt="Horti Campos - Hortifruti e Produtos Naturais"
    className="absolute inset-0 w-full h-full object-cover object-center"
    loading="eager"
  />
  
  {/* RESTAURADO: Gradiente pôr do sol na base */}
  <div 
    className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none"
    style={{
      background: 'linear-gradient(to bottom, transparent 0%, hsl(36,30%,82%) 100%)',
    }}
  />
  
  {/* Borda metálica inferior com shimmer */}
  <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[hsl(36,70%,55%)] to-transparent z-10" />
  <div className="absolute bottom-0 left-0 right-0 h-[3px] animate-shimmer z-10" />
</div>
```

## O Que Permanece

| Melhoria | Status |
|----------|--------|
| Safe areas laterais (pl-safe, pr-safe) | Mantido |
| loading="eager" na logo | Mantido |
| Classe global .animate-shimmer | Mantido |
| Shimmer no sidebar | Mantido |

## Resultado

A logo terá novamente a transição suave "pôr do sol" na base, criando harmonia perfeita entre a imagem e o card de login.
