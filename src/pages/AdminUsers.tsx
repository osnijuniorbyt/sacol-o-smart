import { useEffect, useState } from 'react';
import { useUserManagement } from '@/hooks/useUserManagement';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Users, UserCheck, UserX, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AdminUsers() {
  const {
    users,
    loading,
    fetchAllUsers,
    fetchPendingUsers,
    approveUser,
    revokeAccess,
  } = useUserManagement();

  const [activeTab, setActiveTab] = useState('pending');
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'approve' | 'revoke';
    userId: string;
    userName: string;
  }>({ open: false, type: 'approve', userId: '', userName: '' });

  useEffect(() => {
    if (activeTab === 'pending') {
      fetchPendingUsers();
    } else {
      fetchAllUsers();
    }
  }, [activeTab, fetchAllUsers, fetchPendingUsers]);

  const handleConfirmAction = async () => {
    if (confirmDialog.type === 'approve') {
      await approveUser(confirmDialog.userId);
    } else {
      await revokeAccess(confirmDialog.userId);
    }
    setConfirmDialog({ ...confirmDialog, open: false });
  };

  const pendingUsers = users.filter(u => !u.is_approved);
  const approvedUsers = users.filter(u => u.is_approved);

  const UserRow = ({ user }: { user: typeof users[0] }) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gradient-to-r from-white to-amber-50/30 rounded-xl border border-amber-100 gap-3">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-emerald-800 truncate">{user.full_name || 'Usuário sem nome'}</p>
        <p className="text-sm text-emerald-600">
          Cadastrado em {format(new Date(user.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
        </p>
        {user.approved_at && (
          <p className="text-xs text-emerald-500">
            Aprovado em {format(new Date(user.approved_at), "dd/MM/yyyy", { locale: ptBR })}
          </p>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <Badge variant={user.is_approved ? 'default' : 'secondary'} className={user.is_approved ? 'bg-emerald-600' : 'bg-amber-500'}>
          {user.is_approved ? (
            <>
              <CheckCircle className="w-3 h-3 mr-1" />
              Aprovado
            </>
          ) : (
            <>
              <Clock className="w-3 h-3 mr-1" />
              Pendente
            </>
          )}
        </Badge>
        
        {user.is_approved ? (
          <Button
            size="sm"
            variant="outline"
            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            onClick={() => setConfirmDialog({
              open: true,
              type: 'revoke',
              userId: user.id,
              userName: user.full_name || 'Usuário',
            })}
          >
            <XCircle className="w-4 h-4 mr-1" />
            Revogar
          </Button>
        ) : (
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={() => setConfirmDialog({
              open: true,
              type: 'approve',
              userId: user.id,
              userName: user.full_name || 'Usuário',
            })}
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            Aprovar
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-800 to-emerald-600 bg-clip-text text-transparent">
            Gerenciar Usuários
          </h1>
          <p className="text-emerald-600 mt-1">
            Aprove ou revogue o acesso de usuários ao sistema
          </p>
        </div>
        
        <Button
          variant="outline"
          onClick={() => activeTab === 'pending' ? fetchPendingUsers() : fetchAllUsers()}
          disabled={loading}
          className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-700">{pendingUsers.length}</p>
                <p className="text-sm text-amber-600">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-700">{approvedUsers.length}</p>
                <p className="text-sm text-emerald-600">Aprovados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100/50 border-slate-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-600 flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-700">{users.length}</p>
                <p className="text-sm text-slate-600">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users List */}
      <Card className="border-amber-200/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-emerald-800">Lista de Usuários</CardTitle>
          <CardDescription>Gerencie os acessos ao sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="pending" className="gap-2">
                <Clock className="w-4 h-4" />
                Pendentes
                {pendingUsers.length > 0 && (
                  <Badge variant="secondary" className="ml-1 bg-amber-500 text-white">
                    {pendingUsers.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved" className="gap-2">
                <UserCheck className="w-4 h-4" />
                Aprovados
              </TabsTrigger>
              <TabsTrigger value="all" className="gap-2">
                <Users className="w-4 h-4" />
                Todos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-3">
              {loading ? (
                <div className="text-center py-8 text-emerald-600">Carregando...</div>
              ) : pendingUsers.length === 0 ? (
                <div className="text-center py-8 text-emerald-600">
                  <UserCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum usuário pendente de aprovação</p>
                </div>
              ) : (
                pendingUsers.map(user => <UserRow key={user.id} user={user} />)
              )}
            </TabsContent>

            <TabsContent value="approved" className="space-y-3">
              {loading ? (
                <div className="text-center py-8 text-emerald-600">Carregando...</div>
              ) : approvedUsers.length === 0 ? (
                <div className="text-center py-8 text-emerald-600">
                  <UserX className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum usuário aprovado ainda</p>
                </div>
              ) : (
                approvedUsers.map(user => <UserRow key={user.id} user={user} />)
              )}
            </TabsContent>

            <TabsContent value="all" className="space-y-3">
              {loading ? (
                <div className="text-center py-8 text-emerald-600">Carregando...</div>
              ) : users.length === 0 ? (
                <div className="text-center py-8 text-emerald-600">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum usuário cadastrado</p>
                </div>
              ) : (
                users.map(user => <UserRow key={user.id} user={user} />)
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.type === 'approve' ? 'Aprovar Usuário' : 'Revogar Acesso'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.type === 'approve' ? (
                <>
                  Deseja aprovar o acesso de <strong>{confirmDialog.userName}</strong> ao sistema?
                  <br />
                  O usuário poderá acessar todas as funcionalidades após a aprovação.
                </>
              ) : (
                <>
                  Deseja revogar o acesso de <strong>{confirmDialog.userName}</strong>?
                  <br />
                  O usuário não conseguirá mais acessar o sistema até ser aprovado novamente.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              className={confirmDialog.type === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {confirmDialog.type === 'approve' ? 'Aprovar' : 'Revogar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
