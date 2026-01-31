import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSales } from '@/hooks/useSales';
import { useStock } from '@/hooks/useStock';
import { useBreakages } from '@/hooks/useBreakages';
import { useProducts } from '@/hooks/useProducts';
import { 
  DollarSign, 
  ShoppingCart, 
  AlertTriangle, 
  Package,
  TrendingUp,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Dashboard() {
  const { getTodayTotal, getTodayCount, todaySales } = useSales();
  const { getExpiringBatches, batches } = useStock();
  const { getRecentBreakages, getTotalLoss } = useBreakages();
  const { products } = useProducts();

  const todayTotal = getTodayTotal();
  const todayCount = getTodayCount();
  const expiringBatches = getExpiringBatches(3);
  const recentBreakages = getRecentBreakages(7);
  const totalLoss = getTotalLoss();

  // Products with low stock
  const lowStockProducts = products.filter(product => {
    const totalStock = batches
      .filter(b => b.product_id === product.id)
      .reduce((sum, b) => sum + Number(b.quantity), 0);
    return totalStock <= product.min_stock && product.is_active;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
        </p>
      </div>

      {/* Main metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Vendas Hoje</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(todayTotal)}
            </div>
            <p className="text-xs text-muted-foreground">
              {todayCount} {todayCount === 1 ? 'venda' : 'vendas'} realizadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Quebras (7 dias)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(recentBreakages.reduce((sum, b) => sum + Number(b.total_loss), 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              {recentBreakages.length} {recentBreakages.length === 1 ? 'registro' : 'registros'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {lowStockProducts.length}
            </div>
            <p className="text-xs text-muted-foreground">
              produtos abaixo do mínimo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Vencendo</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {expiringBatches.length}
            </div>
            <p className="text-xs text-muted-foreground">
              lotes nos próximos 3 dias
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Low stock alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Estoque Baixo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Nenhum produto com estoque baixo
              </p>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.slice(0, 5).map(product => {
                  const totalStock = batches
                    .filter(b => b.product_id === product.id)
                    .reduce((sum, b) => sum + Number(b.quantity), 0);
                  return (
                    <div key={product.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          PLU: {product.plu}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-yellow-600">
                          {totalStock.toFixed(2)} {product.unit}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Mín: {product.min_stock} {product.unit}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expiring batches */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Lotes Vencendo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expiringBatches.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Nenhum lote próximo do vencimento
              </p>
            ) : (
              <div className="space-y-3">
                {expiringBatches.slice(0, 5).map(batch => (
                  <div key={batch.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {(batch.product as any)?.name || 'Produto'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {batch.quantity.toFixed(2)} {(batch.product as any)?.unit || 'un'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-orange-600">
                        {batch.expiry_date && format(new Date(batch.expiry_date), 'dd/MM/yyyy')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent sales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Vendas Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todaySales.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nenhuma venda hoje
            </p>
          ) : (
            <div className="space-y-3">
              {todaySales.slice(0, 5).map(sale => (
                <div key={sale.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div>
                    <p className="font-medium">
                      {sale.items_count} {sale.items_count === 1 ? 'item' : 'itens'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(sale.created_at), 'HH:mm')}
                    </p>
                  </div>
                  <p className="font-medium text-green-600">
                    {formatCurrency(Number(sale.total))}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
