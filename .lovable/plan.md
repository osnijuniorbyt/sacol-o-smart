
# Auditoria Completa - Fase 1: Correcao de 3 Bugs Criticos

## Bug 1: Icone "+" nao funciona no seletor de produtos (single-select)

**Arquivo:** `src/components/compras/ProductPickerDialog.tsx` (linha 108)

**Problema:** No modo single-select (quando o usuario adiciona mais um produto a um pedido existente), o icone `<Plus>` do lado direito de cada produto e um SVG estatico sem handler de clique. O usuario toca no "+" esperando adicionar o produto, mas nada acontece. So funciona se tocar na area esquerda (nome/imagem).

**Correcao:** Envolver o icone Plus em um `<button>` com o mesmo handler `onSelect`:

```tsx
// ANTES (linha 108)
<Plus className="h-5 w-5 text-primary" />

// DEPOIS
<button onClick={() => onSelect(product)} className="p-2 -m-2 active:scale-90 transition-transform">
  <Plus className="h-5 w-5 text-primary" />
</button>
```

---

## Bug 2: Badge sem forwardRef causa erros no Dashboard

**Arquivo:** `src/components/ui/badge.tsx`

**Problema:** O componente Badge e uma funcao simples que nao usa `React.forwardRef`. Quando usado dentro de componentes Radix que passam refs (como `TooltipTrigger asChild`), gera warnings no console. No Dashboard, esses warnings aparecem repetidamente e podem causar comportamento inesperado nos tooltips (especialmente em mobile onde o touch depende da ref).

**Correcao:** Converter Badge para usar `React.forwardRef`:

```tsx
const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return <div ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />;
  }
);
Badge.displayName = "Badge";
```

---

## Bug 3: Componentes inline no ReceivingDialog causam remontagem no mobile

**Arquivo:** `src/components/compras/ReceivingDialog.tsx`

**Problema:** Tres componentes sao definidos como funcoes inline dentro do corpo do componente principal:
- `ReceivingContent` (definido como funcao dentro do render)
- `FooterButtons` (definido como funcao inline)
- `DraftRecoveryDialog` (definido como funcao inline)

Cada vez que qualquer estado muda (ex: digitar no campo de quantidade recebida), o React cria novas referencias para esses componentes, desmontando e remontando a arvore inteira. Isso causa:
- Teclado virtual fecha sozinho durante digitacao no mobile
- Perda de foco nos inputs
- Animacoes reiniciam a cada keystroke

**Correcao:** Converter os 3 componentes inline em JSX direto (inline no return) ou em variaveis JSX estativas (nao funcoes). O padrao ja documentado na memoria do projeto e "inlinar o JSX diretamente" em vez de criar sub-funcoes.

---

## Resumo das Mudancas

| Arquivo | O que muda |
|---------|-----------|
| `src/components/compras/ProductPickerDialog.tsx` | Tornar icone "+" clicavel em single-select |
| `src/components/ui/badge.tsx` | Adicionar React.forwardRef ao Badge |
| `src/components/compras/ReceivingDialog.tsx` | Substituir 3 componentes inline por JSX direto |

## Impacto

- Nenhuma mudanca em logica de negocios ou banco de dados
- Nenhuma mudanca em RLS ou seguranca
- Todas as funcionalidades existentes sao preservadas
- Correcoes focadas em renderizacao e interatividade mobile
