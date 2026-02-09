import { useState, useRef, useEffect, memo, useCallback, useMemo } from 'react';
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
import { PackagingMaterial } from '@/types/database';

interface Packaging {
  id: string;
  codigo: string | null;
  name: string;
  tare_weight: number;
  peso_liquido: number;
  material: PackagingMaterial;
}

// Emoji por material
const MATERIAL_ICON: Record<PackagingMaterial, string> = {
  plastico: '🧊',
  madeira: '🪵',
  papelao: '📦',
  isopor: '❄️',
};

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

  // ============ INFO CALCULADA ============
  const infoCalculada = useMemo(() => {
    const selectedPkg = packagings.find(p => p.id === displayPackaging);
    if (!selectedPkg) return null;

    const qtdUnitaria = displayQty * selectedPkg.peso_liquido;
    const valorTotal = displayQty * (parseFloat(displayPrice) || 0);
    const custoUnitario = qtdUnitaria > 0 ? valorTotal / qtdUnitaria : 0;
    
    return {
      pkg: selectedPkg,
      qtdUnitaria,
      custoUnitario,
      icon: MATERIAL_ICON[selectedPkg.material] || '📦',
    };
  }, [displayPackaging, displayQty, displayPrice, packagings]);

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

  // Helper para mostrar código ou fallback
  const getDisplayCode = (pkg: Packaging) => {
    return pkg.codigo || pkg.name.slice(0, 6).toUpperCase();
  };

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
          
          {/* Quantidade com botões +/- - FULL WIDTH */}
          <div className="mt-2">
            <Label className="text-xs text-muted-foreground">Quantidade</Label>
            <div className="flex items-center gap-2 mt-1">
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 flex-shrink-0 active:scale-90 active:bg-destructive/20 active:border-destructive transition-all duration-150 hover:bg-destructive/10 hover:border-destructive/50"
                onClick={handleDecrement}
              >
                <Minus className="h-5 w-5" />
              </Button>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={displayQty}
                onChange={handleQtyInputChange}
                className="h-12 text-center font-mono text-xl font-bold flex-1 min-w-[60px] max-w-[80px] bg-muted/50 border-2 border-dashed border-muted-foreground/30 focus:border-primary focus:bg-background rounded-lg"
              />
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 flex-shrink-0 active:scale-90 active:bg-primary/20 active:border-primary transition-all duration-150 hover:bg-primary/10 hover:border-primary/50"
                onClick={handleIncrement}
              >
                <Plus className="h-5 w-5" />
              </Button>
              <span className="text-sm text-muted-foreground ml-2">vol.</span>
            </div>
          </div>

          {/* Vasilhame e Preço em 2 colunas */}
          <div className="grid grid-cols-2 gap-2 mt-2">
            {/* Vasilhame - Mostra CÓDIGO */}
            <div>
              <Label className="text-xs text-muted-foreground">Vasilhame</Label>
              <Select
                value={displayPackaging}
                onValueChange={handlePackagingChange}
              >
                <SelectTrigger className="h-12 text-xs font-mono font-medium">
                  <SelectValue placeholder="Selecione">
                    {displayPackaging && packagings.find(p => p.id === displayPackaging) && (
                      <span>{getDisplayCode(packagings.find(p => p.id === displayPackaging)!)}</span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {packagings.map(pkg => (
                    <SelectItem key={pkg.id} value={pkg.id} className="py-2">
                      <div className="flex flex-col">
                        <span className="font-mono font-bold text-sm">
                          {MATERIAL_ICON[pkg.material]} {getDisplayCode(pkg)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {pkg.name} • {pkg.peso_liquido}kg/vol
                        </span>
                      </div>
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
                pattern="[0-9]*[.,]?[0-9]*"
                value={displayPrice}
                onChange={handlePriceChange}
                className="h-12 text-right font-mono text-lg"
                placeholder="0,00"
              />
            </div>
          </div>

          {/* Info Calculada - mostrar quando tiver vasilhame selecionado */}
          {infoCalculada && (
            <div className="mt-2 px-2 py-1.5 bg-muted/50 rounded text-xs text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span>{infoCalculada.icon} {infoCalculada.pkg.name}</span>
              <span>•</span>
              <span>Tara {infoCalculada.pkg.tare_weight}kg</span>
              <span>•</span>
              <span className="font-mono">{displayQty}×{infoCalculada.pkg.peso_liquido}kg = {infoCalculada.qtdUnitaria.toFixed(1)}kg</span>
              {infoCalculada.custoUnitario > 0 && (
                <>
                  <span>•</span>
                  <span className="font-mono font-medium text-foreground">R$ {infoCalculada.custoUnitario.toFixed(2)}/kg</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
