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
      name: string;
      tare_weight: number;
      material: PackagingMaterial;
      is_returnable?: boolean;
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
      toast.success('Embalagem cadastrada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao cadastrar embalagem: ' + error.message);
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
      toast.success('Embalagem atualizada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar embalagem: ' + error.message);
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
      toast.success('Embalagem excluída com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao excluir embalagem: ' + error.message);
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
