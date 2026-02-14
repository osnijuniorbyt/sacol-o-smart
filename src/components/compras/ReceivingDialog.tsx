import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { NumericInputModal } from '@/components/ui/numeric-input-modal';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Loader2,
  Package,
  Save,
  ChevronDown,
  ChevronRight,
  StickyNote,
  Box
} from 'lucide-react';
import { PurchaseOrder, UnitType, UNIT_LABELS } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { Input } from '@/components/ui/input';
import { ReceivingPhotos } from './ReceivingPhotos';
import { useReceivingDraft, DraftItemData } from '@/hooks/useReceivingDraft';
import { usePackagings } from '@/hooks/usePackagings';

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
  product_unit: UnitType;
  quantity_ordered: number;
  quantity_received: number;
  unit_cost_estimated: number;
  unit_cost_actual: number;
  quality_status: QualityStatus;
  quality_notes: string;
  packaging_id: string | null;
  peso_bruto: number;
  qtd_volumes: number;
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

// Short unit labels for compact display
const UNIT_SHORT: Record<UnitType, string> = {
  kg: 'kg',
  un: 'un',
  maco: 'mç',
  bandeja: 'bd',
  caixa: 'cx',
  engradado: 'eng',
  saco: 'sc',
  penca: 'pc',
};

export function ReceivingDialog({ order, open, onOpenChange, onSuccess }: ReceivingDialogProps) {
  const isMobile = useIsMobile();
  const { activePackagings } = usePackagings();
  const [items, setItems] = useState<ItemReceiving[]>([]);
  const [generalNotes, setGeneralNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [photos, setPhotos] = useState<ReceivingPhoto[]>([]);
  const [showDraftDialog, setShowDraftDialog] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  
  // Flag to skip auto-save right after clearing draft (prevents re-creating it immediately)
  const skipNextAutoSaveRef = useRef(false);
  
  // Auto-save hook
  const { hasDraft, lastSaved, loadDraft, saveDraft, clearDraft } = useReceivingDraft(order?.id);
  
  // Ref for scroll container to preserve position
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Store local notes state to avoid scroll issues during typing
  const localNotesRef = useRef<Map<string, string>>(new Map());
  
  // Numeric keypad modal state
  const [numericModal, setNumericModal] = useState<{
    open: boolean;
    itemId: string;
    field: 'quantity_received' | 'unit_cost_actual' | 'peso_bruto' | 'qtd_volumes';
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
    field: 'quantity_received' | 'unit_cost_actual' | 'peso_bruto' | 'qtd_volumes',
    currentValue: number,
    productName: string,
    productUnit: UnitType
  ) => {
    const isQuantity = field === 'quantity_received';
    const isPesoBruto = field === 'peso_bruto';
    const isQtdVolumes = field === 'qtd_volumes';
    setNumericModal({
      open: true,
      itemId,
      field,
      value: currentValue > 0 ? currentValue.toString().replace('.', ',') : '',
      title: isPesoBruto ? `Peso Bruto: ${productName}` : 
             isQtdVolumes ? `Qtd Volumes: ${productName}` :
             (isQuantity ? `Qtd: ${productName}` : `Custo: ${productName}`),
      unit: isPesoBruto ? 'kg' : (isQtdVolumes ? 'vol' : (isQuantity ? UNIT_SHORT[productUnit] : 'R$')),
      maxDecimals: (isPesoBruto ? 3 : (isQtdVolumes ? 0 : (isQuantity ? 1 : 2))),
    });
  };

  const handleNumericConfirm = (value: string) => {
    const numValue = parseFloat(value.replace(',', '.')) || 0;
    updateItem(numericModal.itemId, numericModal.field, numValue);
  };

  // Initialize items from order
  const initializeFromOrder = useCallback(() => {
    if (!order?.items) return [];
    
    return order.items.map(item => ({
      id: item.id,
      product_id: item.product_id,
      product_name: item.product?.name || 'Produto',
      product_unit: (item.product?.unit || 'kg') as UnitType,
      quantity_ordered: item.quantity,
      quantity_received: item.quantity,
      unit_cost_estimated: item.unit_cost_estimated || 0,
      unit_cost_actual: item.unit_cost_estimated || 0,
      quality_status: 'ok' as QualityStatus,
      quality_notes: '',
      packaging_id: item.packaging_id || null,
      peso_bruto: item.estimated_kg || 0,
      qtd_volumes: item.quantity || 0,
    }));
  }, [order]);

  // Restore from draft
  const restoreFromDraft = useCallback(() => {
    const draft = loadDraft();
    if (!draft || !order?.items) return;
    
    // Map draft data to items while preserving product info from order
    const restoredItems = order.items.map(orderItem => {
      const draftItem = draft.items.find(d => d.id === orderItem.id);
      
      if (draftItem) {
        return {
          id: orderItem.id,
          product_id: orderItem.product_id,
          product_name: orderItem.product?.name || 'Produto',
          product_unit: (orderItem.product?.unit || 'kg') as UnitType,
          quantity_ordered: orderItem.quantity,
          quantity_received: draftItem.quantity_received,
          unit_cost_estimated: orderItem.unit_cost_estimated || 0,
          unit_cost_actual: draftItem.unit_cost_actual,
          quality_status: draftItem.quality_status,
          quality_notes: draftItem.quality_notes,
          packaging_id: orderItem.packaging_id || null,
          peso_bruto: draftItem.peso_bruto ?? orderItem.estimated_kg ?? 0,
          qtd_volumes: draftItem.qtd_volumes ?? orderItem.quantity ?? 0,
        };
      }
      
      // If item not in draft, use order defaults
      return {
        id: orderItem.id,
        product_id: orderItem.product_id,
        product_name: orderItem.product?.name || 'Produto',
        product_unit: (orderItem.product?.unit || 'kg') as UnitType,
        quantity_ordered: orderItem.quantity,
        quantity_received: orderItem.quantity,
        unit_cost_estimated: orderItem.unit_cost_estimated || 0,
        unit_cost_actual: orderItem.unit_cost_estimated || 0,
        quality_status: 'ok' as QualityStatus,
        quality_notes: '',
        packaging_id: orderItem.packaging_id || null,
        peso_bruto: orderItem.estimated_kg || 0,
        qtd_volumes: orderItem.quantity || 0,
      };
    });
    
    setItems(restoredItems);
    setGeneralNotes(draft.generalNotes || '');
    setIsInitialized(true);
    setShowDraftDialog(false);
    toast.success('Rascunho restaurado!');
  }, [loadDraft, order]);

  // Start fresh (discard draft)
  const startFresh = useCallback(() => {
    // Set flag to skip the next auto-save (prevents re-creating draft immediately)
    skipNextAutoSaveRef.current = true;
    clearDraft();
    setItems(initializeFromOrder());
    setGeneralNotes('');
    setPhotos([]);
    localNotesRef.current.clear();
    setIsInitialized(true);
    setShowDraftDialog(false);
  }, [clearDraft, initializeFromOrder]);

  // Handle dialog open - only check draft on initial open
  useEffect(() => {
    if (open && order?.items && !isInitialized) {
      // Only check for draft on initial dialog open
      if (hasDraft) {
        setShowDraftDialog(true);
      } else {
        startFresh();
      }
    }
    
    if (!open) {
      setIsInitialized(false);
      setShowDraftDialog(false);
    }
  }, [open, order?.items?.length, hasDraft, isInitialized, startFresh]);

  // Auto-save when items or notes change
  useEffect(() => {
    if (!isInitialized || !order?.id) return;
    
    // Skip auto-save if flag is set (after startFresh to prevent re-creating draft)
    if (skipNextAutoSaveRef.current) {
      skipNextAutoSaveRef.current = false;
      return;
    }
    
    const draftItems: DraftItemData[] = items.map(item => ({
      id: item.id,
      quantity_received: item.quantity_received,
      unit_cost_actual: item.unit_cost_actual,
      quality_status: item.quality_status,
      quality_notes: item.quality_notes,
      peso_bruto: item.peso_bruto,
      qtd_volumes: item.qtd_volumes,
    }));
    
    saveDraft(draftItems, generalNotes);
  }, [items, generalNotes, isInitialized, order?.id, saveDraft]);

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

        // NOTA: stock_batches NÃO são criados aqui
        // A criação ocorre no ClosingProtocolDialog com custo real por kg
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
        }
      }

      // Clear draft after successful save
      clearDraft();

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

  // Format last saved time
  const formatLastSaved = (date: Date | null) => {
    if (!date) return null;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    
    if (diffSec < 5) return 'agora';
    if (diffSec < 60) return `${diffSec}s atrás`;
    const diffMin = Math.floor(diffSec / 60);
    return `${diffMin}min atrás`;
  };

  if (!order) return null;

  // Content shared between Dialog and Drawer — inlined as JSX variable (not a function component)
  // to prevent React from remounting the entire tree on every state change
  const receivingContent = (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header info */}
      <div className="px-4 py-2 bg-muted/50 text-sm flex-shrink-0 flex items-center justify-between">
        <div>
          <span className="text-muted-foreground">Fornecedor: </span>
          <strong>{order.supplier?.name}</strong>
        </div>
        {lastSaved && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Save className="h-3 w-3" />
            <span>Salvo {formatLastSaved(lastSaved)}</span>
          </div>
        )}
      </div>

      {/* Items List */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden px-4 overscroll-contain"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="space-y-3 py-3">
          {items.map(item => {
            const qtyDiff = item.quantity_received - item.quantity_ordered;
            const hasDiscrepancy = qtyDiff !== 0 || item.quality_status !== 'ok';
            const unitLabel = UNIT_SHORT[item.product_unit] || item.product_unit;
            
            return (
              <Card 
                key={item.id}
                className={hasDiscrepancy ? 'border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-900/10' : ''}
              >
                <CardContent className="p-3 space-y-2">
                  {/* Product name */}
                  <div className="font-semibold text-sm truncate">
                    {item.product_name}
                  </div>
                  
                  {/* Row 1: Pedido, Recebido, Custo */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Pedido</Label>
                      <div className="font-mono text-sm">
                        {item.quantity_ordered} <span className="text-[10px] text-muted-foreground">{unitLabel}</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Recebido</Label>
                      {isMobile ? (
                        <button
                          type="button"
                          onClick={() => openNumericModal(item.id, 'quantity_received', item.quantity_received, item.product_name, item.product_unit)}
                          className="w-full h-10 px-2 rounded-md border border-input bg-background text-left font-mono text-sm hover:bg-accent transition-colors"
                        >
                          {item.quantity_received} <span className="text-[10px] text-muted-foreground">{unitLabel}</span>
                        </button>
                      ) : (
                        <Input
                          type="text"
                          inputMode="decimal"
                          pattern="[0-9]*[.,]?[0-9]*"
                          value={item.quantity_received}
                          onChange={(e) => {
                            const val = e.target.value.replace(',', '.');
                            if (val === '' || /^[0-9]*\.?[0-9]*$/.test(val)) {
                              updateItem(item.id, 'quantity_received', parseFloat(val) || 0);
                            }
                          }}
                          className="h-10 text-sm font-mono"
                        />
                      )}
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Custo/{unitLabel}</Label>
                      {isMobile ? (
                        <button
                          type="button"
                          onClick={() => openNumericModal(item.id, 'unit_cost_actual', item.unit_cost_actual, item.product_name, item.product_unit)}
                          className="w-full h-10 px-2 rounded-md border border-input bg-background text-left font-mono text-sm hover:bg-accent transition-colors"
                        >
                          R$ {item.unit_cost_actual.toFixed(2)}
                        </button>
                      ) : (
                        <Input
                          type="text"
                          inputMode="decimal"
                          pattern="[0-9]*[.,]?[0-9]*"
                          value={item.unit_cost_actual}
                          onChange={(e) => {
                            const val = e.target.value.replace(',', '.');
                            if (val === '' || /^[0-9]*\.?[0-9]*$/.test(val)) {
                              updateItem(item.id, 'unit_cost_actual', parseFloat(val) || 0);
                            }
                          }}
                          className="h-10 text-sm font-mono"
                        />
                      )}
                    </div>
                  </div>

                  {/* Row 2: Qualidade e Vasilhame */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Qualidade</Label>
                      <Select
                        value={item.quality_status}
                        onValueChange={(v) => updateItem(item.id, 'quality_status', v as QualityStatus)}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover z-50">
                          {QUALITY_OPTIONS.map(opt => {
                            const Icon = opt.icon;
                            return (
                              <SelectItem key={opt.value} value={opt.value} className="py-2">
                                <div className="flex items-center gap-2">
                                  <Icon className={`h-4 w-4 ${opt.color}`} />
                                  {opt.label}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Box className="h-3 w-3" />
                        Vasilhame
                      </Label>
                      <Select
                        value={item.packaging_id || '__none__'}
                        onValueChange={(v) => updateItem(item.id, 'packaging_id', v === '__none__' ? null : v)}
                      >
                        <SelectTrigger className="h-10 font-mono font-medium">
                          <SelectValue placeholder="Selecione">
                            {item.packaging_id && (() => {
                              const pkg = activePackagings.find(p => p.id === item.packaging_id);
                              if (!pkg) return 'Selecione';
                              const displayCode = pkg.codigo || pkg.name.slice(0, 6).toUpperCase();
                              return displayCode;
                            })()}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="bg-popover z-50">
                          <SelectItem value="__none__">Nenhum</SelectItem>
                          {activePackagings.map(pkg => {
                            const displayCode = pkg.codigo || pkg.name.slice(0, 6).toUpperCase();
                            const materialIcon = { plastico: '🧊', madeira: '🪵', papelao: '📦', isopor: '❄️' }[pkg.material] || '📦';
                            return (
                              <SelectItem key={pkg.id} value={pkg.id} className="py-2">
                                <div className="flex flex-col">
                                  <span className="font-mono font-bold text-sm">
                                    {materialIcon} {displayCode}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {pkg.name} • {pkg.peso_liquido}kg/vol
                                  </span>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Row 3: Peso Bruto, Tara, Qtd Volumes, Líquido */}
                  {(() => {
                    const selectedPkg = activePackagings.find(p => p.id === item.packaging_id);
                    const taraUnitaria = selectedPkg?.tare_weight || 0;
                    const taraTotal = taraUnitaria * item.qtd_volumes;
                    const pesoLiquido = Math.max(0, item.peso_bruto - taraTotal);
                    
                    return (
                      <div className="grid grid-cols-4 gap-2 pt-1 border-t border-dashed">
                        <div>
                          <Label className="text-[10px] text-muted-foreground">Bruto (kg)</Label>
                          {isMobile ? (
                            <button
                              type="button"
                              onClick={() => openNumericModal(item.id, 'peso_bruto', item.peso_bruto, item.product_name, item.product_unit)}
                              className="w-full h-10 px-2 rounded-md border border-input bg-background text-left font-mono text-sm hover:bg-accent transition-colors"
                            >
                              {item.peso_bruto.toFixed(2)}
                            </button>
                          ) : (
                            <Input
                              type="text"
                              inputMode="decimal"
                              pattern="[0-9]*[.,]?[0-9]*"
                              value={item.peso_bruto}
                              onChange={(e) => {
                                const val = e.target.value.replace(',', '.');
                                if (val === '' || /^[0-9]*\.?[0-9]*$/.test(val)) {
                                  updateItem(item.id, 'peso_bruto', parseFloat(val) || 0);
                                }
                              }}
                              className="h-10 text-sm font-mono"
                            />
                          )}
                        </div>
                        <div>
                          <Label className="text-[10px] text-muted-foreground">Tara (kg)</Label>
                          <div className="h-10 flex items-center font-mono text-sm text-muted-foreground">
                            {taraUnitaria.toFixed(1)}
                          </div>
                        </div>
                        <div>
                          <Label className="text-[10px] text-muted-foreground">Volumes</Label>
                          {isMobile ? (
                            <button
                              type="button"
                              onClick={() => openNumericModal(item.id, 'qtd_volumes', item.qtd_volumes, item.product_name, item.product_unit)}
                              className="w-full h-10 px-2 rounded-md border border-input bg-background text-left font-mono text-sm hover:bg-accent transition-colors"
                            >
                              {item.qtd_volumes}
                            </button>
                          ) : (
                            <Input
                              type="number"
                              inputMode="numeric"
                              value={item.qtd_volumes}
                              onChange={(e) => {
                                updateItem(item.id, 'qtd_volumes', parseInt(e.target.value) || 0);
                              }}
                              className="h-10 text-sm font-mono"
                            />
                          )}
                        </div>
                        <div>
                          <Label className="text-[10px] text-muted-foreground font-semibold text-primary">Líquido</Label>
                          <div className="h-10 flex items-center font-mono text-sm font-bold text-primary">
                            {pesoLiquido.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Footer Summary - Compact */}
      <div className="border-t bg-card px-4 py-2 space-y-2 pb-safe flex-shrink-0">
        {/* Totals row */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-1.5 bg-muted rounded">
            <p className="text-[10px] text-muted-foreground">Estimado</p>
            <p className="text-xs font-bold font-mono">R$ {totalEstimated.toFixed(2)}</p>
          </div>
          <div className="p-1.5 bg-primary/10 rounded">
            <p className="text-[10px] text-muted-foreground">Real</p>
            <p className="text-xs font-bold font-mono text-primary">R$ {totalActual.toFixed(2)}</p>
          </div>
          <div className={`p-1.5 rounded ${
            difference > 0 ? 'bg-red-100 dark:bg-red-900/20' 
              : difference < 0 ? 'bg-green-100 dark:bg-green-900/20' : 'bg-muted'
          }`}>
            <p className="text-[10px] text-muted-foreground">Diferença</p>
            <p className={`text-xs font-bold font-mono ${
              difference > 0 ? 'text-red-600' : difference < 0 ? 'text-green-600' : ''
            }`}>
              {difference > 0 ? '+' : ''}{difference.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Photos row - Compact (max 40px) */}
        {order && (
          <ReceivingPhotos
            orderId={order.id}
            photos={photos}
            onPhotosChange={setPhotos}
            disabled={isSaving}
          />
        )}

        {/* Notes - Collapsible */}
        <Collapsible open={notesOpen} onOpenChange={setNotesOpen}>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 w-full py-1.5 px-2 text-sm text-muted-foreground hover:text-foreground rounded border border-dashed border-muted-foreground/30 hover:border-muted-foreground/50 transition-colors"
            >
              {notesOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <StickyNote className="h-4 w-4" />
              <span>Observações gerais</span>
              {generalNotes && !notesOpen && (
                <span className="ml-auto text-xs text-primary">✓</span>
              )}
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Textarea
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              placeholder="Observações gerais do recebimento..."
              className="min-h-[60px] text-base mt-2"
              rows={2}
              style={{ fontSize: '16px' }}
            />
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );

  // Footer buttons
  const footerButtons = (
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

  // Draft recovery dialog
  const draftRecoveryDialog = (
    <AlertDialog open={showDraftDialog} onOpenChange={setShowDraftDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5 text-primary" />
            Conferência em andamento
          </AlertDialogTitle>
          <AlertDialogDescription>
            Você tem uma conferência não finalizada para este pedido. Deseja continuar de onde parou ou começar do zero?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={startFresh} className="w-full sm:w-auto">
            Começar do zero
          </AlertDialogCancel>
          <AlertDialogAction onClick={restoreFromDraft} className="w-full sm:w-auto">
            Continuar conferência
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  // Mobile: use Drawer
  if (isMobile) {
    return (
      <>
        {draftRecoveryDialog}
        
        <Drawer open={open && isInitialized} onOpenChange={onOpenChange}>
          <DrawerContent className="h-[95vh] flex flex-col">
            <DrawerHeader className="border-b pb-3">
              <DrawerTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Conferência de Recebimento
              </DrawerTitle>
            </DrawerHeader>
            
            {receivingContent}
            
            <DrawerFooter className="border-t pt-3 fixed-bottom-safe">
              {footerButtons}
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
    <>
      {draftRecoveryDialog}
      
      <Dialog open={open && isInitialized} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Conferência de Recebimento
            </DialogTitle>
          </DialogHeader>
          
          {receivingContent}
          
          <DialogFooter className="p-4 border-t">
            {footerButtons}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
