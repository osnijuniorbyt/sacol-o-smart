import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Product } from '@/types/database';

export interface PedidoItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_cost: number | null;
  subtotal: number | null;
}

export function useOrderForm() {
  const queryClient = useQueryClient();
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [items, setItems] = useState<PedidoItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const isSupplierSelected = !!selectedSupplier;

  // Adiciona ou incrementa quantidade de um produto
  const handleAddProduct = useCallback((product: Product) => {
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

  // Atualização direta de quantidade (para UI otimista com debounce)
  const handleSetQuantity = useCallback((productId: string, newQuantity: number) => {
    setItems(prev => prev.map(item => 
      item.product_id === productId
        ? { 
            ...item, 
            quantity: newQuantity, 
            subtotal: item.unit_cost ? newQuantity * item.unit_cost : null 
          }
        : item
    ));
  }, []);

  // Pega quantidade atual de um produto no pedido
  const getQuantity = useCallback((productId: string) => {
    const item = items.find(i => i.product_id === productId);
    return item?.quantity || 0;
  }, [items]);

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
    setSelectedSupplier(supplierId);
    setItems(suggestedItems.map(item => ({
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_cost: item.unit_cost,
      subtotal: item.unit_cost ? item.quantity * item.unit_cost : null,
    })));
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
      const total = items.reduce((sum, i) => sum + (i.subtotal || 0), 0);

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

      const itemsToInsert = items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit: 'cx',
        estimated_kg: item.quantity,
        unit_cost_estimated: item.unit_cost,
      }));

      const { error: itemsError } = await supabase
        .from('purchase_order_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      toast.success('Pedido enviado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['purchase_orders'] });
      
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

  const resetForm = useCallback(() => {
    setItems([]);
    setSelectedSupplier('');
  }, []);

  const totalPedido = items.reduce((sum, i) => sum + (i.subtotal || 0), 0);
  const totalItens = items.reduce((sum, i) => sum + i.quantity, 0);
  const hasItemsWithoutPrice = items.some(i => !i.unit_cost);

  return {
    // State
    selectedSupplier,
    setSelectedSupplier,
    items,
    isSupplierSelected,
    isSaving,
    totalPedido,
    totalItens,
    hasItemsWithoutPrice,
    
    // Actions
    handleAddProduct,
    handleDecrement,
    handleUpdatePrice,
    handleRemoveItem,
    handleSetQuantity,
    getQuantity,
    handleApplySuggestion,
    handleEnviarPedido,
    resetForm,
  };
}
