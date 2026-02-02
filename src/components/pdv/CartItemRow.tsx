import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { CartItem } from '@/types/database';
import { ProductImage } from '@/components/ui/product-image';
import { Trash2, Plus, Minus } from 'lucide-react';

interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemove: (productId: string) => void;
  formatCurrency: (value: number) => string;
}

export const CartItemRow = memo(function CartItemRow({
  item,
  onUpdateQuantity,
  onRemove,
  formatCurrency
}: CartItemRowProps) {
  return (
    <div className="border border-border rounded-lg p-3 bg-card">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <ProductImage 
            src={item.product.image_url} 
            alt={item.product.name}
            category={item.product.category}
            size="md"
          />
          <div className="min-w-0">
            <p className="font-medium truncate">{item.product.name}</p>
            <p className="text-sm text-muted-foreground">
              {formatCurrency(item.unit_price)}/{item.product.unit}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 text-destructive shrink-0"
          onClick={() => onRemove(item.product.id)}
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12"
            onClick={() => onUpdateQuantity(item.product.id, -0.1)}
          >
            <Minus className="h-5 w-5" />
          </Button>
          <span className="w-24 text-center font-medium text-lg">
            {item.quantity.toFixed(3)} {item.product.unit}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12"
            onClick={() => onUpdateQuantity(item.product.id, 0.1)}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
        <span className="font-bold text-primary text-lg">
          {formatCurrency(item.total)}
        </span>
      </div>
    </div>
  );
});
