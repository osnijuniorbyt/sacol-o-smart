
# Correção: ProductPickerDialog abre vazio no iPhone Safari

## Problema Identificado

O seletor de produtos no módulo Compras **abre vazio** no iPhone Safari, mas quando o usuário toca novamente no campo de busca, os produtos aparecem corretamente. Este é um bug relacionado à combinação de:

1. **ScrollArea do Radix UI com Drawer (vaul)** - O Radix ScrollArea não recalcula suas dimensões corretamente quando o Drawer ainda está animando a abertura no iOS Safari
2. **Renderização inicial atrasada** - Os produtos são filtrados e agrupados, mas o ScrollArea não "sabe" que tem conteúdo porque suas dimensões são calculadas antes da animação terminar
3. **CSS flexbox + overflow** - O container `flex-1 overflow-hidden` dentro do DrawerContent não permite que o ScrollArea detecte sua altura real até que o layout seja recalculado

## Por que funciona ao clicar no input?

Ao focar o input, o iOS Safari recalcula o layout para acomodar o teclado virtual, o que força um re-layout do ScrollArea e revela os produtos.

---

## Solução Proposta

### 1. Forçar re-layout após abertura do Drawer

Usar um estado `isReady` com delay para garantir que o conteúdo só renderize após a animação do Drawer terminar:

```tsx
const [isReady, setIsReady] = useState(false);

useEffect(() => {
  if (open) {
    // Aguarda animação do Drawer (300ms) + margem
    const timer = setTimeout(() => setIsReady(true), 50);
    return () => clearTimeout(timer);
  } else {
    setIsReady(false);
  }
}, [open]);
```

### 2. Substituir ScrollArea por div nativa com overflow-y-auto

O Radix ScrollArea tem problemas conhecidos no iOS Safari com layouts dinâmicos. Usar um `div` nativo é mais confiável:

```tsx
// ANTES
<ScrollArea className="flex-1">
  {content}
</ScrollArea>

// DEPOIS
<div className="flex-1 overflow-y-auto overscroll-contain">
  {content}
</div>
```

### 3. Garantir altura mínima inicial

Adicionar uma altura mínima para evitar o colapso do container antes dos produtos serem renderizados:

```tsx
<div className="flex-1 overflow-y-auto min-h-[200px]">
```

### 4. Melhorar experiência de busca vazia

Quando o campo está vazio, mostrar todos os produtos (comportamento atual), mas garantir um estado de carregamento visual enquanto `isReady` é false.

---

## Arquivos a Modificar

| Arquivo | Modificação |
|---------|-------------|
| `src/components/compras/ProductPickerDialog.tsx` | Substituir ScrollArea por div nativa, adicionar estado `isReady`, garantir min-height |

---

## Detalhes Técnicos

### Mudanças no ProductPickerDialog.tsx

1. **Remover import** de `ScrollArea` do Radix
2. **Adicionar estado** `isReady` sincronizado com prop `open`
3. **Substituir** `<ScrollArea>` por `<div className="flex-1 overflow-y-auto overscroll-contain -webkit-overflow-scrolling-touch">`
4. **Adicionar** indicador de carregamento enquanto `!isReady`
5. **Garantir** que `filteredProducts` renderize mesmo sem texto de busca (já funciona assim)

### CSS iOS-specific

Adicionar propriedades para scroll suave no iOS:
```tsx
className="flex-1 overflow-y-auto overscroll-contain"
style={{ WebkitOverflowScrolling: 'touch' }}
```

---

## Resultado Esperado

- Ao abrir o seletor de produtos, ele mostra um skeleton/spinner breve (50ms) e depois renderiza todos os produtos imediatamente
- Busca continua funcionando normalmente
- Não há mais tela vazia ao abrir

---

## Notas de Segurança

- Nenhuma mudança em lógica de negócio
- Mantém toda funcionalidade existente de multi-seleção, exclusão de IDs, etc.
- Apenas correção de renderização/CSS
