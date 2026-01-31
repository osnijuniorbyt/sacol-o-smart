import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Breakage, BreakageReason } from '@/types/database';
import { toast } from 'sonner';
import { useStock } from './useStock';

export function useBreakages() {
  const queryClient = useQueryClient();
  const { updateBatchQuantity, getBatchesByProduct } = useStock();

  const { data: breakages = [], isLoading, error } = useQuery({
    queryKey: ['breakages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('breakages')
        .select(`
          *,
          product:products(*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Breakage[];
    }
  });

  const createBreakage = useMutation({
    mutationFn: async (breakage: {
      product_id: string;
      batch_id?: string;
      quantity: number;
      reason: BreakageReason;
      notes?: string;
    }) => {
      let cost_per_unit = 0;
      let batchId = breakage.batch_id;

      // If batch specified, get cost from it
      if (batchId) {
        const { data: batch } = await supabase
          .from('stock_batches')
          .select('cost_per_unit, quantity')
          .eq('id', batchId)
          .single();
        
        if (batch) {
          cost_per_unit = Number(batch.cost_per_unit);
          
          // Deduct from batch
          const newQuantity = Math.max(0, Number(batch.quantity) - breakage.quantity);
          await updateBatchQuantity.mutateAsync({ id: batchId, quantity: newQuantity });
        }
      } else {
        // Get oldest batch (FIFO) for cost
        const batches = getBatchesByProduct(breakage.product_id);
        if (batches.length > 0) {
          const oldestBatch = batches[0];
          cost_per_unit = Number(oldestBatch.cost_per_unit);
          batchId = oldestBatch.id;
          
          // Deduct from batch
          const newQuantity = Math.max(0, Number(oldestBatch.quantity) - breakage.quantity);
          await updateBatchQuantity.mutateAsync({ id: batchId, quantity: newQuantity });
        }
      }

      const total_loss = cost_per_unit * breakage.quantity;

      const { data, error } = await supabase
        .from('breakages')
        .insert({
          product_id: breakage.product_id,
          batch_id: batchId,
          quantity: breakage.quantity,
          cost_per_unit,
          total_loss,
          reason: breakage.reason,
          notes: breakage.notes
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['breakages'] });
      queryClient.invalidateQueries({ queryKey: ['stock_batches'] });
      toast.success('Quebra registrada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao registrar quebra: ' + error.message);
    }
  });

  const getTotalLoss = () => {
    return breakages.reduce((sum, b) => sum + Number(b.total_loss), 0);
  };

  const getRecentBreakages = (days: number = 7) => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - days);
    
    return breakages.filter(b => new Date(b.created_at) >= pastDate);
  };

  return {
    breakages,
    isLoading,
    error,
    createBreakage,
    getTotalLoss,
    getRecentBreakages
  };
}
