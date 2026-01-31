import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useSuppliers, Supplier } from '@/hooks/useSuppliers';
import { Building2, Plus, Pencil, Trash2, Search, Phone, CreditCard } from 'lucide-react';

export default function Fornecedores() {
  const { suppliers, createSupplier, updateSupplier, deleteSupplier, isLoading } = useSuppliers();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    cnpj: '',
    phone: '',
    payment_terms: '',
    is_active: true
  });

  const resetForm = () => {
    setFormData({
      name: '',
      cnpj: '',
      phone: '',
      payment_terms: '',
      is_active: true
    });
    setEditingSupplier(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (supplier: Supplier) => {
    setFormData({
      name: supplier.name,
      cnpj: supplier.cnpj || '',
      phone: supplier.phone || '',
      payment_terms: String(supplier.payment_terms || ''),
      is_active: supplier.is_active
    });
    setEditingSupplier(supplier);
    setDialogOpen(true);
  };

  const formatCNPJ = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 14);
    return digits
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 10) {
      return digits.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
    }
    return digits.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      name: formData.name,
      cnpj: formData.cnpj || null,
      phone: formData.phone || null,
      payment_terms: parseInt(formData.payment_terms) || 0,
      is_active: formData.is_active
    };

    if (editingSupplier) {
      await updateSupplier.mutateAsync({ id: editingSupplier.id, ...data });
    } else {
      await createSupplier.mutateAsync(data);
    }

    setDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    await deleteSupplier.mutateAsync(id);
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.cnpj && s.cnpj.includes(searchQuery))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Fornecedores</h1>
          <p className="text-muted-foreground">Cadastro e gerenciamento</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="h-14 px-6" onClick={openCreateDialog}>
              <Plus className="mr-2 h-5 w-5" />
              Novo Fornecedor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome / Razão Social *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Hortifrutti CEASA"
                  className="h-14"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>CNPJ</Label>
                <Input
                  value={formData.cnpj}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    cnpj: formatCNPJ(e.target.value) 
                  }))}
                  placeholder="00.000.000/0000-00"
                  className="h-14"
                  maxLength={18}
                />
              </div>

              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    phone: formatPhone(e.target.value) 
                  }))}
                  placeholder="(00) 00000-0000"
                  className="h-14"
                  maxLength={15}
                />
              </div>

              <div className="space-y-2">
                <Label>Prazo de Pagamento (dias)</Label>
                <Input
                  type="number"
                  value={formData.payment_terms}
                  onChange={(e) => setFormData(prev => ({ ...prev, payment_terms: e.target.value }))}
                  placeholder="0"
                  className="h-14"
                  min={0}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                <Label htmlFor="is_active" className="cursor-pointer">Fornecedor Ativo</Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-14" 
                disabled={createSupplier.isPending || updateSupplier.isPending}
              >
                {createSupplier.isPending || updateSupplier.isPending 
                  ? 'Salvando...' 
                  : editingSupplier 
                    ? 'Salvar Alterações' 
                    : 'Criar Fornecedor'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou CNPJ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-14"
            />
          </div>
        </CardContent>
      </Card>

      {/* Suppliers list */}
      {isLoading ? (
        <p className="text-center text-muted-foreground py-8">Carregando...</p>
      ) : filteredSuppliers.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Building2 className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>Nenhum fornecedor encontrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filteredSuppliers.map(supplier => (
            <Card 
              key={supplier.id} 
              className={`relative ${!supplier.is_active ? 'opacity-60' : ''}`}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium line-clamp-1">{supplier.name}</h3>
                      {supplier.cnpj && (
                        <p className="text-sm text-muted-foreground">{supplier.cnpj}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10"
                      onClick={() => openEditDialog(supplier)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir Fornecedor?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. O fornecedor será permanentemente removido.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="h-12">Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            className="h-12 bg-destructive hover:bg-destructive/90"
                            onClick={() => handleDelete(supplier.id)}
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                
                <div className="space-y-2 mt-4">
                  {supplier.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{supplier.phone}</span>
                    </div>
                  )}
                  {supplier.payment_terms > 0 && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CreditCard className="h-4 w-4" />
                      <span>Prazo: {supplier.payment_terms} dias</span>
                    </div>
                  )}
                </div>
                
                {!supplier.is_active && (
                  <div className="absolute top-2 right-2">
                    <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">
                      Inativo
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
