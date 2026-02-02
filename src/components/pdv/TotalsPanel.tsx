import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, ShoppingCart, Trash2 } from 'lucide-react';

interface TotalsPanelProps {
  itemsCount: number;
  total: number;
  onFinalize: () => void;
  onClearCart: () => void;
  isProcessing: boolean;
  formatCurrency: (value: number) => string;
}

export function TotalsPanel({
  itemsCount,
  total,
  onFinalize,
  onClearCart,
  isProcessing,
  formatCurrency
}: TotalsPanelProps) {
  return (
    <Card className="h-full flex flex-col bg-card lg:h-auto">
      <CardHeader className="pb-2 lg:pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 lg:h-6 lg:w-6" />
            <span className="text-base lg:text-lg">Carrinho</span>
          </div>
          <span className="text-xl lg:text-2xl">{itemsCount}</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col justify-end gap-3 lg:gap-4 pb-safe">
        {/* Total display */}
        <div className="bg-muted rounded-xl p-4 lg:p-6 text-center">
          <p className="text-muted-foreground text-xs lg:text-sm uppercase tracking-wide mb-1">Total</p>
          <p className="text-2xl lg:text-4xl font-bold text-foreground">
            {formatCurrency(total)}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex lg:flex-col gap-2 lg:gap-3">
          <Button
            className="flex-1 h-14 lg:h-16 text-base lg:text-xl font-semibold"
            onClick={onFinalize}
            disabled={itemsCount === 0 || isProcessing}
          >
            <CreditCard className="mr-2 lg:mr-3 h-5 w-5 lg:h-6 lg:w-6" />
            {isProcessing ? 'Processando...' : 'Finalizar'}
          </Button>
          
          <Button
            variant="outline"
            className="h-14 lg:h-16 lg:w-full px-4 lg:text-lg"
            onClick={onClearCart}
            disabled={itemsCount === 0}
          >
            <Trash2 className="h-5 w-5 lg:mr-3" />
            <span className="hidden lg:inline">Limpar Carrinho</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
