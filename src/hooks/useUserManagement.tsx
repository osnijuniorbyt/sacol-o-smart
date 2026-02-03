import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  is_approved: boolean;
  approved_at: string | null;
  created_at: string;
}

export function useUserManagement() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);

  const fetchAllUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar usuários',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchPendingUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_approved', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar usuários pendentes',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const approveUser = useCallback(async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_approved: true,
          approved_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: 'Usuário aprovado',
        description: 'O usuário agora pode acessar o sistema.',
      });

      // Atualizar lista local
      setUsers(prev =>
        prev.map(user =>
          user.id === userId
            ? { ...user, is_approved: true, approved_at: new Date().toISOString() }
            : user
        )
      );

      return { error: null };
    } catch (error: any) {
      toast({
        title: 'Erro ao aprovar usuário',
        description: error.message,
        variant: 'destructive',
      });
      return { error };
    }
  }, [toast]);

  const revokeAccess = useCallback(async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_approved: false,
          approved_at: null,
        })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: 'Acesso revogado',
        description: 'O usuário não pode mais acessar o sistema.',
      });

      // Atualizar lista local
      setUsers(prev =>
        prev.map(user =>
          user.id === userId
            ? { ...user, is_approved: false, approved_at: null }
            : user
        )
      );

      return { error: null };
    } catch (error: any) {
      toast({
        title: 'Erro ao revogar acesso',
        description: error.message,
        variant: 'destructive',
      });
      return { error };
    }
  }, [toast]);

  const addAdminRole = useCallback(async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: 'admin' });

      if (error) throw error;

      toast({
        title: 'Role adicionado',
        description: 'Usuário agora é administrador.',
      });

      return { error: null };
    } catch (error: any) {
      toast({
        title: 'Erro ao adicionar role',
        description: error.message,
        variant: 'destructive',
      });
      return { error };
    }
  }, [toast]);

  const removeAdminRole = useCallback(async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'admin');

      if (error) throw error;

      toast({
        title: 'Role removido',
        description: 'Usuário não é mais administrador.',
      });

      return { error: null };
    } catch (error: any) {
      toast({
        title: 'Erro ao remover role',
        description: error.message,
        variant: 'destructive',
      });
      return { error };
    }
  }, [toast]);

  return {
    users,
    loading,
    fetchAllUsers,
    fetchPendingUsers,
    approveUser,
    revokeAccess,
    addAdminRole,
    removeAdminRole,
  };
}
