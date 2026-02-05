
# Plano: UI Otimista com Debounce para Botões +/- de Quantidade

## Problema Atual
O componente `OrderItemsTable` recebe a lista de itens como prop e chama callbacks do pai (`onAddProduct`, `onDecrement`) ao clicar +/-. Isso causa:
1. Atualização do estado do pai → re-render de TODOS os itens
2. Possível lag perceptível no mobile durante a propagação do estado

## Solução: Estado Local por Item + Debounce

Criaremos um componente wrapper `OrderItemRow` que gerencia quantidade localmente para cada item individual.

```text
┌─────────────────────────────────────────────────────┐
│  Clique no +/-                                      │
│       ↓                                             │
│  useState local atualiza INSTANTÂNEO (0ms)         │
│       ↓                                             │
│  useEffect com debounce (500ms)                    │
│       ↓                                             │
│  Callback para pai (sync com useOrderForm)         │
└─────────────────────────────────────────────────────┘
```

## Implementação Técnica

### 1. Criar componente `OrderItemRow`
Novo componente interno em `OrderItemsTable.tsx`:

```tsx
interface OrderItemRowProps {
  item: PedidoItem;
  product: Product | undefined;
  onQuantityChange: (productId: string, newQuantity: number) => void;
  onUpdatePrice: (productId: string, price: string) => void;
  onRemoveItem: (productId: string) => void;
}

function OrderItemRow({ item, product, onQuantityChange, onUpdatePrice, onRemoveItem }: OrderItemRowProps) {
  // Estado LOCAL para quantidade - atualiza instantaneamente
  const [localQuantity, setLocalQuantity] = useState(item.quantity);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Sincroniza quando prop muda (ex: ao carregar pedido existente)
  useEffect(() => {
    setLocalQuantity(item.quantity);
  }, [item.quantity]);

  const handleIncrement = () => {
    const newQty = localQuantity + 1;
    setLocalQuantity(newQty); // INSTANTÂNEO
    
    // Debounce callback para pai
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onQuantityChange(item.product_id, newQty);
    }, 500);
  };

  const handleDecrement = () => {
    if (localQuantity <= 1) {
      onRemoveItem(item.product_id);
      return;
    }
    
    const newQty = localQuantity - 1;
    setLocalQuantity(newQty); // INSTANTÂNEO
    
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onQuantityChange(item.product_id, newQty);
    }, 500);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  // ... resto do JSX usando localQuantity
}
```

### 2. Atualizar `useOrderForm` hook
Adicionar função `setQuantity` para atualização direta:

```tsx
const handleSetQuantity = useCallback((productId: string, newQuantity: number) => {
  setItems(prev => prev.map(item => 
    item.product_id === productId
      ? { 
          ...item, 
          quantity: newQuantity, 
          subtotal: item.unit_cost ? newQuantity * item.unit_cost : null 
        }
      : item
  ));
}, []);
```

### 3. Atualizar `OrderItemsTable`
- Substituir `onAddProduct`/`onDecrement` por `onQuantityChange`
- Renderizar `OrderItemRow` em vez de div inline

### 4. Feedback Visual Adicional
Adicionar indicador de "sincronizando" quando debounce está ativo:

```tsx
const [isPending, setIsPending] = useState(false);

const handleIncrement = () => {
  setLocalQuantity(prev => prev + 1);
  setIsPending(true); // Mostra indicador sutil
  
  clearTimeout(debounceRef.current);
  debounceRef.current = setTimeout(() => {
    onQuantityChange(item.product_id, localQuantity + 1);
    setIsPending(false);
  }, 500);
};
```

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/compras/OrderItemsTable.tsx` | Criar `OrderItemRow` com estado local + debounce |
| `src/hooks/useOrderForm.tsx` | Adicionar `handleSetQuantity` |

## Comportamento Esperado

1. **Clique em +/-** → Número muda na tela em < 16ms (um frame)
2. **Cliques rápidos** → Cada clique atualiza visual, mas só o último dispara callback após 500ms
3. **Remover item** → Se quantidade chegar a 0, remove imediatamente (sem debounce)
4. **Sync bidirecional** → Se pai atualizar quantidade externamente, local sincroniza

## Considerações

- O debounce de 500ms é ideal para evitar spam de re-renders no pai
- Para EditOrderDialog, o mesmo padrão pode ser aplicado posteriormente
- Não há salvamento no Supabase durante edição - isso só acontece ao "Enviar Pedido"
