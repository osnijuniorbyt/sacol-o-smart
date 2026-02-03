import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SupplierProduct {
  product_id: string;
  product_name: string;
  category: string;
  ultimo_preco: number;
  ultimo_vasilhame_id: string | null;
  vasilhame_nome: string | null;
  quantidade_compras: number;
  preco_medio: number;
  last_purchase_at: string | null;
}

export function useSupplierProducts(supplierId: string | null) {
  const { data: products = [], isLoading, error, refetch } = useQuery({
    queryKey: ['supplier_products', supplierId],
    queryFn: async () => {
      if (!supplierId) return [];
      
      const { data, error } = await supabase
        .rpc('get_supplier_products', { p_supplier_id: supplierId });
      
      if (error) throw error;
      return (data || []) as SupplierProduct[];
    },
    enabled: !!supplierId,
  });

  // Produtos com histórico (comprados antes desse fornecedor)
  const productsWithHistory = products.filter(p => p.quantidade_compras > 0);
  
  // Todos os produtos (incluindo sem histórico)
  const allProducts = products;

  return {
    products: allProducts,
    productsWithHistory,
    isLoading,
    error,
    refetch,
  };
}
