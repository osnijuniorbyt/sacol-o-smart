import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerFooter,
} from '@/components/ui/drawer';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { Supplier } from '@/hooks/useSuppliers';
import { Product } from '@/types/database';
import { ProductImage } from '@/components/ui/product-image';
import { 
  Lightbulb, 
  Loader2, 
  Building2, 
  TrendingUp,
  Package,
  AlertTriangle,
  Check,
  Minus,
  Plus,
  MessageCircle,
  FileText,
  Share2
} from 'lucide-react';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ProductCategory } from '@/types/database';

interface SuggestedItem {
  product_id: string;
  product_name: string;
  product_image: string | null;
  product_category: ProductCategory;
  avg_daily_sales: number;
  current_stock: number;
  days_of_stock: number;
  suggested_qty: number;
  last_price: number | null;
}

interface SuggestedOrderDialogProps {
  suppliers: Supplier[];
  products: Product[];
  onApplySuggestion: (items: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    unit_cost: number | null;
  }>, supplierId: string) => void;
}

export function SuggestedOrderDialog({ 
  suppliers, 
  products,
  onApplySuggestion 
}: SuggestedOrderDialogProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestedItem[]>([]);
  const [daysToAnalyze, setDaysToAnalyze] = useState(7);
  const [daysToStock, setDaysToStock] = useState(7);

  useEffect(() => {
    if (selectedSupplier && open) {
      calculateSuggestions();
    }
  }, [selectedSupplier, daysToAnalyze, daysToStock]);

  const calculateSuggestions = async () => {
    if (!selectedSupplier) return;
    
    setIsLoading(true);
    try {
      // Busca produtos do histórico de compras (supplier_product_associations)
      // Esta é a mesma fonte usada pelo NewOrderForm
      const { data: supplierProductsData, error: spaError } = await supabase
        .rpc('get_supplier_products', { p_supplier_id: selectedSupplier });
      
      if (spaError) throw spaError;
      
      const supplierProductIds = (supplierProductsData || []).map((sp: any) => sp.product_id);
      
      if (supplierProductIds.length === 0) {
        setSuggestions([]);
        toast.info('Este fornecedor não possui histórico de compras');
        setIsLoading(false);
        return;
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysToAnalyze);
      
      const { data: salesData, error: salesError } = await supabase
        .from('sale_items')
        .select('product_id, quantity, created_at')
        .in('product_id', supplierProductIds)
        .gte('created_at', startDate.toISOString());
      
      if (salesError) throw salesError;

      const { data: stockData, error: stockError } = await supabase
        .from('stock_batches')
        .select('product_id, quantity')
        .in('product_id', supplierProductIds)
        .gt('quantity', 0);
      
      if (stockError) throw stockError;

      const salesByProduct: Record<string, number> = {};
      salesData?.forEach(sale => {
        salesByProduct[sale.product_id] = (salesByProduct[sale.product_id] || 0) + Number(sale.quantity);
      });

      const stockByProduct: Record<string, number> = {};
      stockData?.forEach(batch => {
        stockByProduct[batch.product_id] = (stockByProduct[batch.product_id] || 0) + Number(batch.quantity);
      });

      // Mapeia os dados do histórico com vendas e estoque
      const suggestedItems: SuggestedItem[] = (supplierProductsData || []).map((sp: any) => {
        const product = products.find(p => p.id === sp.product_id);
        const totalSold = salesByProduct[sp.product_id] || 0;
        const avgDaily = totalSold / daysToAnalyze;
        const currentStock = stockByProduct[sp.product_id] || 0;
        const daysOfStock = avgDaily > 0 ? currentStock / avgDaily : 999;
        
        const neededKg = Math.max(0, (avgDaily * daysToStock) - currentStock);
        const pesoPorUnidade = product?.peso_por_unidade || 22;
        const suggestedBoxes = Math.ceil(neededKg / pesoPorUnidade);
        
        return {
          product_id: sp.product_id,
          product_name: sp.product_name,
          product_image: product?.image_url || null,
          product_category: product?.category || 'outros' as ProductCategory,
          avg_daily_sales: avgDaily,
          current_stock: currentStock,
          days_of_stock: daysOfStock,
          suggested_qty: suggestedBoxes,
          last_price: sp.ultimo_preco || null,
        };
      });

      suggestedItems.sort((a, b) => a.days_of_stock - b.days_of_stock);

      setSuggestions(suggestedItems);
    } catch (error: any) {
      console.error('Erro ao calcular sugestões:', error);
      toast.error('Erro ao calcular sugestões: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setSuggestions(prev => 
      prev.map(item => 
        item.product_id === productId 
          ? { ...item, suggested_qty: Math.max(0, item.suggested_qty + delta) }
          : item
      )
    );
  };

  const handleSetQuantity = (productId: string, value: number) => {
    setSuggestions(prev => 
      prev.map(item => 
        item.product_id === productId 
          ? { ...item, suggested_qty: Math.max(0, value) }
          : item
      )
    );
  };

  const handleApply = () => {
    const itemsToApply = suggestions
      .filter(s => s.suggested_qty > 0)
      .map(s => ({
        product_id: s.product_id,
        product_name: s.product_name,
        quantity: s.suggested_qty,
        unit_cost: s.last_price,
      }));

    if (itemsToApply.length === 0) {
      toast.warning('Nenhum item com quantidade > 0');
      return;
    }

    onApplySuggestion(itemsToApply, selectedSupplier);
    setOpen(false);
    toast.success(`${itemsToApply.length} itens adicionados ao pedido`);
  };

  const getSupplierName = () => {
    return suppliers.find(s => s.id === selectedSupplier)?.name || 'Fornecedor';
  };

  const getSupplierPhone = () => {
    const supplier = suppliers.find(s => s.id === selectedSupplier);
    if (!supplier?.phone) return null;
    
    // Remove tudo que não é número
    const cleanPhone = supplier.phone.replace(/\D/g, '');
    
    // Se já tem 55 no início, retorna como está
    if (cleanPhone.startsWith('55') && cleanPhone.length >= 12) {
      return cleanPhone;
    }
    
    // Adiciona 55 se necessário
    if (cleanPhone.length >= 10) {
      return `55${cleanPhone}`;
    }
    
    return null;
  };

  const handleExportWhatsApp = () => {
    const itemsToExport = suggestions.filter(s => s.suggested_qty > 0);
    if (itemsToExport.length === 0) {
      toast.warning('Nenhum item para exportar');
      return;
    }

    const supplierName = getSupplierName();
    const supplierPhone = getSupplierPhone();
    const date = new Date().toLocaleDateString('pt-BR');
    const storeName = 'Hortifruti'; // Nome da loja
    
    // Cabeçalho limpo
    let message = `*PEDIDO DE COMPRA*\n`;
    message += `${storeName} • ${date}\n`;
    message += `Fornecedor: ${supplierName}\n`;
    message += `─────────────────\n\n`;
    
    // Lista numerada de produtos
    itemsToExport.forEach((item, index) => {
      message += `${index + 1}. ${item.product_name} — ${item.suggested_qty} cx\n`;
    });
    
    // Total de caixas
    message += `\n─────────────────\n`;
    message += `*TOTAL: ${totalBoxes} caixas*\n`;
    message += `(${itemsToExport.length} produtos)\n\n`;
    
    // Rodapé pedindo confirmação
    message += `Por favor, confirme disponibilidade e previsão de entrega. Obrigado!`;

    const encodedMessage = encodeURIComponent(message);
    
    // Se tem telefone cadastrado, abre direto para o número
    if (supplierPhone) {
      window.open(`https://wa.me/${supplierPhone}?text=${encodedMessage}`, '_blank');
      toast.success('Abrindo WhatsApp do fornecedor');
    } else {
      // Sem telefone, abre WhatsApp para usuário escolher contato
      window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
      toast.info('Fornecedor sem telefone cadastrado - selecione o contato');
    }
  };

  const handleExportPDF = () => {
    const itemsToExport = suggestions.filter(s => s.suggested_qty > 0);
    if (itemsToExport.length === 0) {
      toast.warning('Nenhum item para exportar');
      return;
    }

    const supplierName = getSupplierName();
    const date = new Date().toLocaleDateString('pt-BR');
    const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('PEDIDO DE COMPRA', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fornecedor: ${supplierName}`, 14, 35);
    doc.text(`Data: ${date} às ${time}`, 14, 42);
    doc.text(`Análise: últimos ${daysToAnalyze} dias • Estoque para ${daysToStock} dias`, 14, 49);
    
    // Line separator
    doc.setDrawColor(200);
    doc.line(14, 54, 196, 54);

    // Table data
    const tableData = itemsToExport.map((item, index) => [
      index + 1,
      item.product_name,
      `${item.suggested_qty} cx`,
      item.last_price ? `R$ ${item.last_price.toFixed(2)}` : '-',
      item.last_price ? `R$ ${(item.suggested_qty * item.last_price).toFixed(2)}` : '-'
    ]);

    // Add table
    autoTable(doc, {
      startY: 60,
      head: [['#', 'Produto', 'Qtd', 'Preço/Cx', 'Subtotal']],
      body: tableData,
      theme: 'striped',
      headStyles: { 
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 80 },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 35, halign: 'right' }
      },
      styles: {
        fontSize: 10,
        cellPadding: 4
      }
    });

    // Footer summary
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total: ${itemsToExport.length} produtos • ${totalBoxes} caixas`, 14, finalY);
    
    const totalValue = itemsToExport.reduce((sum, item) => 
      sum + (item.last_price ? item.suggested_qty * item.last_price : 0), 0
    );
    if (totalValue > 0) {
      doc.text(`Valor Estimado: R$ ${totalValue.toFixed(2)}`, 14, finalY + 7);
    }

    // Save
    const fileName = `pedido_${supplierName.toLowerCase().replace(/\s+/g, '_')}_${date.replace(/\//g, '-')}.pdf`;
    doc.save(fileName);
    toast.success('PDF gerado com sucesso!');
  };

  const totalBoxes = suggestions.reduce((sum, s) => sum + s.suggested_qty, 0);
  const itemsWithSuggestion = suggestions.filter(s => s.suggested_qty > 0);
  const criticalItems = suggestions.filter(s => s.days_of_stock < 3);

  // Content shared between Dialog and Drawer
  const SuggestionsContent = () => (
    <div className="flex flex-col h-full">
      {/* Settings - Mobile optimized */}
      <div className="p-4 border-b space-y-3">
        <div>
          <Label className="text-sm font-medium mb-2 block">Fornecedor</Label>
          <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Selecione o fornecedor..." />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              {suppliers.map(s => (
                <SelectItem key={s.id} value={s.id} className="py-3">{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Analisar últimos</Label>
            <Select value={String(daysToAnalyze)} onValueChange={(v) => setDaysToAnalyze(Number(v))}>
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="3">3 dias</SelectItem>
                <SelectItem value="7">7 dias</SelectItem>
                <SelectItem value="14">14 dias</SelectItem>
                <SelectItem value="30">30 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Estoque para</Label>
            <Select value={String(daysToStock)} onValueChange={(v) => setDaysToStock(Number(v))}>
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="3">3 dias</SelectItem>
                <SelectItem value="5">5 dias</SelectItem>
                <SelectItem value="7">7 dias</SelectItem>
                <SelectItem value="10">10 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary badges */}
        {selectedSupplier && !isLoading && suggestions.length > 0 && (
          <div className="flex gap-2 flex-wrap pt-1">
            {criticalItems.length > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                {criticalItems.length} críticos
              </Badge>
            )}
            <Badge variant="secondary" className="gap-1">
              <Package className="h-3 w-3" />
              {itemsWithSuggestion.length} produtos
            </Badge>
            <Badge variant="secondary">
              {totalBoxes} caixas
            </Badge>
          </div>
        )}
      </div>

      {/* Suggestions List */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Analisando vendas...</span>
          </div>
        ) : !selectedSupplier ? (
          <div className="py-16 text-center">
            <Building2 className="h-16 w-16 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              Selecione um fornecedor para ver as sugestões
            </p>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="h-16 w-16 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              Nenhum produto cadastrado para este fornecedor
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {suggestions.map(item => (
              <Card 
                key={item.product_id}
                className={`overflow-hidden ${
                  item.days_of_stock < 3 
                    ? 'border-destructive/50 bg-destructive/5' 
                    : item.days_of_stock < 7
                      ? 'border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-900/10'
                      : ''
                }`}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    {/* Product image */}
                    <ProductImage 
                      src={item.product_image}
                      alt={item.product_name}
                      category={item.product_category}
                      size="xs"
                    />
                    {/* Product info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{item.product_name}</div>
                      <div className="text-xs text-muted-foreground flex flex-wrap gap-x-2 mt-1">
                        <span>{item.avg_daily_sales.toFixed(1)} kg/dia</span>
                        <span>•</span>
                        <span>Estoque: {item.current_stock.toFixed(0)} kg</span>
                        <span>•</span>
                        <span className={item.days_of_stock < 3 ? 'text-destructive font-medium' : ''}>
                          {item.days_of_stock < 999 ? `${item.days_of_stock.toFixed(0)} dias` : '∞'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Quantity controls - Touch optimized */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-11 w-11"
                        onClick={() => handleUpdateQuantity(item.product_id, -1)}
                        disabled={item.suggested_qty === 0}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={item.suggested_qty}
                        onChange={(e) => handleSetQuantity(item.product_id, parseInt(e.target.value) || 0)}
                        className="w-14 h-11 text-center font-mono text-lg"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-11 w-11"
                        onClick={() => handleUpdateQuantity(item.product_id, 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );

  // Footer with apply button
  const FooterContent = () => (
    <>
      {selectedSupplier && suggestions.length > 0 && (
        <div className="flex flex-col gap-3 w-full">
          {/* Export buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportWhatsApp}
              disabled={totalBoxes === 0}
              className="flex-1 h-10 gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              disabled={totalBoxes === 0}
              className="flex-1 h-10 gap-2"
            >
              <FileText className="h-4 w-4" />
              PDF
            </Button>
          </div>
          
          {/* Apply button */}
          <div className="flex justify-between items-center gap-3">
            <div className="text-sm text-muted-foreground">
              {itemsWithSuggestion.length} produtos • {totalBoxes} caixas
            </div>
            <Button 
              onClick={handleApply} 
              disabled={totalBoxes === 0}
              className="h-12 px-6 gap-2"
            >
              <Check className="h-5 w-5" />
              Aplicar
            </Button>
          </div>
        </div>
      )}
    </>
  );

  // Trigger button
  const TriggerButton = (
    <Button variant="outline" className="gap-2 h-12">
      <Lightbulb className="h-5 w-5" />
      Pedido Sugerido
    </Button>
  );

  // Mobile: use Drawer
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          {TriggerButton}
        </DrawerTrigger>
        <DrawerContent className="h-[90vh] flex flex-col">
          <DrawerHeader className="border-b pb-3">
            <DrawerTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Pedido Sugerido
            </DrawerTitle>
          </DrawerHeader>
          
          <SuggestionsContent />
          
          <DrawerFooter className="border-t pt-3 fixed-bottom-safe">
            <FooterContent />
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: use Dialog
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {TriggerButton}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Pedido Sugerido por Vendas
          </DialogTitle>
        </DialogHeader>
        
        <SuggestionsContent />
        
        <div className="p-4 border-t">
          <FooterContent />
        </div>
      </DialogContent>
    </Dialog>
  );
}
