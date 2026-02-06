import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Packaging, PackagingMaterial } from '@/types/database';
import { toast } from 'sonner';

export function usePackagings() {
  const queryClient = useQueryClient();

  const { data: packagings = [], isLoading, error } = useQuery({
    queryKey: ['packagings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('packagings')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Packaging[];
    }
  });

  const createPackaging = useMutation({
    mutationFn: async (packaging: {
      codigo?: string | null;
      name: string;
      tare_weight: number;
      peso_liquido: number;
      material: PackagingMaterial;
      is_returnable?: boolean;
      is_active?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('packagings')
        .insert(packaging)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packagings'] });
      toast.success('Vasilhame cadastrado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao cadastrar vasilhame: ' + error.message);
    }
  });

  const updatePackaging = useMutation({
    mutationFn: async ({ id, ...packaging }: Partial<Packaging> & { id: string }) => {
      const { data, error } = await supabase
        .from('packagings')
        .update(packaging)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packagings'] });
      toast.success('Vasilhame atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar vasilhame: ' + error.message);
    }
  });

  const deletePackaging = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('packagings')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packagings'] });
      toast.success('Vasilhame excluído com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao excluir vasilhame: ' + error.message);
    }
  });

  const activePackagings = packagings.filter(p => p.is_active);
  const returnablePackagings = packagings.filter(p => p.is_returnable && p.is_active);

  return {
    packagings,
    activePackagings,
    returnablePackagings,
    isLoading,
    error,
    createPackaging,
    updatePackaging,
    deletePackaging
  };
}
