import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip as ShadcnTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useSales } from '@/hooks/useSales';
import { useStock } from '@/hooks/useStock';
import { useBreakages } from '@/hooks/useBreakages';
import { useProducts } from '@/hooks/useProducts';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import {
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
} from 'recharts';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Package,
  Clock,
  Target,
  Wallet,
  ShoppingCart
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Dashboard() {
  const { sales, getTodayTotal, getTodayRealProfit, getTodayRealCost } = useSales();
  const { getExpiringBatches, batches, getProductStock } = useStock();
  const { breakages } = useBreakages();
  const { products } = useProducts();
  const { orders } = usePurchaseOrders();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  // Calculate advanced metrics
  const metrics = useMemo(() => {
    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);

    // Today's revenue (from hook)
    const todayRevenue = getTodayTotal();

    // Today's breakage loss
    const todayBreakageLoss = breakages
      .filter(b => isWithinInterval(new Date(b.created_at), { start: todayStart, end: todayEnd }))
      .reduce((sum, b) => sum + Number(b.total_loss), 0);

    // Total stock value (quantity * cost_per_unit)
    const stockValue = batches.reduce((sum, b) => 
      sum + Number(b.quantity) * Number(b.cost_per_unit), 0);

    // Products expiring in 3 days
    const expiringIn3Days = getExpiringBatches(3);

    // LUCRO REAL: usa custo dos lotes vendidos via FIFO (dados reais do banco)
    const realCost = getTodayRealCost();
    const hasRealCostData = realCost > 0;
    
    // Se temos dados de custo real, usa; senão fallback para estimativa 60%
    const todayProfit = hasRealCostData 
      ? getTodayRealProfit() - todayBreakageLoss
      : todayRevenue - (todayRevenue * 0.6) - todayBreakageLoss;

    // MARGEM REAL: calcula a partir das vendas reais do dia (FIFO)
    // Dados históricos podem ter cost_per_unit incorreto (por volume em vez de por kg)
    // devido ao bug corrigido no trigger create_stock_batch_on_receiving.
    // Margens fora do range -100% a +100% indicam dados legados com custo incorreto.
    let realMargin = 0;
    let marginIsReliable = false;
    if (hasRealCostData && todayRevenue > 0) {
      const rawMargin = (todayRevenue - realCost) / todayRevenue;
      // Se a margem é plausível (entre -100% e +100%), usa o valor real
      if (rawMargin >= -1 && rawMargin <= 1) {
        realMargin = rawMargin;
        marginIsReliable = true;
      } else {
        // Dados de custo legados com unidade incorreta - fallback
        realMargin = 0.60;
      }
    } else {
      // Sem vendas hoje - fallback para margem alvo
      realMargin = 0.60;
    }

    return {
      todayRevenue,
      todayBreakageLoss,
      stockValue,
      expiringCount: expiringIn3Days.length,
      todayProfit,
      realMargin,
      hasRealCostData,
      marginIsReliable
    };
  }, [sales, batches, breakages, products, getExpiringBatches, getTodayTotal, getTodayRealProfit, getTodayRealCost]);

  // Data for stacked bar chart (last 7 days)
  const stackedBarData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      const revenue = sales
        .filter(s => isWithinInterval(new Date(s.created_at), { start: dayStart, end: dayEnd }))
        .reduce((sum, s) => sum + Number(s.total), 0);

      const breakageCost = breakages
        .filter(b => isWithinInterval(new Date(b.created_at), { start: dayStart, end: dayEnd }))
        .reduce((sum, b) => sum + Number(b.total_loss), 0);

      // Estimated merchandise cost (60% of revenue as approximation)
      const merchandiseCost = revenue * 0.6;
      const profit = revenue - merchandiseCost - breakageCost;

      data.push({
        day: format(date, 'EEE', { locale: ptBR }),
        fullDate: format(date, 'dd/MM'),
        receita: revenue,
        custoMercadoria: merchandiseCost,
        custoQuebra: breakageCost,
        lucro: Math.max(0, profit)
      });
    }
    return data;
  }, [sales, breakages]);

  // Purchase order metrics - focused on TODAY
  const purchaseMetrics = useMemo(() => {
    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);

    // Orders created today (any status)
    const ordersToday = orders.filter(o => 
      isWithinInterval(new Date(o.created_at), { start: todayStart, end: todayEnd })
    );

    // Compras Hoje = sum of total_estimated from all orders created today
    const comprasHoje = ordersToday.reduce((sum, o) => 
      sum + Number(o.total_estimated || 0), 0
    );

    // Pedidos Hoje = count of orders created today
    const pedidosHoje = ordersToday.length;

    // Venda Prevista = Compras Hoje / (1 - margem)
    // Margem média de sacolão/hortifruti: 60%
    // Fórmula: Venda = Custo / (1 - 0.60) = Custo / 0.40 = Custo * 2.5
    const margemMedia = 0.60; // 60% de margem
    const vendaPrevista = comprasHoje / (1 - margemMedia);

    // Lucro Previsto = Venda Prevista - Compras Hoje
    const lucroPrevisto = vendaPrevista - comprasHoje;

    return {
      comprasHoje,
      pedidosHoje,
      vendaPrevista,
      lucroPrevisto
    };
  }, [orders]);

  // Low stock products
  const lowStockProducts = products.filter(product => {
    const totalStock = getProductStock(product.id);
    return totalStock <= product.min_stock && product.is_active;
  });

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
      </div>

      {/* Main Metrics - MD3 Style: White cards, soft shadows */}
      <TooltipProvider>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Lucro do Dia */}
          <Card className="bg-card shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-4">
              <ShadcnTooltip>
                <TooltipTrigger asChild>
                  <CardTitle className="text-xs font-medium text-muted-foreground cursor-help">
                    Lucro do Dia {metrics.hasRealCostData ? '' : '~'}
                  </CardTitle>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{metrics.hasRealCostData 
                    ? 'Lucro real calculado com custo dos lotes vendidos (FIFO)'
                    : 'Estimativa usando margem de 60% (sem vendas com custo rastreado)'
                  }</p>
                </TooltipContent>
              </ShadcnTooltip>
              {metrics.todayProfit >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className={`text-2xl font-bold ${metrics.todayProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(metrics.todayProfit)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.hasRealCostData ? 'Receita - Custo Real' : 'Receita - Custo ~60%'}
              </p>
            </CardContent>
          </Card>

          {/* Margem Real */}
          <Card className="bg-card shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-4">
              <ShadcnTooltip>
                <TooltipTrigger asChild>
                  <CardTitle className="text-xs font-medium text-muted-foreground cursor-help">
                    Margem Real {!metrics.marginIsReliable ? '~' : ''}
                  </CardTitle>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{metrics.marginIsReliable 
                    ? 'Margem real calculada com vendas FIFO do dia'
                    : 'Margem alvo (sem vendas com custo rastreável hoje)'
                  }</p>
                </TooltipContent>
              </ShadcnTooltip>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className={`text-2xl font-bold ${metrics.realMargin >= 0.3 ? 'text-green-600' : 'text-amber-600'}`}>
                {formatPercent(metrics.realMargin)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.marginIsReliable ? 'Receita - Custo Real' : 'Meta de margem'}
              </p>
            </CardContent>
          </Card>

          {/* Estoque em Valor */}
          <Card className="bg-card shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-4">
              <ShadcnTooltip>
                <TooltipTrigger asChild>
                  <CardTitle className="text-xs font-medium text-muted-foreground cursor-help">Estoque (R$)</CardTitle>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Valor total do estoque em R$</p>
                </TooltipContent>
              </ShadcnTooltip>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-foreground">
                {formatCurrency(metrics.stockValue)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {batches.length} lotes ativos
              </p>
            </CardContent>
          </Card>

          {/* Vencendo em 3 dias */}
          <Card className="bg-card shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-4">
              <ShadcnTooltip>
                <TooltipTrigger asChild>
                  <CardTitle className="text-xs font-medium text-muted-foreground cursor-help">Vencendo</CardTitle>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Produtos próximos da data de validade</p>
                </TooltipContent>
              </ShadcnTooltip>
              <Clock className={`h-4 w-4 ${metrics.expiringCount > 0 ? 'text-amber-500' : 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className={`text-2xl font-bold ${metrics.expiringCount > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                {metrics.expiringCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                em 3 dias
              </p>
            </CardContent>
          </Card>
        </div>
      </TooltipProvider>

      {/* Resumo de Compras - MD3 Style: Pastel backgrounds */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Resumo de Compras
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Compras Hoje */}
            <div className="text-center p-4 rounded-2xl bg-amber-50">
              <div className="flex items-center justify-center gap-1.5 text-amber-700 mb-2">
                <ShoppingCart className="h-4 w-4" />
                <span className="text-xs font-medium">Compras Hoje</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-amber-700">
                {formatCurrency(purchaseMetrics.comprasHoje)}
              </div>
              <div className="text-[10px] text-amber-600/70 mt-1">
                total estimado
              </div>
            </div>

            {/* Pedidos Hoje */}
            <div className="text-center p-4 rounded-2xl bg-blue-50">
              <div className="flex items-center justify-center gap-1.5 text-blue-700 mb-2">
                <Package className="h-4 w-4" />
                <span className="text-xs font-medium">Pedidos Hoje</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-blue-700">
                {purchaseMetrics.pedidosHoje}
              </div>
              <div className="text-[10px] text-blue-600/70 mt-1">
                pedidos criados
              </div>
            </div>

            {/* Venda Prevista */}
            <div className="text-center p-4 rounded-2xl bg-green-50">
              <div className="flex items-center justify-center gap-1.5 text-green-700 mb-2">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs font-medium">Venda Prevista</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-green-700">
                {formatCurrency(purchaseMetrics.vendaPrevista)}
              </div>
              <div className="text-[10px] text-green-600/70 mt-1">
                receita esperada
              </div>
            </div>

            {/* Lucro Previsto */}
            <div className={`text-center p-4 rounded-2xl ${purchaseMetrics.lucroPrevisto >= 0 ? 'bg-purple-50' : 'bg-red-50'}`}>
              <div className={`flex items-center justify-center gap-1.5 mb-2 ${purchaseMetrics.lucroPrevisto >= 0 ? 'text-purple-700' : 'text-red-700'}`}>
                <DollarSign className="h-4 w-4" />
                <span className="text-xs font-medium">Lucro Previsto</span>
              </div>
              <div className={`text-xl sm:text-2xl font-bold ${purchaseMetrics.lucroPrevisto >= 0 ? 'text-purple-700' : 'text-red-700'}`}>
                {formatCurrency(purchaseMetrics.lucroPrevisto)}
              </div>
              <div className={`text-[10px] mt-1 ${purchaseMetrics.lucroPrevisto >= 0 ? 'text-purple-600/70' : 'text-red-600/70'}`}>
                venda - compras
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stacked Bar Chart - Revenue vs Costs - MD3 Style: Softer colors */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <DollarSign className="h-5 w-5" />
            Receita vs Custos (7 dias)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[220px] sm:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stackedBarData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="day" 
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(v) => `R$${v}`}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    formatCurrency(value),
                    name === 'receita' ? 'Receita' :
                    name === 'custoMercadoria' ? 'Custo Mercadoria' :
                    name === 'custoQuebra' ? 'Custo Quebra' : 'Lucro'
                  ]}
                  labelFormatter={(label, payload) => {
                    const item = payload?.[0]?.payload;
                    return item?.fullDate || label;
                  }}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '12px' }}
                  formatter={(value) => 
                    value === 'receita' ? 'Receita' :
                    value === 'custoMercadoria' ? 'Custo Mercadoria' :
                    value === 'custoQuebra' ? 'Custo Quebra' : 'Lucro'
                  }
                />
                {/* MD3 Softer colors: green-400, gray-400, red-400 */}
                <Bar dataKey="receita" stackId="a" fill="#4ade80" radius={[6, 6, 0, 0]} />
                <Bar dataKey="custoMercadoria" stackId="b" fill="#9ca3af" />
                <Bar dataKey="custoQuebra" stackId="b" fill="#f87171" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-4 mt-4 justify-center text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
              <span className="text-muted-foreground">Receita</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-400"></div>
              <span className="text-muted-foreground">Custo Mercadoria</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <span className="text-muted-foreground">Custo Quebra</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bottom cards - Alerts - MD3 Style */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Low stock alerts */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Package className="h-5 w-5 text-amber-500" />
              Estoque Baixo
              {lowStockProducts.length > 0 && (
                <Badge variant="warning-pastel" className="ml-auto">
                  {lowStockProducts.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                ✅ Todos os estoques OK
              </p>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.slice(0, 5).map(product => {
                  const totalStock = getProductStock(product.id);
                  return (
                    <div key={product.id} className="flex items-center justify-between p-2 rounded-xl bg-muted/30">
                      <div>
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Mín: {product.min_stock} {product.unit}
                        </p>
                      </div>
                      <Badge variant="danger-pastel">
                        {totalStock.toFixed(1)} {product.unit}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expiring batches */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Clock className="h-5 w-5 text-amber-500" />
              Vencendo em Breve
              {metrics.expiringCount > 0 && (
                <Badge variant="warning-pastel" className="ml-auto">
                  {metrics.expiringCount}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.expiringCount === 0 ? (
              <p className="text-muted-foreground text-sm">
                ✅ Nenhum lote próximo do vencimento
              </p>
            ) : (
              <div className="space-y-3">
                {getExpiringBatches(3).slice(0, 5).map(batch => {
                  const product = products.find(p => p.id === batch.product_id);
                  return (
                    <div key={batch.id} className="flex items-center justify-between p-2 rounded-xl bg-muted/30">
                      <div>
                        <p className="font-medium text-sm">{product?.name || 'Produto'}</p>
                        <p className="text-xs text-muted-foreground">
                          {Number(batch.quantity).toFixed(2)} {product?.unit || 'kg'}
                        </p>
                      </div>
                      <Badge variant="warning-pastel">
                        {batch.expiry_date && format(new Date(batch.expiry_date), 'dd/MM')}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
