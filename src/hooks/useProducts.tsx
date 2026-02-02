import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Product, ProductCategory, UnitType } from '@/types/database';
import { toast } from 'sonner';
import { useOfflineCache, useOnlineStatus } from './useOfflineCache';
import { useSyncTask } from './useBackgroundSync';
import { useCallback, useMemo, useRef } from 'react';

export function useProducts() {
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();
  const refreshRef = useRef<() => void>(() => {});

  // Fetch function for products
  const fetchProducts = async (): Promise<Product[]> => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data as Product[];
  };

  // Use offline cache for products
  const {
    data: products,
    isLoading,
    error,
    isFromCache,
    lastUpdated,
    refresh,
  } = useOfflineCache<Product[]>({
    key: 'products',
    fetchFn: fetchProducts,
    ttlMinutes: 60, // Cache products for 1 hour
  });

  // Store refresh in ref for sync task
  refreshRef.current = refresh;

  // Register background sync task
  useSyncTask(
    'products',
    'Produtos',
    async () => {
      await refreshRef.current();
    },
    10 // Medium priority
  );

  const safeProducts = products || [];

  const createProduct = useMutation({
    mutationFn: async (product: {
      plu: string;
      name: string;
      category: ProductCategory;
      unit: UnitType;
      price: number;
      min_stock: number;
    }) => {
      const { data, error } = await supabase
        .from('products')
        .insert(product)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      refresh();
      toast.success('Produto criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar produto: ' + error.message);
    }
  });

  const updateProduct = useMutation({
    mutationFn: async ({ id, ...product }: Partial<Product> & { id: string }) => {
      const { data, error } = await supabase
        .from('products')
        .update(product)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      refresh();
      toast.success('Produto atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar produto: ' + error.message);
    }
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      refresh();
      toast.success('Produto excluído com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao excluir produto: ' + error.message);
    }
  });

  const getProductByPlu = useCallback((plu: string) => {
    return safeProducts.find(p => p.plu === plu);
  }, [safeProducts]);

  const activeProducts = useMemo(() => 
    safeProducts.filter(p => p.is_active), 
    [safeProducts]
  );

  return {
    products: safeProducts,
    activeProducts,
    isLoading,
    error,
    isOnline,
    isFromCache,
    lastUpdated,
    refresh,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductByPlu
  };
}
