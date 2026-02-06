import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useStock } from '@/hooks/useStock';
import { useProducts } from '@/hooks/useProducts';
import { OfflineStatus } from '@/components/OfflineStatus';
import { Package, Plus, AlertTriangle, Clock, Loader2 } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';

export default function Estoque() {
  const { 
    batches, 
    addBatch, 
    isLoading, 
    isOnline, 
    isFromCache, 
    lastUpdated, 
    refresh 
  } = useStock();
  const { products, activeProducts } = useProducts();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterProduct, setFilterProduct] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [formData, setFormData] = useState({
    product_id: '',
    quantity: '',
    cost_per_unit: '',
    expiry_date: ''
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await addBatch.mutateAsync({
      product_id: formData.product_id,
      quantity: parseFloat(formData.quantity),
      cost_per_unit: parseFloat(formData.cost_per_unit),
      expiry_date: formData.expiry_date || undefined
    });

    setFormData({
      product_id: '',
      quantity: '',
      cost_per_unit: '',
      expiry_date: ''
    });
    setDialogOpen(false);
  };

  const getExpiryStatus = (expiryDate: string | null) => {
    if (!expiryDate) return 'none';
    const days = differenceInDays(new Date(expiryDate), new Date());
    if (days < 0) return 'expired';
    if (days <= 3) return 'critical';
    if (days <= 7) return 'warning';
    return 'ok';
  };

  const getExpiryColor = (status: string) => {
    switch (status) {
      case 'expired': return 'bg-red-100 border-red-300 text-red-800 dark:bg-red-900/30 dark:border-red-700 dark:text-red-200';
      case 'critical': return 'bg-orange-100 border-orange-300 text-orange-800 dark:bg-orange-900/30 dark:border-orange-700 dark:text-orange-200';
      case 'warning': return 'bg-yellow-100 border-yellow-300 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-200';
      default: return 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800';
    }
  };

  const filteredBatches = filterProduct === 'all' 
    ? batches 
    : batches.filter(b => b.product_id === filterProduct);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Group batches by product
  const groupedBatches = filteredBatches.reduce((acc, batch) => {
    const productId = batch.product_id;
    if (!acc[productId]) {
      acc[productId] = [];
    }
    acc[productId].push(batch);
    return acc;
  }, {} as Record<string, typeof batches>);

  return (
    <div className="space-y-4 pb-24">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Estoque</h1>
          <p className="text-sm text-muted-foreground">Controle de lotes por FIFO</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="h-12 px-5" disabled={!isOnline}>
              <Plus className="mr-2 h-5 w-5" />
              Entrada
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nova Entrada de Estoque</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Produto</Label>
                <Select
                  value={formData.product_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, product_id: value }))}
                  required
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Selecione o produto" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    {activeProducts.map(product => (
                      <SelectItem key={product.id} value={product.id} className="py-3">
                        {product.name} (PLU: {product.plu})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Quantidade</Label>
                  <Input
                    type="number"
                    step="0.001"
                    value={formData.quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                    placeholder="0.000"
                    className="h-12"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Custo Unitário</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.cost_per_unit}
                    onChange={(e) => setFormData(prev => ({ ...prev, cost_per_unit: e.target.value }))}
                    placeholder="0.00"
                    className="h-12"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Data de Validade</Label>
                <Input
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
                  className="h-12"
                />
              </div>
              <Button type="submit" className="w-full h-12" disabled={addBatch.isPending}>
                {addBatch.isPending ? 'Salvando...' : 'Adicionar Lote'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Offline Status */}
      <OfflineStatus
        isOnline={isOnline}
        isFromCache={isFromCache}
        lastUpdated={lastUpdated}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Filter - MD3 Style */}
      <Card className="bg-white shadow-sm rounded-2xl border-0">
        <CardContent className="p-4">
          <Label className="mb-2 block text-sm font-medium">Filtrar por Produto</Label>
          <Select value={filterProduct} onValueChange={setFilterProduct}>
            <SelectTrigger className="h-12 rounded-xl bg-gray-50 border-0">
              <SelectValue placeholder="Todos os produtos" />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              <SelectItem value="all" className="py-3">Todos os produtos</SelectItem>
              {products.map(product => (
                <SelectItem key={product.id} value={product.id} className="py-3">
                  {product.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Stock by product - MD3 Style */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : Object.keys(groupedBatches).length === 0 ? (
        <Card className="bg-white shadow-sm rounded-2xl border-0">
          <CardContent className="py-12 text-center">
            <Package className="mx-auto h-16 w-16 mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground text-lg">Nenhum lote em estoque</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedBatches).map(([productId, productBatches]) => {
            const product = products.find(p => p.id === productId);
            const totalQuantity = productBatches.reduce((sum, b) => sum + Number(b.quantity), 0);
            const hasExpiring = productBatches.some(b => {
              const status = getExpiryStatus(b.expiry_date);
              return status === 'expired' || status === 'critical';
            });
            
            return (
              <Card key={productId} className="bg-white shadow-sm rounded-2xl border-0 overflow-hidden">
                <CardHeader className="pb-2 px-4 pt-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center",
                        hasExpiring ? "bg-red-50" : "bg-green-50"
                      )}>
                        <Package className={cn("h-5 w-5", hasExpiring ? "text-red-600" : "text-green-600")} />
                      </div>
                      <CardTitle className="text-base font-semibold">{product?.name || 'Produto'}</CardTitle>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-xl font-mono text-green-700">{totalQuantity.toFixed(1)}</p>
                      <p className="text-xs text-muted-foreground">{product?.unit}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="space-y-2">
                    {productBatches.map((batch, index) => {
                      const status = getExpiryStatus(batch.expiry_date);
                      return (
                        <div
                          key={batch.id}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-xl transition-colors",
                            status === 'expired' && "bg-red-50",
                            status === 'critical' && "bg-orange-50",
                            status === 'warning' && "bg-amber-50",
                            status === 'ok' && "bg-gray-50",
                            status === 'none' && "bg-gray-50"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-white text-sm font-medium shadow-sm">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-semibold font-mono">
                                {Number(batch.quantity).toFixed(1)} {product?.unit}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatCurrency(Number(batch.cost_per_unit))}/{product?.unit}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            {batch.expiry_date ? (
                              <span className={cn(
                                "inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium",
                                status === 'expired' && "bg-red-100 text-red-700",
                                status === 'critical' && "bg-orange-100 text-orange-700",
                                status === 'warning' && "bg-amber-100 text-amber-700",
                                status === 'ok' && "bg-green-100 text-green-700"
                              )}>
                                {status === 'expired' && <AlertTriangle className="h-3 w-3" />}
                                {(status === 'critical' || status === 'warning') && <Clock className="h-3 w-3" />}
                                {format(new Date(batch.expiry_date), 'dd/MM')}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground px-2 py-1 bg-gray-100 rounded-full">Sem val.</span>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              Entrada: {format(new Date(batch.received_at), 'dd/MM')}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
