import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Supplier } from '@/hooks/useSuppliers';
import { Product } from '@/types/database';
import { 
  Lightbulb, 
  Loader2, 
  Building2, 
  TrendingUp,
  Package,
  AlertTriangle,
  Check
} from 'lucide-react';
import { toast } from 'sonner';

interface SuggestedItem {
  product_id: string;
  product_name: string;
  avg_daily_sales: number;
  current_stock: number;
  days_of_stock: number;
  suggested_qty: number; // em caixas
  last_price: number | null;
}

interface SuggestedOrderDialogProps {
  suppliers: Supplier[];
  products: Product[];
  onApplySuggestion: (items: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    unit_cost: number | null;
  }>, supplierId: string) => void;
}

export function SuggestedOrderDialog({ 
  suppliers, 
  products,
  onApplySuggestion 
}: SuggestedOrderDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestedItem[]>([]);
  const [daysToAnalyze, setDaysToAnalyze] = useState(7);
  const [daysToStock, setDaysToStock] = useState(7);

  // Quando muda fornecedor, recalcula sugestões
  useEffect(() => {
    if (selectedSupplier && open) {
      calculateSuggestions();
    }
  }, [selectedSupplier, daysToAnalyze, daysToStock]);

  const calculateSuggestions = async () => {
    if (!selectedSupplier) return;
    
    setIsLoading(true);
    try {
      // Produtos do fornecedor selecionado
      const supplierProducts = products.filter(p => p.supplier_id === selectedSupplier);
      
      if (supplierProducts.length === 0) {
        setSuggestions([]);
        toast.info('Este fornecedor não possui produtos cadastrados');
        setIsLoading(false);
        return;
      }

      const productIds = supplierProducts.map(p => p.id);
      
      // Busca vendas dos últimos X dias
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysToAnalyze);
      
      const { data: salesData, error: salesError } = await supabase
        .from('sale_items')
        .select('product_id, quantity, created_at')
        .in('product_id', productIds)
        .gte('created_at', startDate.toISOString());
      
      if (salesError) throw salesError;

      // Busca estoque atual
      const { data: stockData, error: stockError } = await supabase
        .from('stock_batches')
        .select('product_id, quantity')
        .in('product_id', productIds)
        .gt('quantity', 0);
      
      if (stockError) throw stockError;

      // Agrupa vendas por produto
      const salesByProduct: Record<string, number> = {};
      salesData?.forEach(sale => {
        salesByProduct[sale.product_id] = (salesByProduct[sale.product_id] || 0) + Number(sale.quantity);
      });

      // Agrupa estoque por produto
      const stockByProduct: Record<string, number> = {};
      stockData?.forEach(batch => {
        stockByProduct[batch.product_id] = (stockByProduct[batch.product_id] || 0) + Number(batch.quantity);
      });

      // Calcula sugestões
      const suggestedItems: SuggestedItem[] = supplierProducts.map(product => {
        const totalSold = salesByProduct[product.id] || 0;
        const avgDaily = totalSold / daysToAnalyze;
        const currentStock = stockByProduct[product.id] || 0;
        const daysOfStock = avgDaily > 0 ? currentStock / avgDaily : 999;
        
        // Sugere quantidade para repor até daysToStock dias
        const neededKg = Math.max(0, (avgDaily * daysToStock) - currentStock);
        
        // Converte para caixas (usando fator_conversao ou assumindo 22kg/cx)
        const fator = (product as any).fator_conversao || 22;
        const suggestedBoxes = Math.ceil(neededKg / fator);
        
        return {
          product_id: product.id,
          product_name: product.name,
          avg_daily_sales: avgDaily,
          current_stock: currentStock,
          days_of_stock: daysOfStock,
          suggested_qty: suggestedBoxes,
          last_price: (product as any).ultimo_preco_caixa || null,
        };
      });

      // Ordena por prioridade (menos dias de estoque primeiro)
      suggestedItems.sort((a, b) => a.days_of_stock - b.days_of_stock);

      setSuggestions(suggestedItems);
    } catch (error: any) {
      console.error('Erro ao calcular sugestões:', error);
      toast.error('Erro ao calcular sugestões: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateQuantity = (productId: string, newQty: number) => {
    setSuggestions(prev => 
      prev.map(item => 
        item.product_id === productId 
          ? { ...item, suggested_qty: Math.max(0, newQty) }
          : item
      )
    );
  };

  const handleApply = () => {
    const itemsToApply = suggestions
      .filter(s => s.suggested_qty > 0)
      .map(s => ({
        product_id: s.product_id,
        product_name: s.product_name,
        quantity: s.suggested_qty,
        unit_cost: s.last_price,
      }));

    if (itemsToApply.length === 0) {
      toast.warning('Nenhum item com quantidade > 0');
      return;
    }

    onApplySuggestion(itemsToApply, selectedSupplier);
    setOpen(false);
    toast.success(`${itemsToApply.length} itens adicionados ao pedido`);
  };

  const totalBoxes = suggestions.reduce((sum, s) => sum + s.suggested_qty, 0);
  const itemsWithSuggestion = suggestions.filter(s => s.suggested_qty > 0);
  const criticalItems = suggestions.filter(s => s.days_of_stock < 3);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Lightbulb className="h-4 w-4" />
          Pedido Sugerido
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Pedido Sugerido por Vendas
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto flex-1">
          {/* Configurações */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Fornecedor</label>
              <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {suppliers.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Analisar últimos</label>
              <Select value={String(daysToAnalyze)} onValueChange={(v) => setDaysToAnalyze(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="3">3 dias</SelectItem>
                  <SelectItem value="7">7 dias</SelectItem>
                  <SelectItem value="14">14 dias</SelectItem>
                  <SelectItem value="30">30 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Estoque para</label>
              <Select value={String(daysToStock)} onValueChange={(v) => setDaysToStock(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="3">3 dias</SelectItem>
                  <SelectItem value="5">5 dias</SelectItem>
                  <SelectItem value="7">7 dias</SelectItem>
                  <SelectItem value="10">10 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Resumo */}
          {selectedSupplier && !isLoading && suggestions.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {criticalItems.length > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {criticalItems.length} críticos
                </Badge>
              )}
              <Badge variant="secondary" className="gap-1">
                <Package className="h-3 w-3" />
                {itemsWithSuggestion.length} produtos
              </Badge>
              <Badge variant="secondary">
                {totalBoxes} caixas
              </Badge>
            </div>
          )}

          {/* Lista de Sugestões */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Analisando vendas...</span>
            </div>
          ) : !selectedSupplier ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <Building2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground">
                  Selecione um fornecedor para ver as sugestões
                </p>
              </CardContent>
            </Card>
          ) : suggestions.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground">
                  Nenhum produto cadastrado para este fornecedor
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {suggestions.map(item => (
                <div 
                  key={item.product_id}
                  className={`p-3 rounded-lg border flex items-center gap-3 ${
                    item.days_of_stock < 3 
                      ? 'border-destructive/50 bg-destructive/5' 
                      : item.days_of_stock < 7
                        ? 'border-warning/50 bg-warning/5'
                        : 'border-border'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{item.product_name}</div>
                    <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3">
                      <span>Venda: {item.avg_daily_sales.toFixed(1)} kg/dia</span>
                      <span>Estoque: {item.current_stock.toFixed(0)} kg</span>
                      <span className={item.days_of_stock < 3 ? 'text-destructive font-medium' : ''}>
                        ≈ {item.days_of_stock < 999 ? `${item.days_of_stock.toFixed(0)} dias` : '∞'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={item.suggested_qty}
                      onChange={(e) => handleUpdateQuantity(item.product_id, parseInt(e.target.value) || 0)}
                      className="w-16 h-9 text-center font-mono"
                      min="0"
                    />
                    <span className="text-sm text-muted-foreground">cx</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {selectedSupplier && suggestions.length > 0 && (
          <div className="pt-4 border-t flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {itemsWithSuggestion.length} produtos • {totalBoxes} caixas
            </div>
            <Button 
              onClick={handleApply} 
              disabled={totalBoxes === 0}
              className="gap-2"
            >
              <Check className="h-4 w-4" />
              Aplicar Sugestão
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
