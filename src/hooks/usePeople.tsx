import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Person, PersonType } from '@/types/database';
import { toast } from 'sonner';

export function usePeople() {
  const queryClient = useQueryClient();

  const { data: people = [], isLoading, error } = useQuery({
    queryKey: ['people'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('people')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Person[];
    }
  });

  const createPerson = useMutation({
    mutationFn: async (person: {
      name: string;
      type: PersonType;
      cpf_cnpj?: string;
      phone?: string;
      email?: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('people')
        .insert(person)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] });
      toast.success('Pessoa cadastrada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao cadastrar pessoa: ' + error.message);
    }
  });

  const updatePerson = useMutation({
    mutationFn: async ({ id, ...person }: Partial<Person> & { id: string }) => {
      const { data, error } = await supabase
        .from('people')
        .update(person)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] });
      toast.success('Pessoa atualizada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar pessoa: ' + error.message);
    }
  });

  const deletePerson = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('people')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] });
      toast.success('Pessoa excluída com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao excluir pessoa: ' + error.message);
    }
  });

  const activePeople = people.filter(p => p.is_active);
  const employees = people.filter(p => p.type === 'funcionario' && p.is_active);
  const clients = people.filter(p => p.type === 'cliente' && p.is_active);
  const drivers = people.filter(p => p.type === 'motorista' && p.is_active);

  return {
    people,
    activePeople,
    employees,
    clients,
    drivers,
    isLoading,
    error,
    createPerson,
    updatePerson,
    deletePerson
  };
}
