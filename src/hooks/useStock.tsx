import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StockBatch } from '@/types/database';
import { toast } from 'sonner';

export function useStock() {
  const queryClient = useQueryClient();

  const { data: batches = [], isLoading, error } = useQuery({
    queryKey: ['stock_batches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_batches')
        .select(`
          *,
          product:products(*)
        `)
        .gt('quantity', 0)
        .order('expiry_date', { ascending: true, nullsFirst: false });
      
      if (error) throw error;
      return data as StockBatch[];
    }
  });

  const addBatch = useMutation({
    mutationFn: async (batch: {
      product_id: string;
      quantity: number;
      cost_per_unit: number;
      expiry_date?: string;
    }) => {
      const { data, error } = await supabase
        .from('stock_batches')
        .insert(batch)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock_batches'] });
      toast.success('Lote adicionado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao adicionar lote: ' + error.message);
    }
  });

  const updateBatchQuantity = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      const { data, error } = await supabase
        .from('stock_batches')
        .update({ quantity })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock_batches'] });
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar estoque: ' + error.message);
    }
  });

  // Get batches for a product ordered by FIFO (oldest first)
  const getBatchesByProduct = (productId: string) => {
    return batches
      .filter(b => b.product_id === productId && b.quantity > 0)
      .sort((a, b) => new Date(a.received_at).getTime() - new Date(b.received_at).getTime());
  };

  // Get total stock for a product
  const getProductStock = (productId: string) => {
    return batches
      .filter(b => b.product_id === productId)
      .reduce((sum, b) => sum + Number(b.quantity), 0);
  };

  // Get batches expiring soon (within 3 days)
  const getExpiringBatches = (days: number = 3) => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    return batches.filter(b => {
      if (!b.expiry_date) return false;
      const expiryDate = new Date(b.expiry_date);
      return expiryDate <= futureDate && b.quantity > 0;
    });
  };

  // Deduct stock using FIFO
  const deductStockFIFO = async (productId: string, quantity: number) => {
    const productBatches = getBatchesByProduct(productId);
    let remaining = quantity;
    const updates: { id: string; quantity: number }[] = [];

    for (const batch of productBatches) {
      if (remaining <= 0) break;
      
      const batchQty = Number(batch.quantity);
      const deductQty = Math.min(batchQty, remaining);
      
      updates.push({
        id: batch.id,
        quantity: batchQty - deductQty
      });
      
      remaining -= deductQty;
    }

    // Execute all updates
    for (const update of updates) {
      await updateBatchQuantity.mutateAsync(update);
    }

    return remaining <= 0;
  };

  return {
    batches,
    isLoading,
    error,
    addBatch,
    updateBatchQuantity,
    getBatchesByProduct,
    getProductStock,
    getExpiringBatches,
    deductStockFIFO
  };
}
