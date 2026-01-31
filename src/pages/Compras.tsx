import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useProducts } from '@/hooks/useProducts';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { 
  Plus, 
  Minus, 
  ShoppingBag, 
  Wifi, 
  WifiOff, 
  Trash2,
  Package,
  Scale,
  Send,
  CloudOff,
  Building2,
  Clock,
  CheckCircle,
  FileText,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PURCHASE_ORDER_STATUS_LABELS } from '@/types/database';

interface CompraItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit: 'cx' | 'kg';
  estimated_kg: number;
  unit_cost_estimated?: number;
}

// Average kg per box (caixa) - can be customized per product
const KG_PER_CAIXA = 22;

export default function Compras() {
  const { activeProducts } = useProducts();
  const { activeSuppliers } = useSuppliers();
  const { isOnline, pendingCount, saveOrder, isSyncing, syncPendingOrders } = useOfflineQueue();
  const { 
    orders, 
    pendingOrders, 
    receivedOrders, 
    isLoading, 
    updateOrderStatus,
    deleteOrder 
  } = usePurchaseOrders();
  
  const [activeTab, setActiveTab] = useState('novo');
  const [items, setItems] = useState<CompraItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState<'cx' | 'kg'>('cx');
  const [unitCost, setUnitCost] = useState('');

  const addItem = useCallback(() => {
    if (!selectedProduct) {
      toast.error('Selecione um produto');
      return;
    }

    const product = activeProducts.find(p => p.id === selectedProduct);
    if (!product) return;

    const qty = parseFloat(quantity) || 1;
    const estimatedKg = unit === 'cx' ? qty * KG_PER_CAIXA : qty;
    const cost = unitCost ? parseFloat(unitCost) : undefined;

    setItems(prev => {
      const existing = prev.find(i => i.product_id === selectedProduct);
      if (existing) {
        return prev.map(i => 
          i.product_id === selectedProduct
            ? { 
                ...i, 
                quantity: i.quantity + qty,
                estimated_kg: i.estimated_kg + estimatedKg,
                unit_cost_estimated: cost || i.unit_cost_estimated
              }
            : i
        );
      }
      return [...prev, {
        product_id: selectedProduct,
        product_name: product.name,
        quantity: qty,
        unit,
        estimated_kg: estimatedKg,
        unit_cost_estimated: cost,
      }];
    });

    setQuantity('1');
    setSelectedProduct('');
    setUnitCost('');
  }, [selectedProduct, quantity, unit, unitCost, activeProducts]);

  const updateItemQuantity = useCallback((productId: string, delta: number) => {
    setItems(prev => prev.map(item => {
      if (item.product_id !== productId) return item;
      
      const newQty = Math.max(0, item.quantity + delta);
      if (newQty === 0) return item;
      
      const estimatedKg = item.unit === 'cx' ? newQty * KG_PER_CAIXA : newQty;
      return { ...item, quantity: newQty, estimated_kg: estimatedKg };
    }).filter(item => item.quantity > 0));
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems(prev => prev.filter(i => i.product_id !== productId));
  }, []);

  const handleSaveOrder = async () => {
    if (items.length === 0) {
      toast.error('Adicione itens ao pedido');
      return;
    }

    const result = await saveOrder(
      items, 
      selectedSupplier || undefined,
      undefined
    );
    
    if (result.success) {
      setItems([]);
      setSelectedSupplier('');
      setActiveTab('enviados');
    }
  };

  const handleMarkReceived = async (orderId: string) => {
    await updateOrderStatus.mutateAsync({ 
      id: orderId, 
      status: 'recebido' 
    });
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (confirm('Tem certeza que deseja excluir este pedido?')) {
      await deleteOrder.mutateAsync(orderId);
    }
  };

  const totalCaixas = items.reduce((sum, i) => sum + (i.unit === 'cx' ? i.quantity : 0), 0);
  const totalKg = items.reduce((sum, i) => sum + i.estimated_kg, 0);
  const totalEstimado = items.reduce((sum, i) => 
    sum + (i.estimated_kg * (i.unit_cost_estimated || 0)), 0
  );

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Header with connection status */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Compras CEASA</h1>
          <p className="text-muted-foreground text-sm">
            {isLoading ? 'Carregando...' : `${orders.length} pedidos no sistema`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <Badge variant="secondary" className="gap-1">
              <CloudOff className="h-3 w-3" />
              {pendingCount} local
            </Badge>
          )}
          <Badge variant={isOnline ? 'default' : 'destructive'} className="gap-1">
            {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="novo" className="gap-1">
            <Plus className="h-4 w-4" />
            Novo
          </TabsTrigger>
          <TabsTrigger value="enviados" className="gap-1">
            <Clock className="h-4 w-4" />
            Enviados ({pendingOrders.length})
          </TabsTrigger>
          <TabsTrigger value="recebidos" className="gap-1">
            <CheckCircle className="h-4 w-4" />
            Recebidos ({receivedOrders.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB: Novo Pedido */}
        <TabsContent value="novo" className="flex-1 flex flex-col mt-0">
          <ScrollArea className="flex-1 -mx-4 px-4">
            {/* Supplier Select */}
            <Card className="mb-4 bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Fornecedor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                  <SelectTrigger className="h-14">
                    <SelectValue placeholder="Selecione o fornecedor (opcional)" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    {activeSuppliers.map(supplier => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Add Item Card */}
            <Card className="mb-4 bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  Adicionar Item
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger className="h-14">
                    <SelectValue placeholder="Selecione o produto" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    {activeProducts.map(product => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  <Button
                    variant={unit === 'cx' ? 'default' : 'outline'}
                    className="flex-1 h-14 text-lg"
                    onClick={() => setUnit('cx')}
                  >
                    <Package className="mr-2 h-5 w-5" />
                    CX
                  </Button>
                  <Button
                    variant={unit === 'kg' ? 'default' : 'outline'}
                    className="flex-1 h-14 text-lg"
                    onClick={() => setUnit('kg')}
                  >
                    <Scale className="mr-2 h-5 w-5" />
                    KG
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Quantidade ({unit === 'cx' ? 'caixas' : 'kg'})</Label>
                  <Input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="h-14 text-xl text-center font-mono"
                    min="0.1"
                    step={unit === 'cx' ? '1' : '0.5'}
                  />
                  {unit === 'cx' && parseFloat(quantity) > 0 && (
                    <p className="text-sm text-muted-foreground text-center">
                      ≈ {(parseFloat(quantity) * KG_PER_CAIXA).toFixed(0)} kg
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Custo por kg (opcional)</Label>
                  <Input
                    type="number"
                    value={unitCost}
                    onChange={(e) => setUnitCost(e.target.value)}
                    className="h-14 text-xl text-center font-mono"
                    placeholder="R$ 0,00"
                    min="0"
                    step="0.01"
                  />
                </div>

                <Button onClick={addItem} className="w-full h-14 text-lg">
                  <Plus className="mr-2 h-5 w-5" />
                  Adicionar ao Pedido
                </Button>
              </CardContent>
            </Card>

            {/* Items List */}
            {items.length > 0 && (
              <Card className="mb-4 bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">
                    Itens do Pedido ({items.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {items.map(item => (
                    <div 
                      key={item.product_id} 
                      className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} {item.unit} ≈ {item.estimated_kg.toFixed(0)} kg
                          {item.unit_cost_estimated && (
                            <span className="ml-2">
                              (R$ {item.unit_cost_estimated.toFixed(2)}/kg)
                            </span>
                          )}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-12 w-12"
                          onClick={() => updateItemQuantity(item.product_id, item.unit === 'cx' ? -1 : -0.5)}
                        >
                          <Minus className="h-5 w-5" />
                        </Button>
                        <span className="w-12 text-center font-bold text-lg">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-12 w-12"
                          onClick={() => updateItemQuantity(item.product_id, item.unit === 'cx' ? 1 : 0.5)}
                        >
                          <Plus className="h-5 w-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-12 w-12 text-destructive"
                          onClick={() => removeItem(item.product_id)}
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </ScrollArea>

          {/* Fixed Bottom Panel */}
          <div className="border-t bg-background pt-4 -mx-4 px-4 pb-safe">
            {items.length > 0 && (
              <div className="flex justify-between mb-4 text-lg">
                <div>
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-bold ml-2">{totalCaixas} CX</span>
                </div>
                <div>
                  <span className="text-muted-foreground">≈</span>
                  <span className="font-bold ml-1">{totalKg.toFixed(0)} kg</span>
                </div>
                {totalEstimado > 0 && (
                  <div>
                    <span className="text-muted-foreground">Est.:</span>
                    <span className="font-bold ml-1">R$ {totalEstimado.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}

            <Button 
              onClick={handleSaveOrder}
              disabled={items.length === 0 || isSyncing}
              className="w-full h-16 text-xl font-semibold"
            >
              <Send className="mr-3 h-6 w-6" />
              {isSyncing ? 'Sincronizando...' : isOnline ? 'Enviar Pedido' : 'Salvar Offline'}
            </Button>

            {isOnline && pendingCount > 0 && (
              <Button
                variant="outline"
                onClick={syncPendingOrders}
                disabled={isSyncing}
                className="w-full h-14 mt-3"
              >
                <RefreshCw className={`mr-2 h-5 w-5 ${isSyncing ? 'animate-spin' : ''}`} />
                Sincronizar {pendingCount} Pendente(s)
              </Button>
            )}
          </div>
        </TabsContent>

        {/* TAB: Pedidos Enviados */}
        <TabsContent value="enviados" className="flex-1 mt-0">
          <ScrollArea className="h-[calc(100vh-280px)]">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : pendingOrders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum pedido enviado</p>
              </div>
            ) : (
              <div className="space-y-4 pb-4">
                {pendingOrders.map(order => (
                  <Card key={order.id} className="bg-card">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base">
                            {order.supplier?.name || 'Sem fornecedor'}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(order.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                        <Badge variant="secondary">
                          {PURCHASE_ORDER_STATUS_LABELS[order.status]}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 mb-4">
                        {order.items?.map(item => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span>{item.product?.name || 'Produto'}</span>
                            <span className="text-muted-foreground">
                              {item.quantity} {item.unit} ({item.estimated_kg.toFixed(0)} kg)
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="font-semibold">
                          Total: R$ {order.total_estimated.toFixed(2)}
                        </span>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteOrder(order.id)}
                            disabled={deleteOrder.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleMarkReceived(order.id)}
                            disabled={updateOrderStatus.isPending}
                          >
                            <CheckCircle className="mr-1 h-4 w-4" />
                            Receber
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        {/* TAB: Pedidos Recebidos */}
        <TabsContent value="recebidos" className="flex-1 mt-0">
          <ScrollArea className="h-[calc(100vh-280px)]">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : receivedOrders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum pedido recebido</p>
              </div>
            ) : (
              <div className="space-y-4 pb-4">
                {receivedOrders.map(order => (
                  <Card key={order.id} className="bg-card">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base">
                            {order.supplier?.name || 'Sem fornecedor'}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            Recebido em {order.received_at 
                              ? format(new Date(order.received_at), "dd/MM 'às' HH:mm", { locale: ptBR })
                              : 'data não registrada'}
                          </p>
                        </div>
                        <Badge variant="default">
                          {PURCHASE_ORDER_STATUS_LABELS[order.status]}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 mb-4">
                        {order.items?.map(item => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span>{item.product?.name || 'Produto'}</span>
                            <span className="text-muted-foreground">
                              {item.quantity_received ?? item.quantity} {item.unit}
                              {item.unit_cost_actual && (
                                <span className="ml-1">(R$ {item.unit_cost_actual.toFixed(2)}/kg)</span>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t">
                        <div>
                          <span className="text-muted-foreground text-sm">Estimado: </span>
                          <span>R$ {order.total_estimated.toFixed(2)}</span>
                        </div>
                        {order.total_received && (
                          <div>
                            <span className="text-muted-foreground text-sm">Real: </span>
                            <span className="font-semibold">R$ {order.total_received.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
