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
  ScatterChart,
  Scatter,
  ZAxis,
  Cell,
  ReferenceLine
} from 'recharts';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle, 
  Package,
  Clock,
  Target,
  Wallet,
  BarChart3,
  ShoppingCart
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Dashboard() {
  const { sales, getTodayTotal, getTodayCount, getTodayRealProfit, getTodayRealCost } = useSales();
  const { getExpiringBatches, batches, getProductStock } = useStock();
  const { breakages, getTotalLoss, getRecentBreakages } = useBreakages();
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

    // MARGEM REAL: calcula a partir de custo_compra dos produtos (R$/kg vs R$/kg)
    const productsWithCost = products.filter(p => p.custo_compra && p.custo_compra > 0 && p.price > 0);
    
    let realMargin = 0;
    if (productsWithCost.length > 0) {
      const marginSum = productsWithCost.reduce((sum, p) => {
        const margin = (Number(p.price) - Number(p.custo_compra!)) / Number(p.price);
        return sum + margin;
      }, 0);
      realMargin = marginSum / productsWithCost.length;
    } else if (hasRealCostData && todayRevenue > 0) {
      // Calcula margem baseado nas vendas reais do dia
      realMargin = (todayRevenue - realCost) / todayRevenue;
    } else {
      // Fallback: margem alvo de 60%
      realMargin = 0.60;
    }

    return {
      todayRevenue,
      todayBreakageLoss,
      stockValue,
      expiringCount: expiringIn3Days.length,
      todayProfit,
      realMargin,
      hasRealCostData
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

  // Purchase order metrics
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

  // Data for scatter plot (Supplier toxic ranking simulation)
  // Since we don't have supplier data, we'll use product categories as proxy
  const scatterData = useMemo(() => {
    const productMetrics = products.map(product => {
      // Get all breakages for this product marked as "danificado" (from supplier)
      const productBreakages = breakages.filter(b => 
        b.product_id === product.id && b.reason === 'danificado'
      );
      const totalBreakageQty = productBreakages.reduce((sum, b) => sum + Number(b.quantity), 0);
      
      // Get total stock received for this product
      const totalReceived = batches
        .filter(b => b.product_id === product.id)
        .reduce((sum, b) => sum + Number(b.quantity), 0) + totalBreakageQty;

      const defectRate = totalReceived > 0 ? totalBreakageQty / totalReceived : 0;

      // Average cost
      const productBatches = batches.filter(b => b.product_id === product.id);
      const avgCost = productBatches.length > 0
        ? productBatches.reduce((sum, b) => sum + Number(b.cost_per_unit), 0) / productBatches.length
        : 0;

      return {
        name: product.name,
        category: product.category,
        avgPrice: avgCost,
        defectRate: defectRate * 100, // percentage
        // Quadrant: expensive (>5) and bad (>10% defect)
        isToxic: avgCost > 5 && defectRate > 0.1,
        z: totalReceived // size based on volume
      };
    }).filter(p => p.avgPrice > 0 || p.defectRate > 0);

    return productMetrics;
  }, [products, breakages, batches]);

  // Calculate quadrant thresholds
  const priceThreshold = useMemo(() => {
    const prices = scatterData.map(d => d.avgPrice).filter(p => p > 0);
    return prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 5;
  }, [scatterData]);

  const defectThreshold = 10; // 10% defect rate threshold

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
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard Inteligente</h1>
          <p className="text-muted-foreground">
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        <Badge variant="outline" className="w-fit">
          <BarChart3 className="h-3 w-3 mr-1" />
          Análise em tempo real
        </Badge>
      </div>

      {/* Main Metrics - 2x2 on mobile, 4 columns on desktop - COMPACT */}
      <TooltipProvider>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {/* Lucro do Dia */}
        <Card className={metrics.todayProfit >= 0 ? 'border-success/30 bg-success-muted' : 'border-danger/30 bg-danger-muted'}>
          <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0 p-3">
            <ShadcnTooltip>
              <TooltipTrigger asChild>
                <CardTitle className="text-[10px] sm:text-xs font-medium cursor-help">
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
              <TrendingUp className="h-3.5 w-3.5 text-success" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-danger" />
            )}
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className={`text-lg sm:text-xl font-bold ${metrics.todayProfit >= 0 ? 'text-success' : 'text-danger'}`}>
              {formatCurrency(metrics.todayProfit)}
            </div>
            <p className="text-[10px] text-muted-foreground">
              {metrics.hasRealCostData ? 'Receita - Custo Real' : 'Receita - Custo ~60%'}
            </p>
          </CardContent>
        </Card>

        {/* Margem Real */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0 p-3">
            <ShadcnTooltip>
              <TooltipTrigger asChild>
                <CardTitle className="text-[10px] sm:text-xs font-medium cursor-help">Margem Real</CardTitle>
              </TooltipTrigger>
              <TooltipContent>
                <p>Percentual de lucro sobre o preço de venda (baseado em custo_compra dos produtos)</p>
              </TooltipContent>
            </ShadcnTooltip>
            <Target className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className={`text-lg sm:text-xl font-bold ${metrics.realMargin >= 0.3 ? 'text-success' : 'text-warning'}`}>
              {formatPercent(metrics.realMargin)}
            </div>
            <p className="text-[10px] text-muted-foreground">
              Preço - Custo
            </p>
          </CardContent>
        </Card>

        {/* Estoque em Valor */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0 p-3">
            <ShadcnTooltip>
              <TooltipTrigger asChild>
                <CardTitle className="text-[10px] sm:text-xs font-medium cursor-help">Estoque (R$)</CardTitle>
              </TooltipTrigger>
              <TooltipContent>
                <p>Valor total do estoque em R$</p>
              </TooltipContent>
            </ShadcnTooltip>
            <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-lg sm:text-xl font-bold text-foreground">
              {formatCurrency(metrics.stockValue)}
            </div>
            <p className="text-[10px] text-muted-foreground">
              {batches.length} lotes
            </p>
          </CardContent>
        </Card>

        {/* Vencendo em 3 dias */}
        <Card className={metrics.expiringCount > 0 ? 'border-warning/30 bg-warning-muted' : ''}>
          <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0 p-3">
            <ShadcnTooltip>
              <TooltipTrigger asChild>
                <CardTitle className="text-[10px] sm:text-xs font-medium cursor-help">Vencendo</CardTitle>
              </TooltipTrigger>
              <TooltipContent>
                <p>Produtos próximos da data de validade</p>
              </TooltipContent>
            </ShadcnTooltip>
            <Clock className="h-3.5 w-3.5 text-warning" />
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className={`text-lg sm:text-xl font-bold ${metrics.expiringCount > 0 ? 'text-warning' : 'text-success'}`}>
              {metrics.expiringCount}
            </div>
            <p className="text-[10px] text-muted-foreground">
              em 3 dias
            </p>
          </CardContent>
        </Card>
        </div>
      </TooltipProvider>

      {/* Resumo de Compras */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Resumo de Compras
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Compras Hoje */}
            <div className="text-center p-3 rounded-lg bg-warning-muted border border-warning/20">
              <div className="flex items-center justify-center gap-1 text-warning mb-1">
                <ShoppingCart className="h-4 w-4" />
                <span className="text-xs font-medium">Compras Hoje</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-warning">
                {formatCurrency(purchaseMetrics.comprasHoje)}
              </div>
              <div className="text-[10px] text-muted-foreground">
                total estimado
              </div>
            </div>

            {/* Pedidos Hoje */}
            <div className="text-center p-3 rounded-lg bg-info-muted border border-info/20">
              <div className="flex items-center justify-center gap-1 text-info mb-1">
                <Package className="h-4 w-4" />
                <span className="text-xs font-medium">Pedidos Hoje</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-info">
                {purchaseMetrics.pedidosHoje}
              </div>
              <div className="text-[10px] text-muted-foreground">
                pedidos criados
              </div>
            </div>

            {/* Venda Prevista */}
            <div className="text-center p-3 rounded-lg bg-success-muted border border-success/20">
              <div className="flex items-center justify-center gap-1 text-success mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs font-medium">Venda Prevista</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-success">
                {formatCurrency(purchaseMetrics.vendaPrevista)}
              </div>
              <div className="text-[10px] text-muted-foreground">
                receita esperada
              </div>
            </div>

            {/* Lucro Previsto */}
            <div className={`text-center p-3 rounded-lg ${purchaseMetrics.lucroPrevisto >= 0 ? 'bg-success-muted border-success/20' : 'bg-danger-muted border-danger/20'} border`}>
              <div className={`flex items-center justify-center gap-1 mb-1 ${purchaseMetrics.lucroPrevisto >= 0 ? 'text-success' : 'text-danger'}`}>
                <DollarSign className="h-4 w-4" />
                <span className="text-xs font-medium">Lucro Previsto</span>
              </div>
              <div className={`text-xl sm:text-2xl font-bold ${purchaseMetrics.lucroPrevisto >= 0 ? 'text-success' : 'text-danger'}`}>
                {formatCurrency(purchaseMetrics.lucroPrevisto)}
              </div>
              <div className="text-[10px] text-muted-foreground">
                venda - compras
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stacked Bar Chart - Revenue vs Costs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <DollarSign className="h-5 w-5" />
            Receita vs Custos (7 dias)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] sm:h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stackedBarData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="day" 
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => `R$${v}`}
                  className="text-muted-foreground"
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
                    borderRadius: '8px'
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
                <Bar dataKey="receita" stackId="a" fill="hsl(150, 60%, 35%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="custoMercadoria" stackId="b" fill="hsl(150, 20%, 40%)" />
                <Bar dataKey="custoQuebra" stackId="b" fill="hsl(0, 70%, 50%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-4 mt-4 justify-center text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-success"></div>
              <span className="text-muted-foreground">Receita (verde)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-muted-foreground"></div>
              <span className="text-muted-foreground">Custo Mercadoria</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-danger"></div>
              <span className="text-muted-foreground">Custo Quebra</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scatter Plot - Toxic Supplier Ranking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <AlertTriangle className="h-5 w-5 text-danger" />
            Ranking Fornecedor Tóxico
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Produtos no quadrante vermelho: Caro + Alto índice de defeito
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-[220px] sm:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  type="number" 
                  dataKey="avgPrice" 
                  name="Preço Médio"
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Preço Médio (R$/kg)', position: 'bottom', fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <YAxis 
                  type="number" 
                  dataKey="defectRate" 
                  name="% Defeito"
                  tick={{ fontSize: 12 }}
                  label={{ value: '% Defeito', angle: -90, position: 'insideLeft', fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <ZAxis type="number" dataKey="z" range={[50, 400]} />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-popover border rounded-lg p-3 shadow-lg">
                          <p className="font-medium">{data.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Preço: {formatCurrency(data.avgPrice)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Defeito: {data.defectRate.toFixed(1)}%
                          </p>
                          {data.isToxic && (
                            <Badge variant="destructive" className="mt-2">
                              ⚠️ Fornecedor Tóxico
                            </Badge>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {/* Reference lines for quadrants */}
                <ReferenceLine 
                  x={priceThreshold} 
                  stroke="hsl(38, 92%, 50%)" 
                  strokeDasharray="5 5"
                  label={{ value: 'Preço Médio', position: 'top', fontSize: 10 }}
                />
                <ReferenceLine 
                  y={defectThreshold} 
                  stroke="hsl(38, 92%, 50%)" 
                  strokeDasharray="5 5"
                  label={{ value: '10% defeito', position: 'right', fontSize: 10 }}
                />
                <Scatter name="Produtos" data={scatterData}>
                  {scatterData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.isToxic ? 'hsl(0, 70%, 50%)' : 'hsl(150, 60%, 35%)'}
                      strokeWidth={entry.isToxic ? 2 : 0}
                      stroke="hsl(0, 70%, 50%)"
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-4 mt-4 justify-center text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-success"></div>
              <span className="text-muted-foreground">Bom fornecedor</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-danger"></div>
              <span className="text-muted-foreground">Tóxico (Caro + Ruim)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bottom cards - Alerts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Low stock alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-warning" />
              Estoque Baixo
              {lowStockProducts.length > 0 && (
                <Badge variant="secondary">{lowStockProducts.length}</Badge>
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
                    <div key={product.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Mín: {product.min_stock} {product.unit}
                        </p>
                      </div>
                      <Badge variant="destructive">
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-warning" />
              Vencendo em Breve
              {metrics.expiringCount > 0 && (
                <Badge variant="secondary">{metrics.expiringCount}</Badge>
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
                    <div key={batch.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{product?.name || 'Produto'}</p>
                        <p className="text-xs text-muted-foreground">
                          {Number(batch.quantity).toFixed(2)} {product?.unit || 'kg'}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-warning border-warning">
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
