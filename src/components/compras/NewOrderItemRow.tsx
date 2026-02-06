import { useState, useRef, useEffect, memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProductImage } from '@/components/ui/product-image';
import { X, Plus, Minus } from 'lucide-react';
import { OrderItem } from './NewOrderForm';

interface Packaging {
  id: string;
  name: string;
  tare_weight: number;
}

interface NewOrderItemRowProps {
  item: OrderItem;
  packagings: Packaging[];
  onQuantityChange: (productId: string, newQuantity: number) => void;
  onFieldChange: (productId: string, field: keyof OrderItem, value: any) => void;
  onRemove: (productId: string) => void;
}

export const NewOrderItemRow = memo(function NewOrderItemRow({
  item,
  packagings,
  onQuantityChange,
  onFieldChange,
  onRemove,
}: NewOrderItemRowProps) {
  // ============ REFS para valores estáveis durante edição ============
  // Usamos refs para evitar problemas de closure/stale state
  
  const quantityRef = useRef(item.quantity);
  const priceRef = useRef(item.unit_price);
  const packagingRef = useRef(item.packaging_id);
  
  // Timestamp da última edição - se < 3s, ignora props
  const lastEditTimeRef = useRef<number>(0);
  const EDIT_LOCK_MS = 3000;
  
  // Estados para renderização
  const [displayQty, setDisplayQty] = useState(item.quantity);
  const [displayPrice, setDisplayPrice] = useState(
    item.unit_price !== null ? String(item.unit_price) : ''
  );
  const [displayPackaging, setDisplayPackaging] = useState(item.packaging_id || '');

  // Timer para debounce de quantidade
  const qtyDebounceRef = useRef<NodeJS.Timeout>();

  // ============ SYNC DE PROPS (apenas quando NÃO está editando) ============
  useEffect(() => {
    const now = Date.now();
    const isEditing = (now - lastEditTimeRef.current) < EDIT_LOCK_MS;
    
    // Se está editando, NÃO sobrescreve valores locais
    if (isEditing) {
      return;
    }
    
    // Sync quantidade
    if (item.quantity !== quantityRef.current) {
      quantityRef.current = item.quantity;
      setDisplayQty(item.quantity);
    }
    
    // Sync preço
    if (item.unit_price !== priceRef.current) {
      priceRef.current = item.unit_price;
      setDisplayPrice(item.unit_price !== null ? String(item.unit_price) : '');
    }
    
    // Sync vasilhame
    if (item.packaging_id !== packagingRef.current) {
      packagingRef.current = item.packaging_id;
      setDisplayPackaging(item.packaging_id || '');
    }
  }, [item.quantity, item.unit_price, item.packaging_id]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (qtyDebounceRef.current) clearTimeout(qtyDebounceRef.current);
    };
  }, []);

  // ============ HANDLERS DE QUANTIDADE ============
  
  const handleIncrement = useCallback(() => {
    lastEditTimeRef.current = Date.now();
    
    const newQty = quantityRef.current + 1;
    quantityRef.current = newQty;
    setDisplayQty(newQty);
    
    // Debounce para propagar ao pai
    if (qtyDebounceRef.current) clearTimeout(qtyDebounceRef.current);
    qtyDebounceRef.current = setTimeout(() => {
      onQuantityChange(item.product_id, quantityRef.current);
    }, 300);
  }, [item.product_id, onQuantityChange]);

  const handleDecrement = useCallback(() => {
    if (quantityRef.current <= 1) {
      onRemove(item.product_id);
      return;
    }
    
    lastEditTimeRef.current = Date.now();
    
    const newQty = quantityRef.current - 1;
    quantityRef.current = newQty;
    setDisplayQty(newQty);
    
    // Debounce para propagar ao pai
    if (qtyDebounceRef.current) clearTimeout(qtyDebounceRef.current);
    qtyDebounceRef.current = setTimeout(() => {
      onQuantityChange(item.product_id, quantityRef.current);
    }, 300);
  }, [item.product_id, onQuantityChange, onRemove]);

  const handleQtyInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    lastEditTimeRef.current = Date.now();
    
    const value = parseInt(e.target.value) || 1;
    quantityRef.current = value;
    setDisplayQty(value);
    
    // Debounce para propagar ao pai
    if (qtyDebounceRef.current) clearTimeout(qtyDebounceRef.current);
    qtyDebounceRef.current = setTimeout(() => {
      onQuantityChange(item.product_id, quantityRef.current);
    }, 300);
  }, [item.product_id, onQuantityChange]);

  // ============ HANDLERS DE PREÇO ============
  
  const handlePriceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    lastEditTimeRef.current = Date.now();
    
    const value = e.target.value;
    const numValue = value ? parseFloat(value) : null;
    
    priceRef.current = numValue;
    setDisplayPrice(value);
    
    // Propaga imediatamente (sem debounce)
    onFieldChange(item.product_id, 'unit_price', numValue);
  }, [item.product_id, onFieldChange]);

  // ============ HANDLERS DE VASILHAME ============
  
  const handlePackagingChange = useCallback((value: string) => {
    lastEditTimeRef.current = Date.now();
    
    packagingRef.current = value || null;
    setDisplayPackaging(value);
    
    // Propaga imediatamente
    onFieldChange(item.product_id, 'packaging_id', value || null);
  }, [item.product_id, onFieldChange]);

  return (
    <div className="p-3 rounded-lg border bg-card">
      <div className="flex items-start gap-3">
        <ProductImage
          src={item.product_image}
          alt={item.product_name}
          category={item.category as any}
          size="sm"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="font-medium truncate pr-2">{item.product_name}</div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 -mt-1 -mr-1 text-muted-foreground hover:text-destructive"
              onClick={() => onRemove(item.product_id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-3 gap-2 mt-2">
            {/* Quantidade com botões +/- */}
            <div>
              <Label className="text-xs text-muted-foreground">Qtd Vol.</Label>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 flex-shrink-0 active:scale-95 transition-transform"
                  onClick={handleDecrement}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={displayQty}
                  onChange={handleQtyInputChange}
                  className="h-10 text-center font-mono w-12 px-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 flex-shrink-0 active:scale-95 transition-transform"
                  onClick={handleIncrement}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Vasilhame */}
            <div>
              <Label className="text-xs text-muted-foreground">Vasilhame</Label>
              <Select
                value={displayPackaging}
                onValueChange={handlePackagingChange}
              >
                <SelectTrigger className="h-10 text-xs">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {packagings.map(pkg => (
                    <SelectItem key={pkg.id} value={pkg.id} className="text-sm">
                      {pkg.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Preço */}
            <div>
              <Label className="text-xs text-muted-foreground">R$/Vol.</Label>
              <Input
                type="text"
                inputMode="decimal"
                value={displayPrice}
                onChange={handlePriceChange}
                className="h-10 text-right font-mono"
                placeholder="0,00"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
