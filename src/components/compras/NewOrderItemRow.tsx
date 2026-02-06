 import { useState, useRef, useEffect, memo } from 'react';
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
    setLocalQuantity(newQty); // INSTANTÂNEO
    
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onQuantityChange(item.product_id, newQty);
      releaseEditLock(); // Libera trava após enviar
    }, 500);
  };

  const handleDecrement = () => {
    if (localQuantity <= 1) {
      onRemove(item.product_id);
      return;
    }
    
    setIsEditing(true); // TRAVA: ignora atualizações externas
    const newQty = localQuantity - 1;
    setLocalQuantity(newQty); // INSTANTÂNEO
    
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onQuantityChange(item.product_id, newQty);
      releaseEditLock(); // Libera trava após enviar
    }, 500);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsEditing(true); // TRAVA: ignora atualizações externas
    const value = parseInt(e.target.value) || 1;
    setLocalQuantity(value); // INSTANTÂNEO
    
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onQuantityChange(item.product_id, value);
      releaseEditLock(); // Libera trava após enviar
    }, 500);
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
                   onChange={handleInputChange}
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
                 value={item.packaging_id || ''}
                 onValueChange={(v) => onFieldChange(item.product_id, 'packaging_id', v || null)}
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
                 type="number"
                 inputMode="decimal"
                 step="0.01"
                 value={item.unit_price ?? ''}
                 onChange={(e) => onFieldChange(
                   item.product_id, 
                   'unit_price', 
                   parseFloat(e.target.value) || null
                 )}
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