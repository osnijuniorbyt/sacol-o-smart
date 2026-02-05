import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductImage } from '@/components/ui/product-image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShoppingCart, Minus, Plus, Trash2 } from 'lucide-react';
import { PedidoItem } from '@/hooks/useOrderForm';
import { Product } from '@/types/database';
import { cn } from '@/lib/utils';

interface OrderItemsTableProps {
  items: PedidoItem[];
  products: Product[];
  totalItens: number;
  totalPedido: number;
  hasItemsWithoutPrice: boolean;
  onAddProduct: (product: Product) => void;
  onDecrement: (productId: string) => void;
  onUpdatePrice: (productId: string, price: string) => void;
  onRemoveItem: (productId: string) => void;
}

export function OrderItemsTable({
  items,
  products,
  totalItens,
  totalPedido,
  hasItemsWithoutPrice,
  onAddProduct,
  onDecrement,
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
        {items.map(item => {
          const product = products.find(p => p.id === item.product_id);
          return (
            <div
              key={item.product_id}
              className="flex flex-row items-center gap-3 p-3 bg-muted/30 rounded-lg border"
            >
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

              {/* RIGHT: Quantity Controls */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12"
                  onClick={() => onDecrement(item.product_id)}
                >
                  <Minus className="h-5 w-5" />
                </Button>
                <span className="font-mono font-bold text-lg w-8 text-center">
                  {item.quantity}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12"
                  onClick={() => {
                    if (product) onAddProduct(product);
                  }}
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
