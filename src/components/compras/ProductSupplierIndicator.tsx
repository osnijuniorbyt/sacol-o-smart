import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useProductSupplierStats } from '@/hooks/useProductSupplierStats';
import { Check, Star } from 'lucide-react';

interface ProductSupplierIndicatorProps {
  productId: string;
  selectedSupplierId: string | null;
}

export function ProductSupplierIndicator({ productId, selectedSupplierId }: ProductSupplierIndicatorProps) {
  const { getMainSupplier, hasOrderedFromSupplier, getSuppliersForProduct } = useProductSupplierStats();
  
  const mainSupplier = getMainSupplier(productId);
  const suppliers = getSuppliersForProduct(productId);
  const isFromSelectedSupplier = selectedSupplierId ? hasOrderedFromSupplier(productId, selectedSupplierId) : false;
  
  if (suppliers.length === 0) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1">
            {isFromSelectedSupplier && (
              <Badge variant="outline" className="h-5 px-1.5 gap-0.5 text-xs bg-primary/10 border-primary/30">
                <Check className="h-3 w-3" />
              </Badge>
            )}
            {mainSupplier && (
              <Badge variant="secondary" className="h-5 px-1.5 gap-0.5 text-xs truncate max-w-[80px]">
                <Star className="h-3 w-3 shrink-0" />
                <span className="truncate">{mainSupplier.supplier_name.split(' ')[0]}</span>
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[200px]">
          <div className="text-xs space-y-1">
            {mainSupplier && (
              <p className="font-medium">
                Principal: {mainSupplier.supplier_name} ({mainSupplier.total_quantity} cx)
              </p>
            )}
            {suppliers.length > 1 && (
              <p className="text-muted-foreground">
                +{suppliers.length - 1} fornecedor{suppliers.length > 2 ? 'es' : ''}
              </p>
            )}
            {isFromSelectedSupplier && (
              <p className="text-primary">✓ Já veio deste fornecedor</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
