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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Loader2,
  Package,
  Scale,
  DollarSign
} from 'lucide-react';
import { PurchaseOrder, PurchaseOrderItem } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type QualityStatus = 'ok' | 'parcial' | 'recusado';

interface ItemReceiving {
  id: string;
  product_id: string;
  product_name: string;
  quantity_ordered: number;
  quantity_received: number;
  unit_cost_estimated: number;
  unit_cost_actual: number;
  quality_status: QualityStatus;
  quality_notes: string;
}

interface ReceivingDialogProps {
  order: PurchaseOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const QUALITY_LABELS: Record<QualityStatus, { label: string; color: string }> = {
  ok: { label: 'OK', color: 'bg-green-500' },
  parcial: { label: 'Parcial', color: 'bg-yellow-500' },
  recusado: { label: 'Recusado', color: 'bg-red-500' },
};

export function ReceivingDialog({ order, open, onOpenChange, onSuccess }: ReceivingDialogProps) {
  const [items, setItems] = useState<ItemReceiving[]>([]);
  const [generalNotes, setGeneralNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (order?.items) {
      setItems(order.items.map(item => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.product?.name || 'Produto',
        quantity_ordered: item.quantity,
        quantity_received: item.quantity, // Default to ordered quantity
        unit_cost_estimated: item.unit_cost_estimated || 0,
        unit_cost_actual: item.unit_cost_estimated || 0, // Default to estimated
        quality_status: 'ok' as QualityStatus,
        quality_notes: '',
      })));
      setGeneralNotes('');
    }
  }, [order]);

  const updateItem = (id: string, field: keyof ItemReceiving, value: any) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleConfirmReceiving = async () => {
    if (!order) return;

    // Validate
    const hasInvalidItems = items.some(item => 
      item.quantity_received < 0 || item.unit_cost_actual < 0
    );
    if (hasInvalidItems) {
      toast.error('Verifique os valores informados');
      return;
    }

    setIsSaving(true);
    try {
      // 1. Update each item with received quantities and actual costs
      for (const item of items) {
        const { error: itemError } = await supabase
          .from('purchase_order_items')
          .update({
            quantity_received: item.quantity_received,
            unit_cost_actual: item.unit_cost_actual,
          })
          .eq('id', item.id);
        
        if (itemError) throw itemError;

        // 2. Create stock_batch for each item that was received
        if (item.quantity_received > 0 && item.quality_status !== 'recusado') {
          const product = order.items?.find(i => i.id === item.id)?.product;
          const shelfLife = product?.shelf_life || 7;
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + shelfLife);

          const { error: batchError } = await supabase
            .from('stock_batches')
            .insert({
              product_id: item.product_id,
              quantity: item.quantity_received,
              cost_per_unit: item.unit_cost_actual,
              expiry_date: expiryDate.toISOString().split('T')[0],
              received_at: new Date().toISOString(),
            });

          if (batchError) throw batchError;
        }
      }

      // 3. Calculate total received
      const totalReceived = items.reduce(
        (sum, item) => sum + (item.quantity_received * item.unit_cost_actual),
        0
      );

      // 4. Update order status
      const { error: orderError } = await supabase
        .from('purchase_orders')
        .update({
          status: 'recebido',
          total_received: totalReceived,
          received_at: new Date().toISOString(),
          notes: generalNotes || order.notes,
        })
        .eq('id', order.id);

      if (orderError) throw orderError;

      toast.success('Recebimento confirmado! Estoque atualizado.');
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao confirmar recebimento:', error);
      toast.error('Erro: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const totalEstimated = items.reduce(
    (sum, item) => sum + (item.quantity_ordered * item.unit_cost_estimated),
    0
  );
  const totalActual = items.reduce(
    (sum, item) => sum + (item.quantity_received * item.unit_cost_actual),
    0
  );
  const difference = totalActual - totalEstimated;

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Conferência de Recebimento
          </DialogTitle>
          <div className="text-sm text-muted-foreground">
            Fornecedor: <strong>{order.supplier?.name}</strong> | 
            Pedido: <strong>#{order.id.slice(0, 8)}</strong>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Items Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-center w-28">
                    <div className="flex items-center justify-center gap-1">
                      <Scale className="h-4 w-4" />
                      Pedido
                    </div>
                  </TableHead>
                  <TableHead className="text-center w-32">
                    <div className="flex items-center justify-center gap-1">
                      <Scale className="h-4 w-4" />
                      Recebido
                    </div>
                  </TableHead>
                  <TableHead className="text-center w-32">
                    <div className="flex items-center justify-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      Custo Real
                    </div>
                  </TableHead>
                  <TableHead className="text-center w-32">Qualidade</TableHead>
                  <TableHead>Observação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(item => {
                  const qtyDiff = item.quantity_received - item.quantity_ordered;
                  const hasDiscrepancy = qtyDiff !== 0 || item.quality_status !== 'ok';
                  
                  return (
                    <TableRow 
                      key={item.id}
                      className={hasDiscrepancy ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''}
                    >
                      <TableCell className="font-medium">
                        {item.product_name}
                      </TableCell>
                      <TableCell className="text-center font-mono">
                        {item.quantity_ordered} kg
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.quantity_received}
                          onChange={(e) => updateItem(item.id, 'quantity_received', parseFloat(e.target.value) || 0)}
                          className="h-9 text-center font-mono"
                          min="0"
                          step="0.1"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.unit_cost_actual}
                          onChange={(e) => updateItem(item.id, 'unit_cost_actual', parseFloat(e.target.value) || 0)}
                          className="h-9 text-center font-mono"
                          min="0"
                          step="0.01"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={item.quality_status}
                          onValueChange={(v) => updateItem(item.id, 'quality_status', v as QualityStatus)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ok">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                OK
                              </div>
                            </SelectItem>
                            <SelectItem value="parcial">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                Parcial
                              </div>
                            </SelectItem>
                            <SelectItem value="recusado">
                              <div className="flex items-center gap-2">
                                <XCircle className="h-4 w-4 text-red-500" />
                                Recusado
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.quality_notes}
                          onChange={(e) => updateItem(item.id, 'quality_notes', e.target.value)}
                          className="h-9"
                          placeholder="Ex: Veio machucado"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Totals Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Estimado</p>
              <p className="text-xl font-bold font-mono">
                R$ {totalEstimated.toFixed(2)}
              </p>
            </div>
            <div className="p-4 bg-primary/10 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Valor Real</p>
              <p className="text-xl font-bold font-mono text-primary">
                R$ {totalActual.toFixed(2)}
              </p>
            </div>
            <div className={`p-4 rounded-lg text-center ${
              difference > 0 
                ? 'bg-red-100 dark:bg-red-900/20' 
                : difference < 0 
                  ? 'bg-green-100 dark:bg-green-900/20'
                  : 'bg-muted'
            }`}>
              <p className="text-sm text-muted-foreground">Diferença</p>
              <p className={`text-xl font-bold font-mono ${
                difference > 0 ? 'text-red-600' : difference < 0 ? 'text-green-600' : ''
              }`}>
                {difference > 0 ? '+' : ''} R$ {difference.toFixed(2)}
              </p>
            </div>
          </div>

          {/* General Notes */}
          <div>
            <Label>Observações Gerais do Recebimento</Label>
            <Textarea
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              placeholder="Notas sobre o recebimento em geral..."
              className="mt-1"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirmReceiving} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Confirmar Recebimento
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
