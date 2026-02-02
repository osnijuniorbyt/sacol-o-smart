import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Minus, Trash2, Save, Loader2 } from 'lucide-react';
import { PurchaseOrder, PurchaseOrderItem } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface EditOrderDialogProps {
  order: PurchaseOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface EditableItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_cost: number | null;
  isNew?: boolean;
  isDeleted?: boolean;
}

export function EditOrderDialog({ order, open, onOpenChange, onSuccess }: EditOrderDialogProps) {
  const queryClient = useQueryClient();
  const [items, setItems] = useState<EditableItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Inicializa os itens quando o pedido muda
  useEffect(() => {
    if (order?.items) {
      setItems(
        order.items.map(item => ({
          id: item.id,
          product_id: item.product_id,
          product_name: item.product?.name || 'Produto',
          quantity: item.quantity,
          unit_cost: item.unit_cost_estimated,
        }))
      );
    }
  }, [order]);

  const handleQuantityChange = (id: string, delta: number) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id === id) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const handlePriceChange = (id: string, price: string) => {
    const numPrice = parseFloat(price) || null;
    setItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, unit_cost: numPrice } : item
      )
    );
  };

  const handleRemoveItem = (id: string) => {
    setItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, isDeleted: true } : item
      )
    );
  };

  const handleRestoreItem = (id: string) => {
    setItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, isDeleted: false } : item
      )
    );
  };

  const activeItems = items.filter(i => !i.isDeleted);
  const deletedItems = items.filter(i => i.isDeleted);
  const total = activeItems.reduce((sum, i) => sum + (i.unit_cost ? i.quantity * i.unit_cost : 0), 0);

  const handleSave = async () => {
    if (!order) return;
    if (activeItems.length === 0) {
      toast.error('O pedido deve ter pelo menos um item');
      return;
    }

    setIsSaving(true);
    try {
      // Deletar itens removidos
      for (const item of deletedItems) {
        if (!item.isNew) {
          await supabase
            .from('purchase_order_items')
            .delete()
            .eq('id', item.id);
        }
      }

      // Atualizar itens existentes
      for (const item of activeItems) {
        if (!item.isNew) {
          await supabase
            .from('purchase_order_items')
            .update({
              quantity: item.quantity,
              estimated_kg: item.quantity,
              unit_cost_estimated: item.unit_cost,
            })
            .eq('id', item.id);
        }
      }

      // Atualizar pedido com novo total e marcar como editado
      await supabase
        .from('purchase_orders')
        .update({
          total_estimated: total,
          edited_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      toast.success('Pedido atualizado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['purchase_orders'] });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Editar Pedido
            <Badge variant="outline">{order.supplier?.name}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead className="text-center w-28">Qtd</TableHead>
                <TableHead className="text-right w-24">R$/Cx</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeItems.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-sm">
                    {item.product_name}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleQuantityChange(item.id, -1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-mono">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleQuantityChange(item.id, 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      className="w-20 h-8 text-right font-mono"
                      value={item.unit_cost ?? ''}
                      onChange={(e) => handlePriceChange(item.id, e.target.value)}
                      placeholder="0,00"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {deletedItems.length > 0 && (
            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground mb-2">Itens removidos:</p>
              <div className="space-y-1">
                {deletedItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between text-sm text-muted-foreground line-through">
                    <span>{item.product_name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRestoreItem(item.id)}
                    >
                      Restaurar
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t">
            <span className="font-medium">Total Estimado:</span>
            <span className="text-xl font-bold font-mono">
              R$ {total.toFixed(2)}
            </span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
