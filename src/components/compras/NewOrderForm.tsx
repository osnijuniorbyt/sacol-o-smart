import { useState, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { ProductImage } from '@/components/ui/product-image';
import { ProductPickerDialog } from './ProductPickerDialog';
import { useSupplierProducts, SupplierProduct } from '@/hooks/useSupplierProducts';
import { usePackagings } from '@/hooks/usePackagings';
import { Supplier } from '@/hooks/useSuppliers';
import { Product } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Building2, 
  Package, 
  Plus, 
  X, 
  Loader2, 
  Send,
  ShoppingCart
} from 'lucide-react';

export interface OrderItem {
  product_id: string;
  product_name: string;
  product_image?: string | null;
  category: string;
  quantity: number;
  packaging_id: string | null;
  unit_price: number | null;
}

interface NewOrderFormProps {
  suppliers: Supplier[];
  allProducts: Product[];
  onOrderSent: () => void;
}

export function NewOrderForm({ suppliers, allProducts, onOrderSent }: NewOrderFormProps) {
  const queryClient = useQueryClient();
  const { activePackagings } = usePackagings();
  
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [items, setItems] = useState<OrderItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showProductPicker, setShowProductPicker] = useState(false);

  const { products: supplierProducts, productsWithHistory, isLoading: loadingHistory } = useSupplierProducts(selectedSupplier);
  const selectedSupplierData = suppliers.find(s => s.id === selectedSupplier);

  // Quando muda o fornecedor, carrega os produtos do histórico
  useEffect(() => {
    if (selectedSupplier && productsWithHistory.length > 0) {
      const initialItems: OrderItem[] = productsWithHistory.map(sp => ({
        product_id: sp.product_id,
        product_name: sp.product_name,
        product_image: allProducts.find(p => p.id === sp.product_id)?.image_url,
        category: sp.category,
        quantity: 1,
        packaging_id: sp.ultimo_vasilhame_id,
        unit_price: sp.ultimo_preco > 0 ? sp.ultimo_preco : null,
      }));
      setItems(initialItems);
    } else if (selectedSupplier) {
      setItems([]);
    }
  }, [selectedSupplier, productsWithHistory, allProducts]);

  const handleSupplierChange = (supplierId: string) => {
    setSelectedSupplier(supplierId);
    setItems([]);
  };

  const handleAddProductFromCatalog = useCallback((product: Product) => {
    const existingIndex = items.findIndex(i => i.product_id === product.id);
    if (existingIndex >= 0) {
      toast.info('Produto já está no pedido');
      return;
    }

    // Busca dados do histórico se existir
    const historyData = supplierProducts.find(sp => sp.product_id === product.id);

    setItems(prev => [...prev, {
      product_id: product.id,
      product_name: product.name,
      product_image: product.image_url,
      category: product.category,
      quantity: 1,
      packaging_id: historyData?.ultimo_vasilhame_id || null,
      unit_price: historyData?.ultimo_preco || (product as any).ultimo_preco_caixa || null,
    }]);
  }, [items, supplierProducts]);

  const handleUpdateItem = useCallback((productId: string, field: keyof OrderItem, value: any) => {
    setItems(prev => prev.map(item =>
      item.product_id === productId ? { ...item, [field]: value } : item
    ));
  }, []);

  const handleRemoveItem = useCallback((productId: string) => {
    setItems(prev => prev.filter(item => item.product_id !== productId));
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

    const itemsWithQty = items.filter(i => i.quantity > 0);
    if (itemsWithQty.length === 0) {
      toast.error('Informe a quantidade de pelo menos um item');
      return;
    }

    setIsSaving(true);
    try {
      const total = itemsWithQty.reduce((sum, i) => 
        sum + (i.quantity * (i.unit_price || 0)), 0
      );

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

      // Calcula a tara total para cada item
      const itemsToInsert = itemsWithQty.map(item => {
        const packaging = activePackagings.find(p => p.id === item.packaging_id);
        const tareTotal = packaging ? item.quantity * packaging.tare_weight : 0;
        
        return {
          order_id: order.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit: 'cx',
          estimated_kg: item.quantity,
          unit_cost_estimated: item.unit_price,
          packaging_id: item.packaging_id,
          tare_total: tareTotal,
        };
      });

      const { error: itemsError } = await supabase
        .from('purchase_order_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      // Atualiza vasilhames nas associações
      for (const item of itemsWithQty) {
        if (item.packaging_id) {
          await supabase.rpc('update_supplier_product_packaging', {
            p_supplier_id: selectedSupplier,
            p_product_id: item.product_id,
            p_packaging_id: item.packaging_id,
          });
        }
      }

      toast.success('Pedido enviado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['purchase_orders'] });
      queryClient.invalidateQueries({ queryKey: ['supplier_products'] });
      
      setItems([]);
      setSelectedSupplier('');
      onOrderSent();
      
    } catch (error: any) {
      console.error('Erro ao salvar pedido:', error);
      toast.error('Erro ao enviar pedido: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const totalPedido = items.reduce((sum, i) => sum + (i.quantity * (i.unit_price || 0)), 0);
  const totalVolumes = items.reduce((sum, i) => sum + i.quantity, 0);
  const excludeProductIds = items.map(i => i.product_id);

  return (
    <div className="space-y-4">
      {/* 1. SELEÇÃO DE FORNECEDOR */}
      <Card className="border-2 border-primary">
        <CardContent className="pt-4">
          <Label className="text-sm font-medium mb-2 flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Fornecedor
            <Badge variant="destructive" className="ml-1">Obrigatório</Badge>
          </Label>
          <Select value={selectedSupplier} onValueChange={handleSupplierChange}>
            <SelectTrigger className="h-14 text-lg">
              <SelectValue placeholder="Selecione o fornecedor..." />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              {suppliers.map(supplier => (
                <SelectItem key={supplier.id} value={supplier.id} className="py-3">
                  <div className="font-medium">{supplier.name}</div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {selectedSupplierData && (
            <div className="mt-2 p-2 bg-primary/10 rounded-lg text-sm">
              ✓ {selectedSupplierData.name}
              {selectedSupplierData.phone && ` • ${selectedSupplierData.phone}`}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. ITENS DO PEDIDO */}
      {selectedSupplier && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Itens do Pedido
              </Label>
              {items.length > 0 && (
                <Badge variant="secondary">
                  {items.length} produtos • {totalVolumes} vol.
                </Badge>
              )}
            </div>

            {loadingHistory ? (
              <div className="py-8 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Carregando histórico...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="py-8 text-center border-2 border-dashed rounded-lg">
                <Package className="h-10 w-10 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-muted-foreground mb-3">
                  Nenhum produto no histórico. Adicione do catálogo.
                </p>
                <Button
                  variant="outline"
                  onClick={() => setShowProductPicker(true)}
                  className="border-primary text-primary hover:bg-primary/10"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Produto
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map(item => (
                  <div 
                    key={item.product_id}
                    className="p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-start gap-3">
                      <ProductImage
                        src={item.product_image}
                        alt={item.product_name}
                        category={item.category as any}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="font-medium truncate pr-2">{item.product_name}</div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 -mt-1 -mr-1 text-muted-foreground hover:text-destructive"
                            onClick={() => handleRemoveItem(item.product_id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          {/* Quantidade */}
                          <div>
                            <Label className="text-xs text-muted-foreground">Qtd Vol.</Label>
                            <Input
                              type="number"
                              inputMode="numeric"
                              min={1}
                              value={item.quantity}
                              onChange={(e) => handleUpdateItem(
                                item.product_id, 
                                'quantity', 
                                parseInt(e.target.value) || 1
                              )}
                              className="h-10 text-center font-mono"
                            />
                          </div>
                          
                          {/* Vasilhame */}
                          <div>
                            <Label className="text-xs text-muted-foreground">Vasilhame</Label>
                            <Select
                              value={item.packaging_id || ''}
                              onValueChange={(v) => handleUpdateItem(item.product_id, 'packaging_id', v || null)}
                            >
                              <SelectTrigger className="h-10 text-xs">
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent className="bg-popover z-50">
                                {activePackagings.map(pkg => (
                                  <SelectItem key={pkg.id} value={pkg.id} className="text-sm">
                                    {pkg.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {/* Preço */}
                          <div>
                            <Label className="text-xs text-muted-foreground">R$/Vol.</Label>
                            <Input
                              type="number"
                              inputMode="decimal"
                              step="0.01"
                              value={item.unit_price ?? ''}
                              onChange={(e) => handleUpdateItem(
                                item.product_id, 
                                'unit_price', 
                                parseFloat(e.target.value) || null
                              )}
                              className="h-10 text-right font-mono"
                              placeholder="0,00"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Botão adicionar mais */}
                <Button
                  variant="outline"
                  onClick={() => setShowProductPicker(true)}
                  className="w-full h-12 border-dashed border-2 border-primary text-primary hover:bg-primary/10"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Adicionar Outro Produto
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 3. BOTÃO ENVIAR */}
      {selectedSupplier && items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 fixed-bottom-safe pl-safe pr-safe bg-background border-t shadow-lg z-50">
          <div className="max-w-md mx-auto">
            <div className="flex justify-between mb-2 text-sm">
              <span>
                {selectedSupplierData?.name} • {totalVolumes} volumes
              </span>
              {totalPedido > 0 && (
                <span className="font-mono font-medium">R$ {totalPedido.toFixed(2)}</span>
              )}
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

      {/* Dialog para adicionar produtos */}
      <ProductPickerDialog
        open={showProductPicker}
        onOpenChange={setShowProductPicker}
        products={allProducts}
        excludeProductIds={excludeProductIds}
        onSelectProduct={handleAddProductFromCatalog}
      />
    </div>
  );
}
