import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type {
  LoteDemanda,
  ItemDemanda,
  LoteDemandaComItens,
  ItemDemandaComProduto,
  CreateLoteDemandaInput,
  CreateItemDemandaInput,
  StatusLoteDemanda,
} from '@/types/demanda';

export function useDemandLots() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar todos os lotes
  const { data: lotes = [], isLoading: loadingLotes, refetch: refetchLotes } = useQuery({
    queryKey: ['lotes-demanda'],
    queryFn: async (): Promise<LoteDemanda[]> => {
      const { data, error } = await supabase
        .from('lotes_demanda')
        .select('*')
        .order('data_necessidade', { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as LoteDemanda[];
    },
  });

  // Buscar lote com itens
  const fetchLoteComItens = async (loteId: string): Promise<LoteDemandaComItens | null> => {
    const { data: lote, error: loteError } = await supabase
      .from('lotes_demanda')
      .select('*')
      .eq('id', loteId)
      .single();

    if (loteError) throw loteError;
    if (!lote) return null;

    const { data: itens, error: itensError } = await supabase
      .from('itens_demanda')
      .select(`
        *,
        product:products(id, name, category, unit, image_url)
      `)
      .eq('lote_id', loteId);

    if (itensError) throw itensError;

    return {
      ...(lote as unknown as LoteDemanda),
      itens: (itens || []) as unknown as ItemDemandaComProduto[],
    };
  };

  // Criar lote
  const createLoteMutation = useMutation({
    mutationFn: async (input: CreateLoteDemandaInput): Promise<LoteDemanda> => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('lotes_demanda')
        .insert({
          titulo: input.titulo,
          data_necessidade: input.data_necessidade,
          prioridade: input.prioridade || 'NORMAL',
          observacoes: input.observacoes || null,
          created_by: user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as unknown as LoteDemanda;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lotes-demanda'] });
      toast({ title: 'Lote criado com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao criar lote', description: error.message, variant: 'destructive' });
    },
  });

  // Adicionar item ao lote
  const addItemMutation = useMutation({
    mutationFn: async (input: CreateItemDemandaInput): Promise<ItemDemanda> => {
      const { data, error } = await supabase
        .from('itens_demanda')
        .insert({
          lote_id: input.lote_id,
          product_id: input.product_id,
          qtd_sugerida: input.qtd_sugerida,
          prioridade: input.prioridade || 'NORMAL',
          categoria: input.categoria || null,
          observacoes: input.observacoes || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as unknown as ItemDemanda;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lotes-demanda'] });
      toast({ title: 'Item adicionado!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao adicionar item', description: error.message, variant: 'destructive' });
    },
  });

  // Atualizar status do lote
  const updateStatusMutation = useMutation({
    mutationFn: async ({ loteId, status }: { loteId: string; status: StatusLoteDemanda }) => {
      const { error } = await supabase
        .from('lotes_demanda')
        .update({ status })
        .eq('id', loteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lotes-demanda'] });
      toast({ title: 'Status atualizado!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao atualizar status', description: error.message, variant: 'destructive' });
    },
  });

  // Remover item
  const removeItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('itens_demanda')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lotes-demanda'] });
      toast({ title: 'Item removido!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao remover item', description: error.message, variant: 'destructive' });
    },
  });

  // Deletar lote
  const deleteLoteMutation = useMutation({
    mutationFn: async (loteId: string) => {
      const { error } = await supabase
        .from('lotes_demanda')
        .delete()
        .eq('id', loteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lotes-demanda'] });
      toast({ title: 'Lote removido!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao remover lote', description: error.message, variant: 'destructive' });
    },
  });

  return {
    // Data
    lotes,
    loadingLotes,
    
    // Queries
    refetchLotes,
    fetchLoteComItens,
    
    // Mutations
    createLote: createLoteMutation.mutateAsync,
    addItem: addItemMutation.mutateAsync,
    updateStatus: updateStatusMutation.mutateAsync,
    removeItem: removeItemMutation.mutateAsync,
    deleteLote: deleteLoteMutation.mutateAsync,
    
    // Loading states
    isCreating: createLoteMutation.isPending,
    isAddingItem: addItemMutation.isPending,
    isUpdatingStatus: updateStatusMutation.isPending,
  };
}
