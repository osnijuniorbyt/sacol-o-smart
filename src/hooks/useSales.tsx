import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Sale, CartItem } from '@/types/database';
import { toast } from 'sonner';

export function useSales() {
  const queryClient = useQueryClient();

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

  // Query para buscar itens de vendas de hoje com custo real dos lotes (para cálculo de lucro)
  const { data: todaySaleItemsWithCost = [] } = useQuery({
    queryKey: ['sale_items', 'today', 'with_cost'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from('sale_items')
        .select(`
          id,
          quantity,
          unit_price,
          total,
          batch_id,
          created_at,
          stock_batches!sale_items_batch_id_fkey (
            cost_per_unit
          )
        `)
        .gte('created_at', today.toISOString());
      
      if (error) throw error;
      return data || [];
    }
  });

  // Calcula o custo real das vendas de hoje usando FIFO
  const getTodayRealCost = () => {
    return todaySaleItemsWithCost.reduce((sum, item) => {
      const costPerUnit = item.stock_batches?.cost_per_unit || 0;
      return sum + (Number(item.quantity) * Number(costPerUnit));
    }, 0);
  };

  // Calcula o lucro real de hoje (Receita - Custo Real)
  const getTodayRealProfit = () => {
    const revenue = getTodayTotal();
    const cost = getTodayRealCost();
    return revenue - cost;
  };

  const createSale = useMutation({
    mutationFn: async (items: CartItem[]) => {
      const rpcItems = items.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total,
      }));

      const { data, error } = await supabase
        .rpc('process_sale', { p_items: rpcItems });

      if (error) throw error;
      return { id: data as string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['stock_batches'] });
      queryClient.invalidateQueries({ queryKey: ['sale_items'] });
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
    todaySaleItemsWithCost,
    isLoading,
    error,
    createSale,
    getTodayTotal,
    getTodayCount,
    getTodayRealCost,
    getTodayRealProfit
  };
}
