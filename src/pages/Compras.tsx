import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { supabase } from '@/integrations/supabase/client';
import { 
  Plus, 
  Trash2,
  Send,
  Building2,
  Loader2,
  Lock,
  ShoppingCart,
  Package
} from 'lucide-react';
import { toast } from 'sonner';

interface PedidoItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_cost: number;
  subtotal: number;
}

export default function Compras() {
  const { activeProducts, isLoading: loadingProducts } = useProducts();
  const { activeSuppliers, isLoading: loadingSuppliers } = useSuppliers();
  
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [items, setItems] = useState<PedidoItem[]>([]);

  const isSupplierSelected = !!selectedSupplier;
  const selectedSupplierData = activeSuppliers.find(s => s.id === selectedSupplier);

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
      // INSERT em purchase_orders COM supplier_id
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

      // INSERT em purchase_order_items
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
      
    } catch (error: any) {
      console.error('Erro ao salvar pedido:', error);
      toast.error('Erro ao enviar pedido: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const totalPedido = items.reduce((sum, i) => sum + i.subtotal, 0);

  if (loadingSuppliers || loadingProducts) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24">
      <h1 className="text-2xl font-bold">Nova Compra</h1>

      {/* ============ PASSO 1: FORNECEDOR OBRIGATÓRIO ============ */}
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

      {/* ============ BLOQUEIO SE NÃO SELECIONOU FORNECEDOR ============ */}
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
          {/* ============ PASSO 2: ADICIONAR PRODUTOS ============ */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="h-5 w-5" />
                2. Adicionar Produtos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Produto</Label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger className="h-12 mt-1">
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Quantidade (kg)</Label>
                  <Input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="h-12 text-lg text-center font-mono mt-1"
                    placeholder="0"
                    min="0.1"
                    step="0.5"
                  />
                </div>
                <div>
                  <Label>Preço Negociado (R$/kg)</Label>
                  <Input
                    type="number"
                    value={unitCost}
                    onChange={(e) => setUnitCost(e.target.value)}
                    className="h-12 text-lg text-center font-mono mt-1"
                    placeholder="0,00"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              {quantity && unitCost && parseFloat(quantity) > 0 && parseFloat(unitCost) > 0 && (
                <div className="p-3 bg-muted rounded-lg text-center">
                  <span className="text-muted-foreground">Subtotal: </span>
                  <span className="text-xl font-bold">
                    R$ {(parseFloat(quantity) * parseFloat(unitCost)).toFixed(2)}
                  </span>
                </div>
              )}

              <Button onClick={handleAddItem} className="w-full h-12">
                <Plus className="mr-2 h-5 w-5" />
                Adicionar ao Pedido
              </Button>
            </CardContent>
          </Card>

          {/* ============ PASSO 3: LISTA DE ITENS ============ */}
          {items.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShoppingCart className="h-5 w-5" />
                  3. Itens do Pedido ({items.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-right">Qtd</TableHead>
                      <TableHead className="text-right">R$/kg</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map(item => (
                      <TableRow key={item.product_id}>
                        <TableCell className="font-medium">{item.product_name}</TableCell>
                        <TableCell className="text-right font-mono">{item.quantity}</TableCell>
                        <TableCell className="text-right font-mono">{item.unit_cost.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-mono font-bold">{item.subtotal.toFixed(2)}</TableCell>
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
                    <TableRow className="bg-muted/50">
                      <TableCell colSpan={3} className="text-right font-bold">TOTAL</TableCell>
                      <TableCell className="text-right font-mono font-bold text-lg">
                        R$ {totalPedido.toFixed(2)}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* ============ BOTÃO ENVIAR - FIXO NO RODAPÉ ============ */}
      {isSupplierSelected && items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t shadow-lg">
          <div className="max-w-md mx-auto">
            <div className="flex justify-between mb-2 text-sm">
              <span>Fornecedor: <strong>{selectedSupplierData?.name}</strong></span>
              <span>Total: <strong>R$ {totalPedido.toFixed(2)}</strong></span>
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
