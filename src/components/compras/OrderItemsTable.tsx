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
  const debounceRef = useRef<NodeJS.Timeout>();

  // Sincroniza quando prop muda (ex: ao carregar pedido existente)
  useEffect(() => {
    setLocalQuantity(item.quantity);
  }, [item.quantity]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleIncrement = () => {
    const newQty = localQuantity + 1;
    setLocalQuantity(newQty); // INSTANTÂNEO - UI muda imediatamente
    
    // Debounce callback para pai
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onQuantityChange(item.product_id, newQty);
    }, 500);
  };

  const handleDecrement = () => {
    if (localQuantity <= 1) {
      // Remove imediatamente, sem debounce
      onRemoveItem(item.product_id);
      return;
    }
    
    const newQty = localQuantity - 1;
    setLocalQuantity(newQty); // INSTANTÂNEO - UI muda imediatamente
    
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onQuantityChange(item.product_id, newQty);
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

      {/* MIDDLE: Product Name + Quantity Controls */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm truncate">{item.product_name}</p>
        <div className="flex items-center gap-1 mt-2">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 active:scale-95 transition-transform"
            onClick={handleDecrement}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="font-mono font-bold text-lg w-8 text-center">
            {localQuantity}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 active:scale-95 transition-transform"
            onClick={handleIncrement}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-destructive hover:bg-destructive/10"
            onClick={() => onRemoveItem(item.product_id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* RIGHT: Volume Value + Unit Cost - CENTRALIZADO */}
      <div className="flex flex-col items-center justify-center flex-shrink-0 min-w-[80px]">
        <span className="text-xs text-muted-foreground">R$/Vol</span>
        <Input
          inputMode="decimal"
          value={item.unit_cost ?? ''}
          onChange={(e) => onUpdatePrice(item.product_id, e.target.value)}
          className="h-9 w-20 text-center font-mono text-base font-bold"
          placeholder="0,00"
        />
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
