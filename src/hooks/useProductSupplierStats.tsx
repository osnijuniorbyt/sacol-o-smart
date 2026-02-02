import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProductSupplierRanking {
  product_id: string;
  supplier_id: string;
  supplier_name: string;
  order_count: number;
  total_quantity: number;
  last_order: string;
  rank: number;
}

export interface ProductMainSupplier {
  product_id: string;
  supplier_id: string;
  supplier_name: string;
  total_quantity: number;
}

export function useProductSupplierStats() {
  // Get all supplier rankings for all products
  const rankingsQuery = useQuery({
    queryKey: ['product_supplier_rankings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_supplier_rankings' as any)
        .select('*');
      
      if (error) throw error;
      return (data as unknown) as ProductSupplierRanking[];
    },
  });

  // Get main supplier for each product (rank = 1)
  const mainSuppliersQuery = useQuery({
    queryKey: ['product_main_supplier'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_main_supplier' as any)
        .select('*');
      
      if (error) throw error;
      return (data as unknown) as ProductMainSupplier[];
    },
  });

  // Helper: Get all suppliers for a product with their stats
  const getSuppliersForProduct = (productId: string): ProductSupplierRanking[] => {
    return (rankingsQuery.data || [])
      .filter(r => r.product_id === productId)
      .sort((a, b) => a.rank - b.rank);
  };

  // Helper: Get main supplier for a product
  const getMainSupplier = (productId: string): ProductMainSupplier | undefined => {
    return (mainSuppliersQuery.data || []).find(m => m.product_id === productId);
  };

  // Helper: Check if product has been ordered from a specific supplier
  const hasOrderedFromSupplier = (productId: string, supplierId: string): boolean => {
    return (rankingsQuery.data || []).some(
      r => r.product_id === productId && r.supplier_id === supplierId
    );
  };

  // Helper: Get stats for product from specific supplier
  const getSupplierStats = (productId: string, supplierId: string): ProductSupplierRanking | undefined => {
    return (rankingsQuery.data || []).find(
      r => r.product_id === productId && r.supplier_id === supplierId
    );
  };

  // Get all products for a supplier (for history sheet)
  const getProductsForSupplier = (supplierId: string): ProductSupplierRanking[] => {
    return (rankingsQuery.data || [])
      .filter(r => r.supplier_id === supplierId)
      .sort((a, b) => b.total_quantity - a.total_quantity);
  };

  return {
    rankings: rankingsQuery.data || [],
    mainSuppliers: mainSuppliersQuery.data || [],
    isLoading: rankingsQuery.isLoading || mainSuppliersQuery.isLoading,
    getSuppliersForProduct,
    getMainSupplier,
    hasOrderedFromSupplier,
    getSupplierStats,
    getProductsForSupplier,
  };
}
