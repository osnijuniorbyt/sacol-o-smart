# Memory: ux/compras-optimistic-quantity

Padrão de UI Otimista com **Trava de Edição** para controles de quantidade no módulo de compras:

## Problema Resolvido (Efeito Ioiô)
Conflito entre estado local (UI Otimista) e refetch do React Query causava "saltos" de valor quando o servidor respondia com dado antigo antes de processar a atualização.

## Solução Implementada
1. **Estado `isEditing`**: Flag booleana que indica se o usuário está interagindo
2. **Bloqueio de Sincronização**: O useEffect que sincroniza props→estado só executa se `!isEditing`
3. **Ativação**: `setIsEditing(true)` é chamado imediatamente ao clicar em +/-
4. **Liberação**: Timeout de 2s após enviar o callback (segurança contra falhas)

## Código Padrão
```typescript
const [localQuantity, setLocalQuantity] = useState(item.quantity);
const [isEditing, setIsEditing] = useState(false);

useEffect(() => {
  // SÓ sincroniza se NÃO estiver editando
  if (!isEditing && item.quantity !== localQuantity) {
    setLocalQuantity(item.quantity);
  }
}, [item.quantity, isEditing]);

const handleIncrement = () => {
  setIsEditing(true); // TRAVA
  const newQty = localQuantity + 1;
  setLocalQuantity(newQty);
  
  debounceRef.current = setTimeout(() => {
    onQuantityChange(item.product_id, newQty);
    releaseEditLock(); // Libera após 2s
  }, 500);
};
```

## Componentes que usam este padrão
- `OrderItemsTable.tsx` (OrderItemRow)
- `NewOrderItemRow.tsx`
