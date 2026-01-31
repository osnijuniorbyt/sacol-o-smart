import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Supplier {
  id: string;
  name: string;
  cnpj: string | null;
  phone: string | null;
  payment_terms: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useSuppliers() {
  const queryClient = useQueryClient();

  const { data: suppliers = [], isLoading, error } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Supplier[];
    }
  });

  const createSupplier = useMutation({
    mutationFn: async (supplier: {
      name: string;
      cnpj?: string;
      phone?: string;
      payment_terms?: number;
    }) => {
      const { data, error } = await supabase
        .from('suppliers')
        .insert(supplier)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Fornecedor criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar fornecedor: ' + error.message);
    }
  });

  const updateSupplier = useMutation({
    mutationFn: async ({ id, ...supplier }: Partial<Supplier> & { id: string }) => {
      const { data, error } = await supabase
        .from('suppliers')
        .update(supplier)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Fornecedor atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar fornecedor: ' + error.message);
    }
  });

  const deleteSupplier = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Fornecedor excluído com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao excluir fornecedor: ' + error.message);
    }
  });

  const activeSuppliers = suppliers.filter(s => s.is_active);

  return {
    suppliers,
    activeSuppliers,
    isLoading,
    error,
    createSupplier,
    updateSupplier,
    deleteSupplier
  };
}
