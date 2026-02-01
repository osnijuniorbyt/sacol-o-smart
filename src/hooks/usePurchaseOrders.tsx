import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus } from '@/types/database';
import { toast } from 'sonner';

export function usePurchaseOrders() {
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading, error } = useQuery({
    queryKey: ['purchase_orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          supplier:suppliers(*),
          items:purchase_order_items(
            *,
            product:products(*)
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as PurchaseOrder[];
    }
  });

  const updateOrderStatus = useMutation({
    mutationFn: async ({ 
      id, 
      status,
      total_received,
      received_at
    }: { 
      id: string; 
      status: PurchaseOrderStatus;
      total_received?: number;
      received_at?: string;
    }) => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .update({ 
          status,
          total_received,
          received_at: received_at || (status === 'recebido' ? new Date().toISOString() : null)
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase_orders'] });
      queryClient.invalidateQueries({ queryKey: ['stock_batches'] });
      toast.success('Status atualizado!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar: ' + error.message);
    }
  });

  const updateOrderItem = useMutation({
    mutationFn: async ({ 
      id, 
      quantity_received,
      unit_cost_actual
    }: { 
      id: string; 
      quantity_received?: number;
      unit_cost_actual?: number;
    }) => {
      const { data, error } = await supabase
        .from('purchase_order_items')
        .update({ quantity_received, unit_cost_actual })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase_orders'] });
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar item: ' + error.message);
    }
  });

  const deleteOrder = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('purchase_orders')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase_orders'] });
      toast.success('Pedido excluído!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao excluir: ' + error.message);
    }
  });

  // Filter orders by status
  const pendingOrders = orders.filter(o => o.status === 'enviado');
  const receivedOrders = orders.filter(o => o.status === 'recebido');
  const draftOrders = orders.filter(o => o.status === 'rascunho');

  return {
    orders,
    pendingOrders,
    receivedOrders,
    draftOrders,
    isLoading,
    error,
    updateOrderStatus,
    updateOrderItem,
    deleteOrder
  };
}
