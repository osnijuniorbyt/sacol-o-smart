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
    <Card className="h-full flex flex-col bg-card">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-6 w-6" />
            <span>Carrinho</span>
          </div>
          <span className="text-2xl">{itemsCount}</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col justify-end gap-4">
        {/* Total display */}
        <div className="bg-muted rounded-xl p-6 text-center">
          <p className="text-muted-foreground text-sm uppercase tracking-wide mb-1">Total</p>
          <p className="text-4xl font-bold text-foreground">
            {formatCurrency(total)}
          </p>
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          <Button
            className="w-full h-16 text-xl font-semibold"
            onClick={onFinalize}
            disabled={itemsCount === 0 || isProcessing}
          >
            <CreditCard className="mr-3 h-6 w-6" />
            {isProcessing ? 'Processando...' : 'Finalizar Venda'}
          </Button>
          
          <Button
            variant="outline"
            className="w-full h-16 text-lg"
            onClick={onClearCart}
            disabled={itemsCount === 0}
          >
            <Trash2 className="mr-3 h-5 w-5" />
            Limpar Carrinho
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
