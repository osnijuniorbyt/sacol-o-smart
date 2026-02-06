import { useState, useCallback, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProductPickerDialog } from './ProductPickerDialog';
import { NewOrderItemRow } from './NewOrderItemRow';
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
  Loader2, 
  Send,
  ShoppingCart,
  ListOrdered,
  ClipboardList
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const [activeView, setActiveView] = useState<'itens' | 'resumo'>('itens');
  
  // REF para controlar inicialização única por fornecedor
  const initializedForSupplierRef = useRef<string | null>(null);

  const { products: supplierProducts, productsWithHistory, isLoading: loadingHistory } = useSupplierProducts(selectedSupplier);
  const selectedSupplierData = suppliers.find(s => s.id === selectedSupplier);

  // Carrega histórico APENAS UMA VEZ quando fornecedor é selecionado
  // Usa ref para garantir que NÃO roda novamente mesmo se productsWithHistory mudar
  useEffect(() => {
    // Já inicializou para este fornecedor? Sai imediatamente.
    if (initializedForSupplierRef.current === selectedSupplier) {
      return;
    }
    
    // Ainda carregando? Aguarda.
    if (loadingHistory) {
      return;
    }
    
    // Nenhum fornecedor selecionado? Sai.
    if (!selectedSupplier) {
      return;
    }
    
    // Marca como inicializado ANTES de setar items para evitar loops
    initializedForSupplierRef.current = selectedSupplier;
    
    if (productsWithHistory.length > 0) {
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
    } else {
      setItems([]);
    }
    // IMPORTANTE: NÃO incluir productsWithHistory nas deps para evitar re-runs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSupplier, loadingHistory, allProducts]);

  const handleSupplierChange = (supplierId: string) => {
    // Reseta a ref para permitir nova inicialização
    initializedForSupplierRef.current = null;
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

  const handleQuantityChange = useCallback((productId: string, newQuantity: number) => {
    setItems(prev => prev.map(item =>
      item.product_id === productId ? { ...item, quantity: newQuantity } : item
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
      {/* VIEW: ITENS */}
      {activeView === 'itens' && (
        <>
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
                      <NewOrderItemRow
                        key={item.product_id}
                        item={item}
                        packagings={activePackagings}
                        onQuantityChange={handleQuantityChange}
                        onFieldChange={handleUpdateItem}
                        onRemove={handleRemoveItem}
                      />
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
        </>
      )}

      {/* VIEW: RESUMO */}
      {activeView === 'resumo' && selectedSupplier && (
        <Card>
          <CardContent className="pt-4">
            <Label className="text-sm font-medium mb-4 flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Resumo do Pedido
            </Label>

            {/* Info Fornecedor */}
            <div className="p-3 bg-muted rounded-lg mb-4">
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{selectedSupplierData?.name}</span>
              </div>
              {selectedSupplierData?.phone && (
                <div className="text-xs text-muted-foreground mt-1 ml-6">
                  {selectedSupplierData.phone}
                </div>
              )}
            </div>

            {/* Lista de itens resumida */}
            {items.length === 0 ? (
              <div className="py-6 text-center border-2 border-dashed rounded-lg mb-4">
                <Package className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  Nenhum item adicionado. Vá para "Itens" para adicionar produtos.
                </p>
              </div>
            ) : (
              <div className="space-y-2 mb-4 max-h-[40vh] overflow-y-auto">
                {items.map(item => {
                  const subtotal = item.quantity * (item.unit_price || 0);
                  return (
                    <div key={item.product_id} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.product_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} cx × R$ {(item.unit_price || 0).toFixed(2)}
                        </p>
                      </div>
                      <span className="font-mono text-sm font-medium ml-2">
                        R$ {subtotal.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Totais */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total de itens</span>
                <span>{items.length} produtos</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total de volumes</span>
                <span>{totalVolumes} caixas</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total Estimado</span>
                <span className="text-primary font-mono">R$ {totalPedido.toFixed(2)}</span>
              </div>
            </div>

            {/* Botão Enviar */}
            <Button 
              onClick={handleEnviarPedido}
              disabled={isSaving || items.length === 0}
              className="w-full h-14 text-lg mt-6"
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Send className="mr-2 h-5 w-5" />
              )}
              {isSaving ? 'Enviando...' : 'Enviar Pedido'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* BARRA DE NAVEGAÇÃO FIXA NO RODAPÉ */}
      {selectedSupplier && (
        <div className="fixed bottom-0 left-0 right-0 fixed-bottom-safe pl-safe pr-safe bg-background border-t shadow-lg z-50">
          <div className="max-w-md mx-auto flex gap-2 p-2">
            <Button
              variant={activeView === 'itens' ? 'default' : 'outline'}
              onClick={() => setActiveView('itens')}
              className={cn(
                "flex-1 h-14 text-base gap-2",
                activeView === 'itens' && "shadow-md"
              )}
            >
              <ListOrdered className="h-5 w-5" />
              Itens
              {items.length > 0 && (
                <Badge variant={activeView === 'itens' ? 'secondary' : 'outline'} className="ml-1">
                  {items.length}
                </Badge>
              )}
            </Button>
            <Button
              variant={activeView === 'resumo' ? 'default' : 'outline'}
              onClick={() => setActiveView('resumo')}
              className={cn(
                "flex-1 h-14 text-base gap-2",
                activeView === 'resumo' && "shadow-md"
              )}
            >
              <ClipboardList className="h-5 w-5" />
              Resumo
              {totalPedido > 0 && (
                <span className="font-mono text-xs ml-1">
                  R$ {totalPedido.toFixed(0)}
                </span>
              )}
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
