import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Location, LocationType } from '@/types/database';
import { toast } from 'sonner';

export function useLocations() {
  const queryClient = useQueryClient();

  const { data: locations = [], isLoading, error } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Location[];
    }
  });

  const createLocation = useMutation({
    mutationFn: async (location: {
      name: string;
      type: LocationType;
      max_capacity?: number;
      temperature_min?: number;
      temperature_max?: number;
    }) => {
      const { data, error } = await supabase
        .from('locations')
        .insert(location)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      toast.success('Local cadastrado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao cadastrar local: ' + error.message);
    }
  });

  const updateLocation = useMutation({
    mutationFn: async ({ id, ...location }: Partial<Location> & { id: string }) => {
      const { data, error } = await supabase
        .from('locations')
        .update(location)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      toast.success('Local atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar local: ' + error.message);
    }
  });

  const deleteLocation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      toast.success('Local excluído com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao excluir local: ' + error.message);
    }
  });

  const activeLocations = locations.filter(l => l.is_active);
  const coldStorages = locations.filter(l => l.type === 'camara_fria' && l.is_active);
  const regularStorages = locations.filter(l => l.type !== 'camara_fria' && l.is_active);

  return {
    locations,
    activeLocations,
    coldStorages,
    regularStorages,
    isLoading,
    error,
    createLocation,
    updateLocation,
    deleteLocation
  };
}
