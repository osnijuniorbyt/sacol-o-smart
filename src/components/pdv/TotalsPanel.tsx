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
    <Card className="h-full flex flex-col bg-gradient-to-b from-[hsl(150,40%,20%)] to-[hsl(150,45%,15%)] text-white rounded-2xl border-0 shadow-lg lg:h-auto">
      <CardHeader className="pb-2 lg:pb-4">
        <CardTitle className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 lg:h-6 lg:w-6" />
            </div>
            <span className="text-base lg:text-lg font-semibold">Carrinho</span>
          </div>
          <span className="text-2xl lg:text-3xl font-bold bg-white/10 px-3 py-1 rounded-full">{itemsCount}</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col justify-end gap-3 lg:gap-4 pb-safe">
        {/* Total display - MD3 Style */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 lg:p-6 text-center">
          <p className="text-white/60 text-xs lg:text-sm uppercase tracking-wide mb-1">Total</p>
          <p className="text-3xl lg:text-5xl font-bold text-white font-mono">
            {formatCurrency(total)}
          </p>
        </div>

        {/* Action buttons - Pill style */}
        <div className="flex lg:flex-col gap-2 lg:gap-3">
          <Button
            className="flex-1 h-14 lg:h-16 text-base lg:text-xl font-bold rounded-xl bg-white text-[hsl(150,45%,20%)] hover:bg-white/90 shadow-lg"
            onClick={onFinalize}
            disabled={itemsCount === 0 || isProcessing}
          >
            <CreditCard className="mr-2 lg:mr-3 h-5 w-5 lg:h-6 lg:w-6" />
            {isProcessing ? 'Processando...' : 'Finalizar'}
          </Button>
          
          <Button
            variant="outline"
            className="h-14 lg:h-16 lg:w-full px-4 lg:text-lg rounded-xl border-white/30 text-white hover:bg-white/10 hover:text-white"
            onClick={onClearCart}
            disabled={itemsCount === 0}
          >
            <Trash2 className="h-5 w-5 lg:mr-3" />
            <span className="hidden lg:inline">Limpar</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
