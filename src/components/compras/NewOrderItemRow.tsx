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

// Tempo de trava de edição (ms) - bloqueia sync de props enquanto usuário edita
const EDIT_LOCK_DURATION = 3000;

export const NewOrderItemRow = memo(function NewOrderItemRow({
  item,
  packagings,
  onQuantityChange,
  onFieldChange,
  onRemove,
}: NewOrderItemRowProps) {
  // ============ ESTADOS LOCAIS OTIMISTAS ============
  // Cada campo tem seu próprio estado local + flag de edição
  
  // Quantidade
  const [localQuantity, setLocalQuantity] = useState(item.quantity);
  const [isEditingQty, setIsEditingQty] = useState(false);
  const qtyLockTimerRef = useRef<NodeJS.Timeout>();
  const qtyDebounceRef = useRef<NodeJS.Timeout>();
  
  // Preço
  const [localPrice, setLocalPrice] = useState<string>(
    item.unit_price !== null ? String(item.unit_price) : ''
  );
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const priceLockTimerRef = useRef<NodeJS.Timeout>();
  
  // Vasilhame
  const [localPackaging, setLocalPackaging] = useState(item.packaging_id || '');
  const [isEditingPkg, setIsEditingPkg] = useState(false);
  const pkgLockTimerRef = useRef<NodeJS.Timeout>();

  // ============ SYNC DE PROPS (apenas quando NÃO está editando) ============
  
  // Sync quantidade
  useEffect(() => {
    if (!isEditingQty) {
      setLocalQuantity(item.quantity);
    }
  }, [item.quantity, isEditingQty]);
  
  // Sync preço
  useEffect(() => {
    if (!isEditingPrice) {
      setLocalPrice(item.unit_price !== null ? String(item.unit_price) : '');
    }
  }, [item.unit_price, isEditingPrice]);
  
  // Sync vasilhame
  useEffect(() => {
    if (!isEditingPkg) {
      setLocalPackaging(item.packaging_id || '');
    }
  }, [item.packaging_id, isEditingPkg]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (qtyLockTimerRef.current) clearTimeout(qtyLockTimerRef.current);
      if (qtyDebounceRef.current) clearTimeout(qtyDebounceRef.current);
      if (priceLockTimerRef.current) clearTimeout(priceLockTimerRef.current);
      if (pkgLockTimerRef.current) clearTimeout(pkgLockTimerRef.current);
    };
  }, []);

  // ============ HANDLERS DE QUANTIDADE ============
  
  const activateQtyLock = useCallback(() => {
    setIsEditingQty(true);
    if (qtyLockTimerRef.current) clearTimeout(qtyLockTimerRef.current);
    qtyLockTimerRef.current = setTimeout(() => {
      setIsEditingQty(false);
    }, EDIT_LOCK_DURATION);
  }, []);

  const handleIncrement = useCallback(() => {
    const newQty = localQuantity + 1;
    setLocalQuantity(newQty);
    activateQtyLock();
    
    if (qtyDebounceRef.current) clearTimeout(qtyDebounceRef.current);
    qtyDebounceRef.current = setTimeout(() => {
      onQuantityChange(item.product_id, newQty);
    }, 500);
  }, [localQuantity, item.product_id, onQuantityChange, activateQtyLock]);

  const handleDecrement = useCallback(() => {
    if (localQuantity <= 1) {
      onRemove(item.product_id);
      return;
    }
    
    const newQty = localQuantity - 1;
    setLocalQuantity(newQty);
    activateQtyLock();
    
    if (qtyDebounceRef.current) clearTimeout(qtyDebounceRef.current);
    qtyDebounceRef.current = setTimeout(() => {
      onQuantityChange(item.product_id, newQty);
    }, 500);
  }, [localQuantity, item.product_id, onQuantityChange, onRemove, activateQtyLock]);

  const handleQtyInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 1;
    setLocalQuantity(value);
    activateQtyLock();
    
    if (qtyDebounceRef.current) clearTimeout(qtyDebounceRef.current);
    qtyDebounceRef.current = setTimeout(() => {
      onQuantityChange(item.product_id, value);
    }, 500);
  }, [item.product_id, onQuantityChange, activateQtyLock]);

  // ============ HANDLERS DE PREÇO ============
  
  const handlePriceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalPrice(value);
    
    // Ativa trava de edição
    setIsEditingPrice(true);
    if (priceLockTimerRef.current) clearTimeout(priceLockTimerRef.current);
    priceLockTimerRef.current = setTimeout(() => {
      setIsEditingPrice(false);
    }, EDIT_LOCK_DURATION);
    
    // Propaga para o pai imediatamente (o pai gerencia o estado master)
    const numValue = parseFloat(value) || null;
    onFieldChange(item.product_id, 'unit_price', numValue);
  }, [item.product_id, onFieldChange]);

  // ============ HANDLERS DE VASILHAME ============
  
  const handlePackagingChange = useCallback((value: string) => {
    setLocalPackaging(value);
    
    // Ativa trava de edição
    setIsEditingPkg(true);
    if (pkgLockTimerRef.current) clearTimeout(pkgLockTimerRef.current);
    pkgLockTimerRef.current = setTimeout(() => {
      setIsEditingPkg(false);
    }, EDIT_LOCK_DURATION);
    
    // Propaga para o pai imediatamente
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
            {/* Quantidade com botões +/- otimistas */}
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
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={localQuantity}
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
            
            {/* Vasilhame - usa estado local */}
            <div>
              <Label className="text-xs text-muted-foreground">Vasilhame</Label>
              <Select
                value={localPackaging}
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
            
            {/* Preço - usa estado local */}
            <div>
              <Label className="text-xs text-muted-foreground">R$/Vol.</Label>
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                value={localPrice}
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
