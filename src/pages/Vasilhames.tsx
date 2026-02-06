import { useState } from 'react';
import { usePackagings } from '@/hooks/usePackagings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2, Package, Scale, Box } from 'lucide-react';
import { Packaging, PackagingMaterial, PACKAGING_MATERIAL_LABELS } from '@/types/database';

interface PackagingFormData {
  codigo: string;
  name: string;
  material: PackagingMaterial;
  tare_weight: number;
  peso_liquido: number;
  is_returnable: boolean;
  is_active: boolean;
}

const emptyFormData: PackagingFormData = {
  codigo: '',
  name: '',
  material: 'plastico',
  tare_weight: 0,
  peso_liquido: 0,
  is_returnable: false,
  is_active: true,
};

export default function Vasilhames() {
  const { packagings, isLoading, createPackaging, updatePackaging, deletePackaging } = usePackagings();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPackaging, setEditingPackaging] = useState<Packaging | null>(null);
  const [formData, setFormData] = useState<PackagingFormData>(emptyFormData);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleOpenNew = () => {
    setEditingPackaging(null);
    setFormData(emptyFormData);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (packaging: Packaging) => {
    setEditingPackaging(packaging);
    setFormData({
      codigo: packaging.codigo || '',
      name: packaging.name,
      material: packaging.material,
      tare_weight: packaging.tare_weight,
      peso_liquido: packaging.peso_liquido || 0,
      is_returnable: packaging.is_returnable,
      is_active: packaging.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingPackaging) {
      await updatePackaging.mutateAsync({
        id: editingPackaging.id,
        codigo: formData.codigo || null,
        name: formData.name,
        material: formData.material,
        tare_weight: formData.tare_weight,
        peso_liquido: formData.peso_liquido,
        is_returnable: formData.is_returnable,
        is_active: formData.is_active,
      });
    } else {
      await createPackaging.mutateAsync({
        codigo: formData.codigo || null,
        name: formData.name,
        material: formData.material,
        tare_weight: formData.tare_weight,
        peso_liquido: formData.peso_liquido,
        is_returnable: formData.is_returnable,
        is_active: formData.is_active,
      });
    }
    
    setIsDialogOpen(false);
    setFormData(emptyFormData);
    setEditingPackaging(null);
  };

  const handleDelete = async (id: string) => {
    await deletePackaging.mutateAsync(id);
    setDeleteConfirm(null);
  };

  const getMaterialColor = (material: PackagingMaterial) => {
    switch (material) {
      case 'plastico': return 'bg-blue-500/10 text-blue-700 border-blue-500/30';
      case 'madeira': return 'bg-amber-500/10 text-amber-700 border-amber-500/30';
      case 'papelao': return 'bg-orange-500/10 text-orange-700 border-orange-500/30';
      case 'isopor': return 'bg-gray-500/10 text-gray-700 border-gray-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getMaterialIcon = (material: PackagingMaterial) => {
    switch (material) {
      case 'plastico': return '🧊';
      case 'madeira': return '🪵';
      case 'papelao': return '📦';
      case 'isopor': return '❄️';
      default: return '📦';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <Box className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Vasilhames</h1>
            <p className="text-sm text-muted-foreground">{packagings.length} cadastrados</p>
          </div>
        </div>
        <Button onClick={handleOpenNew} className="gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Novo</span>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{packagings.filter(p => p.material === 'plastico').length}</p>
                <p className="text-xs text-muted-foreground">Plástico</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Package className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{packagings.filter(p => p.material === 'madeira').length}</p>
                <p className="text-xs text-muted-foreground">Madeira</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Package className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{packagings.filter(p => p.material === 'papelao').length}</p>
                <p className="text-xs text-muted-foreground">Papelão</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Scale className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{packagings.filter(p => p.is_returnable).length}</p>
                <p className="text-xs text-muted-foreground">Retornáveis</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Código</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead className="text-center">Tipo</TableHead>
                  <TableHead className="text-right">Tara (kg)</TableHead>
                  <TableHead className="text-right">Peso Líq. (kg)</TableHead>
                  <TableHead className="text-center">Retornável</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="w-24 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packagings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Nenhum vasilhame cadastrado
                    </TableCell>
                  </TableRow>
                ) : (
                  packagings.map((packaging) => (
                    <TableRow key={packaging.id} className={!packaging.is_active ? 'opacity-50' : ''}>
                      <TableCell className="font-mono text-sm">
                        {packaging.codigo || '-'}
                      </TableCell>
                      <TableCell className="font-medium">{packaging.name}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={getMaterialColor(packaging.material)}>
                          <span className="mr-1">{getMaterialIcon(packaging.material)}</span>
                          {PACKAGING_MATERIAL_LABELS[packaging.material]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {packaging.tare_weight.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold text-primary">
                        {(packaging.peso_liquido || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        {packaging.is_returnable ? (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30">
                            Sim
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-muted text-muted-foreground">
                            Não
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={packaging.is_active ? 'default' : 'secondary'}>
                          {packaging.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(packaging)}
                            className="h-8 w-8"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteConfirm(packaging.id)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Box className="h-5 w-5" />
              {editingPackaging ? 'Editar Vasilhame' : 'Novo Vasilhame'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="codigo">Código</Label>
                <Input
                  id="codigo"
                  value={formData.codigo}
                  onChange={(e) => setFormData(prev => ({ ...prev, codigo: e.target.value }))}
                  placeholder="Ex: CX001"
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="material">Tipo/Material</Label>
                <Select
                  value={formData.material}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, material: value as PackagingMaterial }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PACKAGING_MATERIAL_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        <span className="flex items-center gap-2">
                          {getMaterialIcon(value as PackagingMaterial)} {label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Caixa Plástica Grande"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tare_weight">Tara (kg)</Label>
                <Input
                  id="tare_weight"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.tare_weight}
                  onChange={(e) => setFormData(prev => ({ ...prev, tare_weight: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                  className="font-mono"
                  required
                />
                <p className="text-xs text-muted-foreground">Peso da embalagem vazia</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="peso_liquido" className="text-primary font-semibold">Peso Líquido (kg)</Label>
                <Input
                  id="peso_liquido"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.peso_liquido}
                  onChange={(e) => setFormData(prev => ({ ...prev, peso_liquido: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                  className="font-mono border-primary/50"
                  required
                />
                <p className="text-xs text-muted-foreground">Peso do produto na embalagem</p>
              </div>
            </div>

            {/* Peso Bruto calculado */}
            {(formData.tare_weight > 0 || formData.peso_liquido > 0) && (
              <div className="p-3 rounded-lg bg-muted/50 border">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Peso Bruto Total:</span>
                  <span className="font-mono font-semibold">
                    {(formData.tare_weight + formData.peso_liquido).toFixed(2)} kg
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  id="is_returnable"
                  checked={formData.is_returnable}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_returnable: checked }))}
                />
                <Label htmlFor="is_returnable">Retornável</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">Ativo</Label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createPackaging.isPending || updatePackaging.isPending}>
                {editingPackaging ? 'Salvar' : 'Cadastrar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-destructive">Excluir Vasilhame</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Tem certeza que deseja excluir este vasilhame? Esta ação não pode ser desfeita.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              disabled={deletePackaging.isPending}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
