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
    <div className="bg-white shadow-sm rounded-2xl p-4 border-0">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <ProductImage 
            src={item.product.image_url} 
            alt={item.product.name}
            category={item.product.category}
            size="md"
          />
          <div className="min-w-0">
            <p className="font-semibold truncate">{item.product.name}</p>
            <p className="text-sm text-muted-foreground">
              {formatCurrency(item.unit_price)}/{item.product.unit}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl shrink-0"
          onClick={() => onRemove(item.product.id)}
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-xl bg-gray-50 border-0 hover:bg-gray-100"
            onClick={() => onUpdateQuantity(item.product.id, -0.1)}
          >
            <Minus className="h-5 w-5" />
          </Button>
          <span className="w-24 text-center font-semibold text-lg font-mono bg-gray-50 py-2 rounded-xl">
            {item.quantity.toFixed(3)}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-xl bg-gray-50 border-0 hover:bg-gray-100"
            onClick={() => onUpdateQuantity(item.product.id, 0.1)}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
        <span className="font-bold text-green-700 text-xl font-mono">
          {formatCurrency(item.total)}
        </span>
      </div>
    </div>
  );
});
