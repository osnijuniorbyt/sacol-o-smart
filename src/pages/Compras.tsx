import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { OrdersList } from '@/components/compras/OrdersList';
import { SuggestedOrderDialog } from '@/components/compras/SuggestedOrderDialog';
import { 
  Plus, 
  Minus,
  Trash2,
  Send,
  Building2,
  Loader2,
  Lock,
  ShoppingCart,
  Package,
  Truck,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';

interface PedidoItem {
  product_id: string;
  product_name: string;
  quantity: number; // em caixas
  unit_cost: number | null; // preço pode ser nulo
  subtotal: number | null;
}

export default function Compras() {
  const { activeProducts, isLoading: loadingProducts } = useProducts();
  const { activeSuppliers, isLoading: loadingSuppliers } = useSuppliers();
  const { 
    pendingOrders, 
    receivedOrders, 
    isLoading: loadingOrders,
    deleteOrder 
  } = usePurchaseOrders();
  const [activeTab, setActiveTab] = useState('novo');
  
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [items, setItems] = useState<PedidoItem[]>([]);
  const [editingPrice, setEditingPrice] = useState<string | null>(null);

  const isSupplierSelected = !!selectedSupplier;
  const selectedSupplierData = activeSuppliers.find(s => s.id === selectedSupplier);

  // Adiciona ou incrementa quantidade de um produto
  const handleAddProduct = useCallback((product: any) => {
    setItems(prev => {
      const existing = prev.find(i => i.product_id === product.id);
      const lastPrice = (product as any).ultimo_preco_caixa || null;
      
      if (existing) {
        const newQty = existing.quantity + 1;
        return prev.map(i => 
          i.product_id === product.id
            ? { 
                ...i, 
                quantity: newQty, 
                subtotal: i.unit_cost ? newQty * i.unit_cost : null 
              }
            : i
        );
      }
      
      return [...prev, {
        product_id: product.id,
        product_name: product.name,
        quantity: 1,
        unit_cost: lastPrice,
        subtotal: lastPrice,
      }];
    });
  }, []);

  // Decrementa quantidade
  const handleDecrement = useCallback((productId: string) => {
    setItems(prev => {
      const existing = prev.find(i => i.product_id === productId);
      if (!existing) return prev;
      
      if (existing.quantity <= 1) {
        return prev.filter(i => i.product_id !== productId);
      }
      
      const newQty = existing.quantity - 1;
      return prev.map(i => 
        i.product_id === productId
          ? { 
              ...i, 
              quantity: newQty, 
              subtotal: i.unit_cost ? newQty * i.unit_cost : null 
            }
          : i
      );
    });
  }, []);

  // Atualiza preço de um item
  const handleUpdatePrice = useCallback((productId: string, price: string) => {
    const numPrice = parseFloat(price) || null;
    setItems(prev => prev.map(i => 
      i.product_id === productId
        ? { 
            ...i, 
            unit_cost: numPrice, 
            subtotal: numPrice ? i.quantity * numPrice : null 
          }
        : i
    ));
  }, []);

  const handleRemoveItem = useCallback((productId: string) => {
    setItems(prev => prev.filter(i => i.product_id !== productId));
  }, []);

  // Callback para aplicar sugestões do Pedido Sugerido
  const handleApplySuggestion = useCallback((
    suggestedItems: Array<{
      product_id: string;
      product_name: string;
      quantity: number;
      unit_cost: number | null;
    }>,
    supplierId: string
  ) => {
    // Define o fornecedor
    setSelectedSupplier(supplierId);
    
    // Adiciona/substitui os itens sugeridos
    setItems(suggestedItems.map(item => ({
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_cost: item.unit_cost,
      subtotal: item.unit_cost ? item.quantity * item.unit_cost : null,
    })));
    
    // Muda para aba "Novo"
    setActiveTab('novo');
  }, []);

  // Pega quantidade atual de um produto no pedido
  const getQuantity = (productId: string) => {
    const item = items.find(i => i.product_id === productId);
    return item?.quantity || 0;
  };

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
      // Calcula total (pode ser 0 se não tiver preços)
      const total = items.reduce((sum, i) => sum + (i.subtotal || 0), 0);

      // INSERT em purchase_orders COM supplier_id
      const { data: order, error: orderError } = await supabase
        .from('purchase_orders')
        .insert({
          supplier_id: selectedSupplier,
          status: 'enviado',
          total_estimated: total,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // INSERT em purchase_order_items
      const itemsToInsert = items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit: 'cx', // caixa
        estimated_kg: item.quantity, // será convertido depois se necessário
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
      
    } catch (error: any) {
      console.error('Erro ao salvar pedido:', error);
      toast.error('Erro ao enviar pedido: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const totalPedido = items.reduce((sum, i) => sum + (i.subtotal || 0), 0);
  const totalItens = items.reduce((sum, i) => sum + i.quantity, 0);
  const hasItemsWithoutPrice = items.some(i => !i.unit_cost);

  const handleDeleteOrder = async (id: string) => {
    if (confirm('Excluir este pedido?')) {
      deleteOrder.mutate(id);
    }
  };

  const handleRefresh = () => {
    // Query invalidation happens automatically via usePurchaseOrders
  };

  if (loadingSuppliers || loadingProducts || loadingOrders) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24">
      <h1 className="text-2xl font-bold">Compras</h1>

      {/* Botão Pedido Sugerido */}
      <div className="flex justify-end">
        <SuggestedOrderDialog
          suppliers={activeSuppliers}
          products={activeProducts}
          onApplySuggestion={handleApplySuggestion}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="novo" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Novo
          </TabsTrigger>
          <TabsTrigger value="enviados" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Enviados
            {pendingOrders.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {pendingOrders.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="recebidos" className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Recebidos
          </TabsTrigger>
        </TabsList>

        {/* ============ ABA: NOVO PEDIDO ============ */}
        <TabsContent value="novo" className="mt-4 space-y-4">
          {/* PASSO 1: FORNECEDOR OBRIGATÓRIO */}
          <Card className="border-2 border-primary">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5" />
                1. Selecione o Fornecedor
                <Badge variant="destructive">OBRIGATÓRIO</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                <SelectTrigger className="h-14 text-lg">
                  <SelectValue placeholder="Clique para selecionar o fornecedor..." />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {activeSuppliers.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      Nenhum fornecedor cadastrado
                    </div>
                  ) : (
                    activeSuppliers.map(supplier => (
                      <SelectItem key={supplier.id} value={supplier.id} className="py-3">
                        <div>
                          <div className="font-medium">{supplier.name}</div>
                          {supplier.cnpj && (
                            <div className="text-xs text-muted-foreground">CNPJ: {supplier.cnpj}</div>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              
              {selectedSupplierData && (
                <div className="mt-3 p-3 bg-primary/10 rounded-lg">
                  <p className="font-medium text-primary">
                    ✓ {selectedSupplierData.name}
                  </p>
                  {selectedSupplierData.phone && (
                    <p className="text-sm text-muted-foreground">Tel: {selectedSupplierData.phone}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* BLOQUEIO SE NÃO SELECIONOU FORNECEDOR */}
          {!isSupplierSelected ? (
            <Card className="border-dashed">
              <CardContent className="py-12">
                <div className="text-center">
                  <Lock className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-xl font-medium text-muted-foreground">
                    Selecione um fornecedor acima
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    para habilitar a adição de produtos
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* PASSO 2: GRID DE PRODUTOS COM + */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Package className="h-5 w-5" />
                    2. Selecione os Produtos (Caixas)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {activeProducts.map(product => {
                      const qty = getQuantity(product.id);
                      const lastPrice = (product as any).ultimo_preco_caixa;
                      return (
                        <div 
                          key={product.id}
                          className={`relative p-3 rounded-lg border-2 transition-all ${
                            qty > 0 
                              ? 'border-primary bg-primary/5' 
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          {/* Badge de quantidade */}
                          {qty > 0 && (
                            <Badge 
                              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center"
                            >
                              {qty}
                            </Badge>
                          )}
                          
                          <div className="text-sm font-medium truncate mb-2">
                            {product.name}
                          </div>
                          
                          {lastPrice > 0 && (
                            <div className="text-xs text-muted-foreground mb-2">
                              Último: R$ {lastPrice.toFixed(2)}/cx
                            </div>
                          )}
                          
                          <div className="flex items-center gap-1">
                            {qty > 0 && (
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-10 w-10"
                                onClick={() => handleDecrement(product.id)}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant={qty > 0 ? "default" : "outline"}
                              size="icon"
                              className="h-10 flex-1"
                              onClick={() => handleAddProduct(product)}
                            >
                              <Plus className="h-5 w-5" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* PASSO 3: LISTA DE ITENS COM PREÇOS */}
              {items.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <ShoppingCart className="h-5 w-5" />
                      3. Itens do Pedido ({items.length} produtos, {totalItens} caixas)
                    </CardTitle>
                    {hasItemsWithoutPrice && (
                      <p className="text-sm text-muted-foreground">
                        💡 Preço é opcional - pode preencher ao faturar
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produto</TableHead>
                          <TableHead className="text-center w-20">Cx</TableHead>
                          <TableHead className="text-right w-28">R$/Cx</TableHead>
                          <TableHead className="text-right w-24">Subtotal</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map(item => (
                          <TableRow key={item.product_id}>
                            <TableCell className="font-medium">{item.product_name}</TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleDecrement(item.product_id)}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="font-mono w-6 text-center">{item.quantity}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => {
                                    const product = activeProducts.find(p => p.id === item.product_id);
                                    if (product) handleAddProduct(product);
                                  }}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Input
                                type="number"
                                value={item.unit_cost ?? ''}
                                onChange={(e) => handleUpdatePrice(item.product_id, e.target.value)}
                                className="h-8 w-24 text-right font-mono text-sm"
                                placeholder="0,00"
                                min="0"
                                step="0.01"
                              />
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {item.subtotal !== null 
                                ? `R$ ${item.subtotal.toFixed(2)}`
                                : <span className="text-muted-foreground">-</span>
                              }
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => handleRemoveItem(item.product_id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {totalPedido > 0 && (
                          <TableRow className="bg-muted/50">
                            <TableCell colSpan={3} className="text-right font-bold">TOTAL ESTIMADO</TableCell>
                            <TableCell className="text-right font-mono font-bold text-lg">
                              R$ {totalPedido.toFixed(2)}
                            </TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* ============ ABA: ENVIADOS (AGUARDANDO RECEBIMENTO) ============ */}
        <TabsContent value="enviados" className="mt-4">
          <OrdersList
            orders={pendingOrders}
            type="pending"
            onDelete={handleDeleteOrder}
            onRefresh={handleRefresh}
            isDeleting={deleteOrder.isPending}
          />
        </TabsContent>

        {/* ============ ABA: RECEBIDOS ============ */}
        <TabsContent value="recebidos" className="mt-4">
          <OrdersList
            orders={receivedOrders}
            type="received"
            onRefresh={handleRefresh}
          />
        </TabsContent>
      </Tabs>

      {/* BOTÃO ENVIAR - FIXO NO RODAPÉ (apenas na aba Novo) */}
      {activeTab === 'novo' && isSupplierSelected && items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t shadow-lg z-50">
          <div className="max-w-md mx-auto">
            <div className="flex justify-between mb-2 text-sm">
              <span>Fornecedor: <strong>{selectedSupplierData?.name}</strong></span>
              <span>{totalItens} caixas {totalPedido > 0 && `• R$ ${totalPedido.toFixed(2)}`}</span>
            </div>
            <Button 
              onClick={handleEnviarPedido}
              disabled={isSaving}
              className="w-full h-14 text-lg"
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Send className="mr-2 h-5 w-5" />
              )}
              {isSaving ? 'Enviando...' : 'Enviar Pedido'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
