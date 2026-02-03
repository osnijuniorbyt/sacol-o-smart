import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Minus, Trash2, Save, Loader2, Undo2 } from 'lucide-react';
import { PurchaseOrder } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();
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

  // Content shared between Dialog and Drawer
  const EditContent = () => (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-3 py-4">
          {activeItems.map(item => (
            <Card key={item.id}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-medium text-sm flex-1 truncate">
                    {item.product_name}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive shrink-0"
                    onClick={() => handleRemoveItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* Quantity controls */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10"
                      onClick={() => handleQuantityChange(item.id, -1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-10 text-center font-mono text-lg">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10"
                      onClick={() => handleQuantityChange(item.id, 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground ml-1">cx</span>
                  </div>
                  
                  {/* Price input */}
                  <div className="flex items-center gap-1 flex-1 justify-end">
                    <span className="text-sm text-muted-foreground">R$</span>
                    <Input
                      inputMode="decimal"
                      className="w-20 h-10 text-right font-mono"
                      value={item.unit_cost ?? ''}
                      onChange={(e) => handlePriceChange(item.id, e.target.value)}
                      placeholder="0,00"
                    />
                  </div>
                </div>
                
                {item.unit_cost && (
                  <div className="text-right text-xs text-muted-foreground mt-2">
                    Subtotal: R$ {(item.quantity * item.unit_cost).toFixed(2)}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {deletedItems.length > 0 && (
            <div className="pt-3 border-t mt-4">
              <p className="text-sm text-muted-foreground mb-2">Itens removidos:</p>
              <div className="space-y-2">
                {deletedItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                    <span className="text-sm text-muted-foreground line-through">{item.product_name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1"
                      onClick={() => handleRestoreItem(item.id)}
                    >
                      <Undo2 className="h-3 w-3" />
                      Restaurar
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Total summary */}
      <div className="border-t p-4 bg-muted/30">
        <div className="flex justify-between items-center">
          <span className="font-medium">Total Estimado:</span>
          <span className="text-xl font-bold font-mono">
            R$ {total.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );

  // Footer buttons
  const FooterButtons = () => (
    <div className="flex gap-2 w-full">
      <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 h-12">
        Cancelar
      </Button>
      <Button onClick={handleSave} disabled={isSaving} className="flex-1 h-12">
        {isSaving ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Save className="mr-2 h-4 w-4" />
        )}
        Salvar
      </Button>
    </div>
  );

  // Mobile: use Drawer
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[85vh] flex flex-col">
          <DrawerHeader className="border-b pb-3">
            <DrawerTitle className="flex items-center gap-2">
              Editar Pedido
              <Badge variant="outline">{order.supplier?.name}</Badge>
            </DrawerTitle>
          </DrawerHeader>
          
          <EditContent />
          
          <DrawerFooter className="border-t pt-3 fixed-bottom-safe">
            <FooterButtons />
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: use Dialog
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            Editar Pedido
            <Badge variant="outline">{order.supplier?.name}</Badge>
          </DialogTitle>
        </DialogHeader>
        
        <EditContent />
        
        <DialogFooter className="p-4 border-t gap-2 sm:gap-0">
          <FooterButtons />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
