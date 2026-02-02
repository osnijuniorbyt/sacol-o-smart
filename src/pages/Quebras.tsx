import { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
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
} from '@/components/ui/dialog';
import { NumericInputModal } from '@/components/ui/numeric-input-modal';
import { useBreakages } from '@/hooks/useBreakages';
import { useProducts } from '@/hooks/useProducts';
import { useStock } from '@/hooks/useStock';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { useBarcode } from '@/hooks/useBarcode';
import { useIsMobile } from '@/hooks/use-mobile';
import { BreakageReason, BREAKAGE_REASON_LABELS } from '@/types/database';
import { Trash2, Plus, AlertTriangle, Barcode, Scale } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

// Separate component for notes to prevent scroll jumping during typing
function NotesTextarea({ 
  value, 
  onChange 
}: { 
  value: string; 
  onChange: (value: string) => void;
}) {
  const [localValue, setLocalValue] = useState(value);
  
  // Sync local value when parent value changes (e.g., form reset)
  useEffect(() => {
    setLocalValue(value);
  }, [value]);
  
  const handleBlur = () => {
    if (localValue !== value) {
      onChange(localValue);
    }
  };
  
  return (
    <Textarea
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      placeholder="Detalhes adicionais (opcional)..."
      rows={2}
      className="text-base"
      style={{ fontSize: '16px' }} // Prevent iOS zoom
    />
  );
}

export default function Quebras() {
  const { breakages, createBreakage, isLoading, getTotalLoss } = useBreakages();
  const { activeProducts, products, getProductByPlu } = useProducts();
  const { getBatchesByProduct } = useStock();
  const { parseEAN13 } = useBarcode();
  const isMobile = useIsMobile();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<{name: string; plu: string} | null>(null);
  const [numericModalOpen, setNumericModalOpen] = useState(false);
  const [numericValue, setNumericValue] = useState('');
  
  const [formData, setFormData] = useState({
    product_id: '',
    batch_id: '',
    quantity: '',
    reason: '' as BreakageReason | '',
    notes: ''
  });

  // Reset form when dialog closes
  useEffect(() => {
    if (!dialogOpen) {
      setFormData({
        product_id: '',
        batch_id: '',
        quantity: '',
        reason: '',
        notes: ''
      });
      setScannedProduct(null);
    }
  }, [dialogOpen]);

  // Handle barcode scan inside modal
  const handleScan = useCallback((barcode: string) => {
    if (!dialogOpen) return;
    
    const data = parseEAN13(barcode);
    if (data) {
      const product = getProductByPlu(data.plu);
      if (product) {
        setFormData(prev => ({
          ...prev,
          product_id: product.id,
          quantity: data.weight.toFixed(3),
          batch_id: ''
        }));
        setScannedProduct({ name: product.name, plu: product.plu });
        toast.success(`Produto escaneado: ${product.name}`);
      } else {
        toast.error(`Produto não encontrado: PLU ${data.plu}`);
      }
    } else {
      toast.error('Código de barras inválido');
    }
  }, [dialogOpen, parseEAN13, getProductByPlu]);

  // Scanner only active when modal is open
  useBarcodeScanner({
    onScan: handleScan,
    enabled: dialogOpen
  });

  const selectedProductBatches = formData.product_id 
    ? getBatchesByProduct(formData.product_id)
    : [];

  // Auto-select first batch (FIFO) when product changes
  useEffect(() => {
    if (formData.product_id && selectedProductBatches.length > 0 && !formData.batch_id) {
      setFormData(prev => ({ ...prev, batch_id: selectedProductBatches[0].id }));
    }
  }, [formData.product_id, selectedProductBatches]);

  const selectedBatch = selectedProductBatches.find(b => b.id === formData.batch_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.reason || !formData.product_id) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    await createBreakage.mutateAsync({
      product_id: formData.product_id,
      batch_id: formData.batch_id || undefined,
      quantity: parseFloat(formData.quantity),
      reason: formData.reason,
      notes: formData.notes || undefined
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
      case 'vencido': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'danificado': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'furto': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'erro_operacional': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  // Calculate estimated loss for preview
  const estimatedLoss = selectedBatch && formData.quantity 
    ? Number(selectedBatch.cost_per_unit) * parseFloat(formData.quantity || '0')
    : 0;

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Quebras</h1>
        <p className="text-muted-foreground">Registro de perdas e prejuízos</p>
      </div>

      {/* Summary */}
      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/20">
              <AlertTriangle className="h-7 w-7 text-destructive" />
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
          <CardContent className="py-12 text-center text-muted-foreground">
            <Trash2 className="mx-auto h-16 w-16 mb-4 opacity-50" />
            <p className="text-lg">Nenhuma quebra registrada</p>
            <p className="text-sm">Clique no botão vermelho para registrar uma perda</p>
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
                        {Number(breakage.quantity).toFixed(3)} {product?.unit || 'kg'} × {formatCurrency(Number(breakage.cost_per_unit))}
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

      {/* FAB - Floating Action Button */}
      <button
        onClick={() => setDialogOpen(true)}
        className="fixed bottom-6 right-6 h-16 w-16 rounded-full bg-destructive text-destructive-foreground shadow-lg hover:bg-destructive/90 transition-all hover:scale-105 flex items-center justify-center z-50"
        aria-label="Registrar Perda"
      >
        <Plus className="h-8 w-8" />
      </button>

      {/* Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md bg-background">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Registrar Perda
            </DialogTitle>
          </DialogHeader>

          {/* Scanner indicator */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Barcode className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Scanner Ativo</p>
              <p className="text-xs text-muted-foreground">
                {scannedProduct 
                  ? `Escaneado: ${scannedProduct.name}` 
                  : 'Escaneie o produto ou selecione manualmente'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Product Select */}
            <div className="space-y-2">
              <Label>Produto *</Label>
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
                  <SelectValue placeholder="Selecione ou escaneie o produto" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {activeProducts.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} (PLU: {product.plu})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Batch Select - Auto FIFO */}
            {selectedProductBatches.length > 0 && (
              <div className="space-y-2">
                <Label>Lote (custo dinâmico) *</Label>
                <Select
                  value={formData.batch_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, batch_id: value }))}
                  required
                >
                  <SelectTrigger className="h-14">
                    <SelectValue placeholder="Selecione o lote" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    {selectedProductBatches.map((batch, index) => (
                      <SelectItem key={batch.id} value={batch.id}>
                        Lote {index + 1} - {Number(batch.quantity).toFixed(3)} kg @ {formatCurrency(Number(batch.cost_per_unit))}/kg
                        {batch.expiry_date && ` (Val: ${format(new Date(batch.expiry_date), 'dd/MM')})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedBatch && (
                  <p className="text-xs text-muted-foreground">
                    Custo do lote: {formatCurrency(Number(selectedBatch.cost_per_unit))}/kg
                  </p>
                )}
              </div>
            )}

            {/* Weight Input */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Scale className="h-4 w-4" />
                Peso da Perda (KG) *
              </Label>
              {isMobile ? (
                <button
                  type="button"
                  onClick={() => {
                    setNumericValue(formData.quantity || '0');
                    setNumericModalOpen(true);
                  }}
                  className="w-full h-14 px-3 rounded-md border border-input bg-background text-left font-mono text-lg hover:bg-accent/50 transition-colors flex items-center justify-between"
                >
                  <span className={formData.quantity ? 'text-foreground' : 'text-muted-foreground'}>
                    {formData.quantity || '0.000'}
                  </span>
                  <span className="text-muted-foreground text-sm">kg</span>
                </button>
              ) : (
                <Input
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                  placeholder="0.000"
                  className="h-14 text-lg font-mono"
                  required
                />
              )}
            </div>

            <NumericInputModal
              open={numericModalOpen}
              onOpenChange={setNumericModalOpen}
              value={numericValue}
              onChange={setNumericValue}
              onConfirm={(value) => {
                setFormData(prev => ({ ...prev, quantity: value }));
              }}
              title="Peso da Perda"
              label="Quantidade"
              unit="kg"
              allowDecimal={true}
              maxDecimals={3}
              minValue={0.001}
            />

            {/* Reason Select */}
            <div className="space-y-2">
              <Label>Motivo *</Label>
              <Select
                value={formData.reason}
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  reason: value as BreakageReason 
                }))}
                required
              >
                <SelectTrigger className="h-14">
                  <SelectValue placeholder="Selecione o motivo" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="vencido">🍌 Amadureceu Demais</SelectItem>
                  <SelectItem value="danificado">📦 Veio Estragado do Fornecedor</SelectItem>
                  <SelectItem value="furto">🚨 Furto</SelectItem>
                  <SelectItem value="erro_operacional">⚠️ Erro Operacional</SelectItem>
                  <SelectItem value="outro">📝 Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Observações</Label>
              <NotesTextarea
                value={formData.notes}
                onChange={(notes) => setFormData(prev => ({ ...prev, notes }))}
              />
            </div>

            {/* Estimated Loss Preview */}
            {estimatedLoss > 0 && (
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-muted-foreground">Prejuízo Estimado</p>
                <p className="text-2xl font-bold text-destructive">
                  -{formatCurrency(estimatedLoss)}
                </p>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-16 text-lg" 
              variant="destructive" 
              disabled={createBreakage.isPending || !formData.product_id || !formData.reason || !formData.quantity}
            >
              {createBreakage.isPending ? 'Salvando...' : 'Registrar Perda'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
