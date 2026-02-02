import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '@/components/ui/drawer';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { NumericInputModal } from '@/components/ui/numeric-input-modal';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Loader2,
  Package,
  Scale,
  DollarSign
} from 'lucide-react';
import { PurchaseOrder } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { Input } from '@/components/ui/input';
import { ReceivingPhotos } from './ReceivingPhotos';

interface ReceivingPhoto {
  id?: string;
  url: string;
  fileName: string;
  isUploading?: boolean;
  isNew?: boolean;
}

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

const QUALITY_OPTIONS = [
  { value: 'ok', label: 'OK', icon: CheckCircle2, color: 'text-green-500' },
  { value: 'parcial', label: 'Parcial', icon: AlertTriangle, color: 'text-yellow-500' },
  { value: 'recusado', label: 'Recusado', icon: XCircle, color: 'text-red-500' },
];

// Separate component for notes input to prevent scroll jumping
// Uses local state and only syncs on blur
function ItemNotesInput({ 
  itemId, 
  initialValue, 
  onUpdate 
}: { 
  itemId: string; 
  initialValue: string; 
  onUpdate: (id: string, field: 'quality_notes', value: string) => void;
}) {
  const [localValue, setLocalValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Sync with parent only on blur to prevent scroll jumping
  const handleBlur = () => {
    if (localValue !== initialValue) {
      onUpdate(itemId, 'quality_notes', localValue);
    }
  };
  
  return (
    <Input
      ref={inputRef}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      className="h-11 text-base"
      placeholder="Observação do item..."
      style={{ fontSize: '16px' }} // Prevent iOS zoom
    />
  );
}

export function ReceivingDialog({ order, open, onOpenChange, onSuccess }: ReceivingDialogProps) {
  const isMobile = useIsMobile();
  const [items, setItems] = useState<ItemReceiving[]>([]);
  const [generalNotes, setGeneralNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [photos, setPhotos] = useState<ReceivingPhoto[]>([]);
  
  // Ref for scroll container to preserve position
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Store local notes state to avoid scroll issues during typing
  const localNotesRef = useRef<Map<string, string>>(new Map());
  
  // Numeric keypad modal state
  const [numericModal, setNumericModal] = useState<{
    open: boolean;
    itemId: string;
    field: 'quantity_received' | 'unit_cost_actual';
    value: string;
    title: string;
    unit: string;
    maxDecimals: number;
  }>({
    open: false,
    itemId: '',
    field: 'quantity_received',
    value: '',
    title: '',
    unit: '',
    maxDecimals: 2,
  });

  const openNumericModal = (
    itemId: string, 
    field: 'quantity_received' | 'unit_cost_actual',
    currentValue: number,
    productName: string
  ) => {
    const isQuantity = field === 'quantity_received';
    setNumericModal({
      open: true,
      itemId,
      field,
      value: currentValue > 0 ? currentValue.toString().replace('.', ',') : '',
      title: isQuantity ? `Qtd: ${productName}` : `Custo: ${productName}`,
      unit: isQuantity ? 'kg' : 'R$',
      maxDecimals: isQuantity ? 1 : 2,
    });
  };

  const handleNumericConfirm = (value: string) => {
    const numValue = parseFloat(value.replace(',', '.')) || 0;
    updateItem(numericModal.itemId, numericModal.field, numValue);
  };

  useEffect(() => {
    if (order?.items) {
      const newItems = order.items.map(item => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.product?.name || 'Produto',
        quantity_ordered: item.quantity,
        quantity_received: item.quantity,
        unit_cost_estimated: item.unit_cost_estimated || 0,
        unit_cost_actual: item.unit_cost_estimated || 0,
        quality_status: 'ok' as QualityStatus,
        quality_notes: '',
      }));
      setItems(newItems);
      setGeneralNotes('');
      setPhotos([]);
      localNotesRef.current.clear();
    }
  }, [order]);

  // Memoized update function that preserves scroll position
  const updateItem = useCallback((id: string, field: keyof ItemReceiving, value: any) => {
    // For text fields, just update local ref during typing
    if (field === 'quality_notes') {
      localNotesRef.current.set(id, value);
    }
    
    // Preserve scroll position before state update
    const scrollElement = scrollContainerRef.current;
    const scrollTop = scrollElement?.scrollTop || 0;
    
    setItems(prev => {
      const updated = prev.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      );
      
      // Restore scroll position after React's microtask
      if (scrollElement) {
        requestAnimationFrame(() => {
          scrollElement.scrollTop = scrollTop;
        });
      }
      
      return updated;
    });
  }, []);

  const handleConfirmReceiving = async () => {
    if (!order) return;

    const hasInvalidItems = items.some(item => 
      item.quantity_received < 0 || item.unit_cost_actual < 0
    );
    if (hasInvalidItems) {
      toast.error('Verifique os valores informados');
      return;
    }

    setIsSaving(true);
    try {
      for (const item of items) {
        const { error: itemError } = await supabase
          .from('purchase_order_items')
          .update({
            quantity_received: item.quantity_received,
            unit_cost_actual: item.unit_cost_actual,
          })
          .eq('id', item.id);
        
        if (itemError) throw itemError;

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

      const totalReceived = items.reduce(
        (sum, item) => sum + (item.quantity_received * item.unit_cost_actual),
        0
      );

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

      // Save photo references to database
      const newPhotos = photos.filter(p => p.isNew && !p.isUploading);
      if (newPhotos.length > 0) {
        const photoRecords = newPhotos.map(photo => ({
          order_id: order.id,
          photo_url: photo.url,
          file_name: photo.fileName,
          captured_at: new Date().toISOString(),
        }));

        const { error: photosError } = await supabase
          .from('receiving_photos')
          .insert(photoRecords);

        if (photosError) {
          console.error('Erro ao salvar referências das fotos:', photosError);
          // Don't fail the whole operation for photo errors
        }
      }

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

  // Content shared between Dialog and Drawer
  const ReceivingContent = () => (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header info */}
      <div className="px-4 py-2 bg-muted/50 text-sm flex-shrink-0">
        <span className="text-muted-foreground">Fornecedor: </span>
        <strong>{order.supplier?.name}</strong>
      </div>

      {/* Items List - Custom scroll container to preserve scroll position */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden px-4 overscroll-contain"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="space-y-3 py-4">
          {items.map(item => {
            const qtyDiff = item.quantity_received - item.quantity_ordered;
            const hasDiscrepancy = qtyDiff !== 0 || item.quality_status !== 'ok';
            
            return (
              <Card 
                key={item.id}
                className={hasDiscrepancy ? 'border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-900/10' : ''}
              >
                <CardContent className="p-4 space-y-3">
                  {/* Product name */}
                  <div className="font-semibold text-base">
                    {item.product_name}
                  </div>
                  
                  {/* Quantity row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground flex items-center gap-1">
                        <Scale className="h-3 w-3" />
                        Pedido
                      </Label>
                      <div className="font-mono text-lg mt-1">
                        {item.quantity_ordered} <span className="text-sm text-muted-foreground">kg</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground flex items-center gap-1">
                        <Scale className="h-3 w-3" />
                        Recebido
                      </Label>
                      {isMobile ? (
                        <button
                          type="button"
                          onClick={() => openNumericModal(item.id, 'quantity_received', item.quantity_received, item.product_name)}
                          className="w-full h-12 mt-1 px-3 rounded-md border border-input bg-background text-left font-mono text-lg hover:bg-accent transition-colors"
                        >
                          {item.quantity_received} <span className="text-sm text-muted-foreground">kg</span>
                        </button>
                      ) : (
                        <Input
                          type="number"
                          value={item.quantity_received}
                          onChange={(e) => updateItem(item.id, 'quantity_received', parseFloat(e.target.value) || 0)}
                          className="h-12 text-lg font-mono mt-1"
                          min="0"
                          step="0.1"
                        />
                      )}
                    </div>
                  </div>

                  {/* Cost and Quality row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        Custo Real
                      </Label>
                      {isMobile ? (
                        <button
                          type="button"
                          onClick={() => openNumericModal(item.id, 'unit_cost_actual', item.unit_cost_actual, item.product_name)}
                          className="w-full h-12 mt-1 px-3 rounded-md border border-input bg-background text-left font-mono text-lg hover:bg-accent transition-colors"
                        >
                          R$ {item.unit_cost_actual.toFixed(2)}
                        </button>
                      ) : (
                        <Input
                          type="number"
                          value={item.unit_cost_actual}
                          onChange={(e) => updateItem(item.id, 'unit_cost_actual', parseFloat(e.target.value) || 0)}
                          className="h-12 text-lg font-mono mt-1"
                          min="0"
                          step="0.01"
                        />
                      )}
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Qualidade</Label>
                      <Select
                        value={item.quality_status}
                        onValueChange={(v) => updateItem(item.id, 'quality_status', v as QualityStatus)}
                      >
                        <SelectTrigger className="h-12 mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover z-50">
                          {QUALITY_OPTIONS.map(opt => {
                            const Icon = opt.icon;
                            return (
                              <SelectItem key={opt.value} value={opt.value} className="py-3">
                                <div className="flex items-center gap-2">
                                  <Icon className={`h-5 w-5 ${opt.color}`} />
                                  {opt.label}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Notes - Using uncontrolled input to prevent scroll jumping */}
                  <ItemNotesInput
                    itemId={item.id}
                    initialValue={item.quality_notes}
                    onUpdate={updateItem}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Totals Summary - Fixed at bottom */}
      <div className="border-t bg-card p-4 space-y-3 pb-safe">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground">Estimado</p>
            <p className="text-sm font-bold font-mono">
              R$ {totalEstimated.toFixed(2)}
            </p>
          </div>
          <div className="p-2 bg-primary/10 rounded-lg">
            <p className="text-xs text-muted-foreground">Real</p>
            <p className="text-sm font-bold font-mono text-primary">
              R$ {totalActual.toFixed(2)}
            </p>
          </div>
          <div className={`p-2 rounded-lg ${
            difference > 0 
              ? 'bg-red-100 dark:bg-red-900/20' 
              : difference < 0 
                ? 'bg-green-100 dark:bg-green-900/20'
                : 'bg-muted'
          }`}>
            <p className="text-xs text-muted-foreground">Diferença</p>
            <p className={`text-sm font-bold font-mono ${
              difference > 0 ? 'text-red-600' : difference < 0 ? 'text-green-600' : ''
            }`}>
              {difference > 0 ? '+' : ''}{difference.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Receiving Photos */}
        {order && (
          <ReceivingPhotos
            orderId={order.id}
            photos={photos}
            onPhotosChange={setPhotos}
            disabled={isSaving}
          />
        )}

        {/* General Notes */}
        <Textarea
          value={generalNotes}
          onChange={(e) => setGeneralNotes(e.target.value)}
          placeholder="Observações gerais do recebimento..."
          className="min-h-[60px] text-base"
          rows={2}
          style={{ fontSize: '16px' }} // Prevent iOS zoom
        />
      </div>
    </div>
  );

  // Footer buttons
  const FooterButtons = () => (
    <div className="flex gap-2 w-full">
      <Button 
        variant="outline" 
        onClick={() => onOpenChange(false)}
        className="flex-1 h-14"
      >
        Cancelar
      </Button>
      <Button 
        onClick={handleConfirmReceiving} 
        disabled={isSaving}
        className="flex-1 h-14"
      >
        {isSaving ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Salvando...
          </>
        ) : (
          <>
            <CheckCircle2 className="mr-2 h-5 w-5" />
            Confirmar
          </>
        )}
      </Button>
    </div>
  );

  // Mobile: use Drawer
  if (isMobile) {
    return (
      <>
        <Drawer open={open} onOpenChange={onOpenChange}>
          <DrawerContent className="h-[95vh] flex flex-col">
            <DrawerHeader className="border-b pb-3">
              <DrawerTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Conferência de Recebimento
              </DrawerTitle>
            </DrawerHeader>
            
            <ReceivingContent />
            
            <DrawerFooter className="border-t pt-3">
              <FooterButtons />
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
        
        <NumericInputModal
          open={numericModal.open}
          onOpenChange={(open) => setNumericModal(prev => ({ ...prev, open }))}
          value={numericModal.value}
          onChange={(value) => setNumericModal(prev => ({ ...prev, value }))}
          onConfirm={handleNumericConfirm}
          title={numericModal.title}
          unit={numericModal.unit}
          maxDecimals={numericModal.maxDecimals}
          allowDecimal={true}
        />
      </>
    );
  }

  // Desktop: use Dialog
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Conferência de Recebimento
          </DialogTitle>
        </DialogHeader>
        
        <ReceivingContent />
        
        <DialogFooter className="p-4 border-t">
          <FooterButtons />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
