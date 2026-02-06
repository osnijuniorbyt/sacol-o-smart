import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductImage } from '@/components/ui/product-image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShoppingCart, Minus, Plus, Trash2 } from 'lucide-react';
import { PedidoItem } from '@/hooks/useOrderForm';
import { Product } from '@/types/database';
import { cn } from '@/lib/utils';

interface OrderItemRowProps {
  item: PedidoItem;
  product: Product | undefined;
  onQuantityChange: (productId: string, newQuantity: number) => void;
  onUpdatePrice: (productId: string, price: string) => void;
  onRemoveItem: (productId: string) => void;
}

function OrderItemRow({ 
  item, 
  product, 
  onQuantityChange, 
  onUpdatePrice, 
  onRemoveItem 
}: OrderItemRowProps) {
  // Estado LOCAL para quantidade - atualiza INSTANTÂNEO
  const [localQuantity, setLocalQuantity] = useState(item.quantity);
  // TRAVA DE EDIÇÃO: impede que o refetch do banco sobrescreva a UI enquanto o usuário interage
  const [isEditing, setIsEditing] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();
  const editLockTimeoutRef = useRef<NodeJS.Timeout>();

  // Sincroniza quando prop muda - MAS SÓ se o usuário NÃO estiver editando
  useEffect(() => {
    if (!isEditing && item.quantity !== localQuantity) {
      setLocalQuantity(item.quantity);
    }
  }, [item.quantity, isEditing]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (editLockTimeoutRef.current) clearTimeout(editLockTimeoutRef.current);
    };
  }, []);

  // Libera a trava de edição após callback ou timeout de segurança
  const releaseEditLock = () => {
    if (editLockTimeoutRef.current) clearTimeout(editLockTimeoutRef.current);
    editLockTimeoutRef.current = setTimeout(() => {
      setIsEditing(false);
    }, 2000); // Timeout de segurança: libera após 2s mesmo se callback falhar
  };

  const handleIncrement = () => {
    setIsEditing(true); // TRAVA: ignora atualizações externas
    const newQty = localQuantity + 1;
    setLocalQuantity(newQty); // INSTANTÂNEO - UI muda imediatamente
    
    // Debounce callback para pai
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onQuantityChange(item.product_id, newQty);
      releaseEditLock(); // Libera trava após enviar
    }, 500);
  };

  const handleDecrement = () => {
    if (localQuantity <= 1) {
      // Remove imediatamente, sem debounce
      onRemoveItem(item.product_id);
      return;
    }
    
    setIsEditing(true); // TRAVA: ignora atualizações externas
    const newQty = localQuantity - 1;
    setLocalQuantity(newQty); // INSTANTÂNEO - UI muda imediatamente
    
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onQuantityChange(item.product_id, newQty);
      releaseEditLock(); // Libera trava após enviar
    }, 500);
  };

  return (
    <div className="flex flex-row items-center gap-3 p-3 bg-muted/30 rounded-lg border">
      {/* LEFT: Product Image/Emoji */}
      <ProductImage
        src={product?.image_url}
        alt={item.product_name}
        size="sm"
        category={product?.category}
        className="flex-shrink-0"
      />

      {/* MIDDLE: Product Info */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm truncate">{item.product_name}</p>
        <div className="flex items-center gap-2 mt-1">
          <Input
            inputMode="decimal"
            value={item.unit_cost ?? ''}
            onChange={(e) => onUpdatePrice(item.product_id, e.target.value)}
            className="h-8 w-20 text-right font-mono text-sm"
            placeholder="0,00"
          />
          <span className="text-xs text-muted-foreground">/cx</span>
          {item.subtotal !== null && (
            <span className="text-xs font-semibold text-primary">
              = R$ {item.subtotal.toFixed(2)}
            </span>
          )}
        </div>
      </div>

      {/* RIGHT: Quantity Controls - Usando localQuantity para UI instantânea */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 active:scale-95 transition-transform"
          onClick={handleDecrement}
        >
          <Minus className="h-5 w-5" />
        </Button>
        <span className="font-mono font-bold text-lg w-8 text-center">
          {localQuantity}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 active:scale-95 transition-transform"
          onClick={handleIncrement}
        >
          <Plus className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-12 w-12 text-destructive hover:bg-destructive/10"
          onClick={() => onRemoveItem(item.product_id)}
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

interface OrderItemsTableProps {
  items: PedidoItem[];
  products: Product[];
  totalItens: number;
  totalPedido: number;
  hasItemsWithoutPrice: boolean;
  onQuantityChange: (productId: string, newQuantity: number) => void;
  onUpdatePrice: (productId: string, price: string) => void;
  onRemoveItem: (productId: string) => void;
}

export function OrderItemsTable({
  items,
  products,
  totalItens,
  totalPedido,
  hasItemsWithoutPrice,
  onQuantityChange,
  onUpdatePrice,
  onRemoveItem,
}: OrderItemsTableProps) {
  if (items.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShoppingCart className="h-5 w-5" />
          3. Itens do Pedido ({items.length} produtos, {totalItens} caixas)
        </CardTitle>
        {hasItemsWithoutPrice && (
          <p className="text-sm text-muted-foreground">
            💡 Preço é opcional - pode preencher ao faturar
          </p>
        )}
      </CardHeader>
      <CardContent className="p-3 space-y-2">
        {items.map((item) => {
          const product = products.find(p => p.id === item.product_id);
          return (
            <OrderItemRow
              key={item.product_id}
              item={item}
              product={product}
              onQuantityChange={onQuantityChange}
              onUpdatePrice={onUpdatePrice}
              onRemoveItem={onRemoveItem}
            />
          );
        })}

        {/* Total Row */}
        {totalPedido > 0 && (
          <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg mt-3">
            <span className="font-bold text-base">TOTAL ESTIMADO</span>
            <span className="font-mono font-bold text-xl text-primary">
              R$ {totalPedido.toFixed(2)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
