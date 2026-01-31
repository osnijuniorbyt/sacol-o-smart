import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useBreakages } from '@/hooks/useBreakages';
import { useProducts } from '@/hooks/useProducts';
import { useStock } from '@/hooks/useStock';
import { BreakageReason, BREAKAGE_REASON_LABELS } from '@/types/database';
import { Trash2, Plus, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

export default function Quebras() {
  const { breakages, createBreakage, isLoading, getTotalLoss } = useBreakages();
  const { activeProducts, products } = useProducts();
  const { getBatchesByProduct } = useStock();
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    product_id: '',
    batch_id: '',
    quantity: '',
    reason: '' as BreakageReason | '',
    notes: ''
  });

  const selectedProductBatches = formData.product_id 
    ? getBatchesByProduct(formData.product_id)
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.reason) return;

    await createBreakage.mutateAsync({
      product_id: formData.product_id,
      batch_id: formData.batch_id || undefined,
      quantity: parseFloat(formData.quantity),
      reason: formData.reason,
      notes: formData.notes || undefined
    });

    setFormData({
      product_id: '',
      batch_id: '',
      quantity: '',
      reason: '',
      notes: ''
    });
    setDialogOpen(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getReasonColor = (reason: BreakageReason) => {
    switch (reason) {
      case 'vencido': return 'bg-orange-100 text-orange-800';
      case 'danificado': return 'bg-red-100 text-red-800';
      case 'furto': return 'bg-purple-100 text-purple-800';
      case 'erro_operacional': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Quebras</h1>
          <p className="text-muted-foreground">Registro de perdas e prejuízos</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="h-14 px-6" variant="destructive">
              <Plus className="mr-2 h-5 w-5" />
              Registrar Quebra
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Registrar Quebra</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Produto</Label>
                <Select
                  value={formData.product_id}
                  onValueChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    product_id: value,
                    batch_id: '' 
                  }))}
                  required
                >
                  <SelectTrigger className="h-14">
                    <SelectValue placeholder="Selecione o produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeProducts.map(product => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedProductBatches.length > 0 && (
                <div className="space-y-2">
                  <Label>Lote (opcional)</Label>
                  <Select
                    value={formData.batch_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, batch_id: value }))}
                  >
                    <SelectTrigger className="h-14">
                      <SelectValue placeholder="Selecione o lote (FIFO automático)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">FIFO Automático</SelectItem>
                      {selectedProductBatches.map((batch, index) => (
                        <SelectItem key={batch.id} value={batch.id}>
                          Lote {index + 1} - {Number(batch.quantity).toFixed(3)} un 
                          ({formatCurrency(Number(batch.cost_per_unit))}/un)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Quantidade</Label>
                  <Input
                    type="number"
                    step="0.001"
                    value={formData.quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                    placeholder="0.000"
                    className="h-14"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Motivo</Label>
                  <Select
                    value={formData.reason}
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      reason: value as BreakageReason 
                    }))}
                    required
                  >
                    <SelectTrigger className="h-14">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(BREAKAGE_REASON_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Detalhes adicionais..."
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full h-14" variant="destructive" disabled={createBreakage.isPending}>
                {createBreakage.isPending ? 'Salvando...' : 'Registrar Quebra'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary */}
      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/20">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Prejuízo Total</p>
              <p className="text-3xl font-bold text-destructive">
                {formatCurrency(getTotalLoss())}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Breakages list */}
      {isLoading ? (
        <p className="text-center text-muted-foreground py-8">Carregando...</p>
      ) : breakages.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Trash2 className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>Nenhuma quebra registrada</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {breakages.map(breakage => {
            const product = products.find(p => p.id === breakage.product_id);
            return (
              <Card key={breakage.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{product?.name || 'Produto'}</h3>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getReasonColor(breakage.reason)}`}>
                          {BREAKAGE_REASON_LABELS[breakage.reason]}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {Number(breakage.quantity).toFixed(3)} {product?.unit || 'un'} × {formatCurrency(Number(breakage.cost_per_unit))}
                      </p>
                      {breakage.notes && (
                        <p className="text-sm text-muted-foreground mt-1 italic">
                          "{breakage.notes}"
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-destructive">
                        -{formatCurrency(Number(breakage.total_loss))}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(breakage.created_at), 'dd/MM/yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
