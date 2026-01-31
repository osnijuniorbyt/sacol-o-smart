import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Sale, SaleItem, CartItem } from '@/types/database';
import { toast } from 'sonner';
import { useStock } from './useStock';

export function useSales() {
  const queryClient = useQueryClient();
  const { deductStockFIFO } = useStock();

  const { data: sales = [], isLoading, error } = useQuery({
    queryKey: ['sales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Sale[];
    }
  });

  const { data: todaySales = [] } = useQuery({
    queryKey: ['sales', 'today'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .gte('created_at', today.toISOString());
      
      if (error) throw error;
      return data as Sale[];
    }
  });

  const createSale = useMutation({
    mutationFn: async (items: CartItem[]) => {
      const total = items.reduce((sum, item) => sum + item.total, 0);
      
      // Create the sale
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
          total,
          items_count: items.length
        })
        .select()
        .single();
      
      if (saleError) throw saleError;

      // Create sale items
      const saleItems = items.map(item => ({
        sale_id: sale.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);
      
      if (itemsError) throw itemsError;

      // Deduct stock for each item
      for (const item of items) {
        await deductStockFIFO(item.product.id, item.quantity);
      }

      return sale;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['stock_batches'] });
      toast.success('Venda finalizada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao finalizar venda: ' + error.message);
    }
  });

  const getTodayTotal = () => {
    return todaySales.reduce((sum, sale) => sum + Number(sale.total), 0);
  };

  const getTodayCount = () => {
    return todaySales.length;
  };

  return {
    sales,
    todaySales,
    isLoading,
    error,
    createSale,
    getTodayTotal,
    getTodayCount
  };
}
