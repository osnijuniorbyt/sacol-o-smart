import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StockBatch } from '@/types/database';
import { toast } from 'sonner';
import { useOfflineCache, useOnlineStatus } from './useOfflineCache';
import { useCallback, useMemo } from 'react';

export function useStock() {
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();

  // Fetch function for stock batches
  const fetchStockBatches = async (): Promise<StockBatch[]> => {
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
  };

  // Use offline cache for stock data
  const {
    data: batches,
    isLoading,
    error,
    isFromCache,
    lastUpdated,
    refresh,
  } = useOfflineCache<StockBatch[]>({
    key: 'stock_batches',
    fetchFn: fetchStockBatches,
    ttlMinutes: 30, // Cache for 30 minutes
  });

  const safeBatches = batches || [];

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
      refresh(); // Refresh offline cache
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
      refresh(); // Refresh offline cache
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar estoque: ' + error.message);
    }
  });

  // Get batches for a product ordered by FIFO (oldest first)
  const getBatchesByProduct = useCallback((productId: string) => {
    return safeBatches
      .filter(b => b.product_id === productId && b.quantity > 0)
      .sort((a, b) => new Date(a.received_at).getTime() - new Date(b.received_at).getTime());
  }, [safeBatches]);

  // Get total stock for a product
  const getProductStock = useCallback((productId: string) => {
    return safeBatches
      .filter(b => b.product_id === productId)
      .reduce((sum, b) => sum + Number(b.quantity), 0);
  }, [safeBatches]);

  // Get batches expiring soon (within X days)
  const getExpiringBatches = useCallback((days: number = 3) => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    return safeBatches.filter(b => {
      if (!b.expiry_date) return false;
      const expiryDate = new Date(b.expiry_date);
      return expiryDate <= futureDate && b.quantity > 0;
    });
  }, [safeBatches]);

  // Get stock summary by product
  const stockSummary = useMemo(() => {
    const summary: Record<string, { 
      product_id: string;
      product_name: string;
      total_quantity: number;
      batches_count: number;
      oldest_batch: string | null;
      expiring_soon: number;
    }> = {};

    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    safeBatches.forEach(batch => {
      const productId = batch.product_id;
      const productName = batch.product?.name || 'Produto';
      
      if (!summary[productId]) {
        summary[productId] = {
          product_id: productId,
          product_name: productName,
          total_quantity: 0,
          batches_count: 0,
          oldest_batch: null,
          expiring_soon: 0,
        };
      }

      summary[productId].total_quantity += Number(batch.quantity);
      summary[productId].batches_count += 1;

      if (batch.expiry_date) {
        if (!summary[productId].oldest_batch || 
            new Date(batch.expiry_date) < new Date(summary[productId].oldest_batch!)) {
          summary[productId].oldest_batch = batch.expiry_date;
        }

        if (new Date(batch.expiry_date) <= threeDaysFromNow) {
          summary[productId].expiring_soon += Number(batch.quantity);
        }
      }
    });

    return Object.values(summary);
  }, [safeBatches]);

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
    batches: safeBatches,
    isLoading,
    error,
    isOnline,
    isFromCache,
    lastUpdated,
    refresh,
    stockSummary,
    addBatch,
    updateBatchQuantity,
    getBatchesByProduct,
    getProductStock,
    getExpiringBatches,
    deductStockFIFO
  };
}
