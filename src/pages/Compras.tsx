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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useProducts } from '@/hooks/useProducts';
import { useSuppliers } from '@/hooks/useSuppliers';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { supabase } from '@/integrations/supabase/client';
import { 
  Plus, 
  ShoppingBag, 
  Wifi, 
  WifiOff, 
  Trash2,
  Send,
  Building2,
  Clock,
  CheckCircle,
  Loader2,
  Lock,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PURCHASE_ORDER_STATUS_LABELS } from '@/types/database';

interface PedidoItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_cost: number;
  subtotal: number;
}

export default function Compras() {
  const { activeProducts } = useProducts();
  const { activeSuppliers } = useSuppliers();
  const { 
    orders, 
    pendingOrders, 
    receivedOrders, 
    isLoading, 
    updateOrderStatus,
    deleteOrder 
  } = usePurchaseOrders();
  
  const [isOnline] = useState(navigator.onLine);
  const [activeTab, setActiveTab] = useState('novo');
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [items, setItems] = useState<PedidoItem[]>([]);

  const isSupplierSelected = !!selectedSupplier;

  const handleAddItem = useCallback(() => {
    if (!selectedProduct) {
      toast.error('Selecione um produto');
      return;
    }
    if (!quantity || parseFloat(quantity) <= 0) {
      toast.error('Informe a quantidade');
      return;
    }
    if (!unitCost || parseFloat(unitCost) <= 0) {
      toast.error('Informe o preço negociado');
      return;
    }

    const product = activeProducts.find(p => p.id === selectedProduct);
    if (!product) return;

    const qty = parseFloat(quantity);
    const cost = parseFloat(unitCost);
    const subtotal = qty * cost;

    setItems(prev => {
      // Se já existe o produto, atualiza
      const existing = prev.find(i => i.product_id === selectedProduct);
      if (existing) {
        return prev.map(i => 
          i.product_id === selectedProduct
            ? { ...i, quantity: qty, unit_cost: cost, subtotal }
            : i
        );
      }
      return [...prev, {
        product_id: selectedProduct,
        product_name: product.name,
        quantity: qty,
        unit_cost: cost,
        subtotal,
      }];
    });

    // Limpar campos
    setSelectedProduct('');
    setQuantity('');
    setUnitCost('');
    toast.success(`${product.name} adicionado`);
  }, [selectedProduct, quantity, unitCost, activeProducts]);

  const handleRemoveItem = useCallback((productId: string) => {
    setItems(prev => prev.filter(i => i.product_id !== productId));
  }, []);

  const handleEnviarPedido = async () => {
    if (!selectedSupplier) {
      toast.error('Selecione um fornecedor');
      return;
    }
    if (items.length === 0) {
      toast.error('Adicione itens ao pedido');
      return;
    }

    setIsSaving(true);
    try {
      // 1. INSERT em purchase_orders
      const { data: order, error: orderError } = await supabase
        .from('purchase_orders')
        .insert({
          supplier_id: selectedSupplier,
          status: 'enviado',
          total_estimated: totalPedido,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. INSERT em purchase_order_items
      const itemsToInsert = items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit: 'kg',
        estimated_kg: item.quantity,
        unit_cost_estimated: item.unit_cost,
      }));

      const { error: itemsError } = await supabase
        .from('purchase_order_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      toast.success('Pedido enviado com sucesso!');
      
      // Limpar form
      setItems([]);
      setSelectedSupplier('');
      setActiveTab('enviados');
      
    } catch (error: any) {
      console.error('Erro ao salvar pedido:', error);
      toast.error('Erro ao enviar pedido: ' + error.message);
    } finally {
      setIsSaving(false);
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

  const totalPedido = items.reduce((sum, i) => sum + i.subtotal, 0);

  const selectedSupplierName = activeSuppliers.find(s => s.id === selectedSupplier)?.name;

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Compras CEASA</h1>
          <p className="text-muted-foreground text-sm">
            {isLoading ? 'Carregando...' : `${orders.length} pedidos no sistema`}
          </p>
        </div>
        <Badge variant={isOnline ? 'default' : 'destructive'} className="gap-1">
          {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          {isOnline ? 'Online' : 'Offline'}
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="novo" className="gap-1">
            <Plus className="h-4 w-4" />
            Novo Pedido
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
            {/* FORNECEDOR - OBRIGATÓRIO */}
            <Card className="mb-4 border-2 border-primary">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Fornecedor
                  <Badge variant="destructive" className="ml-2">OBRIGATÓRIO</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                  <SelectTrigger className="h-14 text-lg">
                    <SelectValue placeholder="Selecione o fornecedor..." />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    {activeSuppliers.map(supplier => (
                      <SelectItem key={supplier.id} value={supplier.id} className="text-base py-3">
                        <div className="flex flex-col">
                          <span className="font-medium">{supplier.name}</span>
                          {supplier.cnpj && (
                            <span className="text-xs text-muted-foreground">CNPJ: {supplier.cnpj}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedSupplierName && (
                  <p className="text-sm text-muted-foreground mt-2">
                    ✓ Fornecedor selecionado: <strong>{selectedSupplierName}</strong>
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Bloqueio visual quando fornecedor não selecionado */}
            {!isSupplierSelected && (
              <div className="relative">
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
                  <div className="text-center p-6">
                    <Lock className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-lg font-medium">Selecione um fornecedor</p>
                    <p className="text-sm text-muted-foreground">para continuar adicionando itens</p>
                  </div>
                </div>
                <div className="opacity-30 pointer-events-none">
                  <Card className="mb-4">
                    <CardContent className="pt-6">
                      <div className="h-40 flex items-center justify-center text-muted-foreground">
                        Área de adicionar itens bloqueada
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* ADICIONAR ITEM - Só aparece com fornecedor selecionado */}
            {isSupplierSelected && (
              <>
                <Card className="mb-4 bg-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ShoppingBag className="h-5 w-5" />
                      Adicionar Item
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Produto */}
                    <div className="space-y-2">
                      <Label>Produto</Label>
                      <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                        <SelectTrigger className="h-12">
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
                    </div>

                    {/* Quantidade e Preço lado a lado */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Quantidade (kg)</Label>
                        <Input
                          type="number"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          className="h-12 text-lg text-center font-mono"
                          placeholder="0"
                          min="0.1"
                          step="0.5"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Preço Negociado (R$/kg)</Label>
                        <Input
                          type="number"
                          value={unitCost}
                          onChange={(e) => setUnitCost(e.target.value)}
                          className="h-12 text-lg text-center font-mono"
                          placeholder="0,00"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>

                    {/* Preview do subtotal */}
                    {quantity && unitCost && (
                      <div className="p-3 bg-muted rounded-lg text-center">
                        <span className="text-sm text-muted-foreground">Subtotal: </span>
                        <span className="text-lg font-bold">
                          R$ {(parseFloat(quantity || '0') * parseFloat(unitCost || '0')).toFixed(2)}
                        </span>
                      </div>
                    )}

                    <Button onClick={handleAddItem} className="w-full h-12 text-lg">
                      <Plus className="mr-2 h-5 w-5" />
                      Adicionar
                    </Button>
                  </CardContent>
                </Card>

                {/* TABELA DE ITENS */}
                {items.length > 0 && (
                  <Card className="mb-4 bg-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">
                        Itens do Pedido ({items.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Produto</TableHead>
                            <TableHead className="text-right w-24">Qtd (kg)</TableHead>
                            <TableHead className="text-right w-28">Preço/kg</TableHead>
                            <TableHead className="text-right w-28">Subtotal</TableHead>
                            <TableHead className="w-12"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map(item => (
                            <TableRow key={item.product_id}>
                              <TableCell className="font-medium">{item.product_name}</TableCell>
                              <TableCell className="text-right font-mono">{item.quantity.toFixed(1)}</TableCell>
                              <TableCell className="text-right font-mono">R$ {item.unit_cost.toFixed(2)}</TableCell>
                              <TableCell className="text-right font-mono font-bold">R$ {item.subtotal.toFixed(2)}</TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => handleRemoveItem(item.product_id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </ScrollArea>

          {/* RODAPÉ FIXO */}
          {isSupplierSelected && (
            <div className="border-t bg-background pt-4 -mx-4 px-4 pb-safe">
              {/* Resumo */}
              <div className="flex justify-between items-center mb-4 text-lg">
                <div>
                  <span className="text-muted-foreground">Fornecedor:</span>
                  <span className="font-medium ml-2">{selectedSupplierName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-bold ml-2 text-xl">R$ {totalPedido.toFixed(2)}</span>
                </div>
              </div>

              {/* Botão Enviar */}
              <Button 
                onClick={handleEnviarPedido}
                disabled={items.length === 0 || isSaving}
                className="w-full h-16 text-xl font-semibold"
              >
                {isSaving ? (
                  <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                ) : (
                  <Send className="mr-3 h-6 w-6" />
                )}
                {isSaving ? 'Enviando...' : 'Enviar Pedido'}
              </Button>

              {items.length === 0 && (
                <p className="text-sm text-center text-muted-foreground mt-2 flex items-center justify-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  Adicione pelo menos um item para enviar
                </p>
              )}
            </div>
          )}
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
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Produto</TableHead>
                            <TableHead className="text-right">Qtd</TableHead>
                            <TableHead className="text-right">R$/kg</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {order.items?.map(item => (
                            <TableRow key={item.id}>
                              <TableCell>{item.product?.name || 'Produto'}</TableCell>
                              <TableCell className="text-right">{item.quantity} kg</TableCell>
                              <TableCell className="text-right">
                                {item.unit_cost_estimated ? `R$ ${item.unit_cost_estimated.toFixed(2)}` : '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <div className="flex justify-between items-center pt-4 border-t mt-4">
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
                        <Badge>
                          {PURCHASE_ORDER_STATUS_LABELS[order.status]}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Produto</TableHead>
                            <TableHead className="text-right">Qtd</TableHead>
                            <TableHead className="text-right">R$/kg</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {order.items?.map(item => (
                            <TableRow key={item.id}>
                              <TableCell>{item.product?.name || 'Produto'}</TableCell>
                              <TableCell className="text-right">
                                {item.quantity_received ?? item.quantity} kg
                              </TableCell>
                              <TableCell className="text-right">
                                {item.unit_cost_actual 
                                  ? `R$ ${item.unit_cost_actual.toFixed(2)}` 
                                  : item.unit_cost_estimated 
                                    ? `R$ ${item.unit_cost_estimated.toFixed(2)}` 
                                    : '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <div className="flex justify-between items-center pt-4 border-t mt-4">
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
