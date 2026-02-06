import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PurchaseOrder, PurchaseOrderItem } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Calendar,
  Building2,
  Package,
  Scale,
  Truck,
  AlertTriangle,
  MessageCircle,
  CheckCircle2,
  Loader2,
  Tag,
  Percent,
  Lock
} from 'lucide-react';

interface ClosingProtocolDialogProps {
  order: PurchaseOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

// Interface para pricing de cada item - custo real é IMUTÁVEL
interface ItemPricing {
  margem: number;           // Margem de lucro (%)
  precoVenda: number;       // Preço de venda (R$/kg)
  custoRealKg: number;      // Custo real por kg (IMUTÁVEL após cálculo)
  pesoLiquido: number;      // Peso líquido real (kg)
  custoTotal: number;       // Custo total do item
  qtdVolumes: number;       // Quantidade de volumes/caixas
}

// Output estruturado para Relatórios
export interface ClosingOutput {
  orderId: string;
  supplierId: string | null;
  supplierName: string;
  closedAt: string;
  items: Array<{
    productId: string;
    productName: string;
    qtdVolumes: number;
    pesoLiquido: number;
    custoRealKg: number;
    precoVendaKg: number;
    margemLucro: number;
    custoTotal: number;
  }>;
  totais: {
    qtdVolumes: number;
    pesoLiquido: number;
    custoTotal: number;
    margemPonderada: number;
  };
  custosAdicionais: {
    frete: number;
    outros: number;
    descricao: string;
  };
}

const DEFAULT_MARGEM = 60;

export function ClosingProtocolDialog({ 
  order, 
  open, 
  onOpenChange, 
  onSuccess 
}: ClosingProtocolDialogProps) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  // Custos adicionais
  const [valorFrete, setValorFrete] = useState<number>(0);
  const [outrosCustos, setOutrosCustos] = useState<number>(0);
  const [descricaoCustos, setDescricaoCustos] = useState('');
  
  // Conferência de peso
  const [pesoBalancaReal, setPesoBalancaReal] = useState<number>(0);
  
  // Precificação por item
  const [itemsPricing, setItemsPricing] = useState<Record<string, ItemPricing>>({});
  
  const [isApproving, setIsApproving] = useState(false);

  // Calcula peso líquido total para rateio de custos
  const pesoLiquidoTotal = useMemo(() => {
    if (!order?.items) return 1;
    
    return order.items.reduce((sum, item) => {
      const pesoBruto = item.quantity_received 
        ? item.quantity_received * (item.estimated_kg || 1) / item.quantity
        : item.estimated_kg || 1;
      const taraTotal = item.tare_total || 0;
      return sum + Math.max(0.1, pesoBruto - taraTotal);
    }, 0);
  }, [order?.items]);

  // Inicializa pricing quando order ou custos adicionais mudam
  useEffect(() => {
    if (!order?.items) return;
    
    const custosRateioTotal = valorFrete + outrosCustos;
    const custoRateioPorKg = pesoLiquidoTotal > 0 ? custosRateioTotal / pesoLiquidoTotal : 0;
    
    const initialPricing: Record<string, ItemPricing> = {};
    
    order.items.forEach((item) => {
      // CUSTO REAL: Usa unit_cost_actual (conferido no recebimento) se disponível
      const custoVolume = item.unit_cost_actual ?? item.unit_cost_estimated ?? 0;
      const qtdVolumes = item.quantity_received ?? item.quantity;
      const custoTotal = qtdVolumes * custoVolume;
      
      // Peso líquido REAL: peso bruto - tara total
      const pesoBruto = item.quantity_received 
        ? item.quantity_received * (item.estimated_kg || 1) / item.quantity
        : item.estimated_kg || 1;
      const taraTotal = item.tare_total || 0;
      const pesoLiquido = Math.max(0.1, pesoBruto - taraTotal);
      
      // Custo unitário base (R$/kg) = custo total / peso líquido
      const custoBaseKg = custoTotal / pesoLiquido;
      
      // Custo REAL por kg = custo base + rateio de frete/custos
      const custoRealKg = custoBaseKg + custoRateioPorKg;
      
      // Margem padrão e preço de venda
      const margem = itemsPricing[item.id]?.margem ?? DEFAULT_MARGEM;
      
      // FÓRMULA DE MARGEM DE LUCRO (não markup!):
      // Preço = Custo / (1 - Margem/100)
      const precoVenda = custoRealKg / (1 - margem / 100);
      
      initialPricing[item.id] = {
        margem,
        precoVenda,
        custoRealKg,
        pesoLiquido,
        custoTotal,
        qtdVolumes,
      };
    });
    
    setItemsPricing(initialPricing);
  }, [order?.items, valorFrete, outrosCustos, pesoLiquidoTotal]);

  // BIDIRECIONAL: Atualiza preço quando margem muda
  const handleMargemChange = (itemId: string, newMargem: number) => {
    setItemsPricing((prev) => {
      const item = prev[itemId];
      if (!item) return prev;
      
      const margem = Math.max(0.1, Math.min(99.9, newMargem));
      // Preço = Custo / (1 - Margem/100)
      const precoVenda = item.custoRealKg / (1 - margem / 100);
      
      return {
        ...prev,
        [itemId]: { ...item, margem, precoVenda },
      };
    });
  };

  // BIDIRECIONAL: Atualiza margem quando preço muda
  const handlePrecoVendaChange = (itemId: string, newPreco: number) => {
    setItemsPricing((prev) => {
      const item = prev[itemId];
      if (!item || newPreco <= item.custoRealKg) return prev;
      
      // Margem = (1 - Custo/Preço) * 100
      const margem = (1 - item.custoRealKg / newPreco) * 100;
      
      return {
        ...prev,
        [itemId]: { ...item, precoVenda: newPreco, margem },
      };
    });
  };

  // Cálculos de resumo
  const resumo = useMemo(() => {
    if (!order?.items) return null;

    const totalCaixas = order.items.reduce((sum, i) => sum + (i.quantity_received ?? i.quantity), 0);
    const valorProdutos = order.items.reduce(
      (sum, i) => sum + ((i.quantity_received ?? i.quantity) * (i.unit_cost_actual ?? i.unit_cost_estimated ?? 0)), 0
    );
    const pesoNota = order.items.reduce(
      (sum, i) => sum + (i.estimated_kg || 1), 0
    );
    
    return {
      totalCaixas,
      valorProdutos,
      pesoNota,
      valorTotal: valorProdutos + valorFrete + outrosCustos,
    };
  }, [order?.items, valorFrete, outrosCustos]);

  // Totais de precificação
  const precificacaoTotais = useMemo(() => {
    const items = Object.values(itemsPricing);
    if (items.length === 0) return { totalCusto: 0, totalPesoLiquido: 0, margemPonderada: 0 };
    
    const totalCusto = items.reduce((sum, i) => sum + i.custoTotal, 0);
    const totalPesoLiquido = items.reduce((sum, i) => sum + i.pesoLiquido, 0);
    
    // Margem ponderada pelo peso líquido
    const margemPonderada = totalPesoLiquido > 0
      ? items.reduce((sum, i) => sum + (i.margem * i.pesoLiquido), 0) / totalPesoLiquido
      : 0;
    
    return { totalCusto, totalPesoLiquido, margemPonderada };
  }, [itemsPricing]);

  const diferencaPeso = useMemo(() => {
    if (!resumo || !pesoBalancaReal) return null;
    return pesoBalancaReal - resumo.pesoNota;
  }, [resumo, pesoBalancaReal]);

  // Gera output estruturado para Relatórios
  const generateClosingOutput = (): ClosingOutput | null => {
    if (!order || !resumo) return null;

    const items = (order.items || []).map((item) => {
      const pricing = itemsPricing[item.id];
      return {
        productId: item.product_id,
        productName: item.product?.name || 'Produto',
        qtdVolumes: pricing?.qtdVolumes ?? item.quantity,
        pesoLiquido: pricing?.pesoLiquido ?? 0,
        custoRealKg: pricing?.custoRealKg ?? 0,
        precoVendaKg: pricing?.precoVenda ?? 0,
        margemLucro: pricing?.margem ?? DEFAULT_MARGEM,
        custoTotal: pricing?.custoTotal ?? 0,
      };
    });

    return {
      orderId: order.id,
      supplierId: order.supplier_id,
      supplierName: order.supplier?.name || 'Fornecedor',
      closedAt: new Date().toISOString(),
      items,
      totais: {
        qtdVolumes: resumo.totalCaixas,
        pesoLiquido: precificacaoTotais.totalPesoLiquido,
        custoTotal: precificacaoTotais.totalCusto + valorFrete + outrosCustos,
        margemPonderada: precificacaoTotais.margemPonderada,
      },
      custosAdicionais: {
        frete: valorFrete,
        outros: outrosCustos,
        descricao: descricaoCustos,
      },
    };
  };

  const handleWhatsApp = () => {
    if (!order || !resumo) return;

    const supplierName = order.supplier?.name || 'Fornecedor';
    const date = format(new Date(order.created_at), "dd/MM/yyyy", { locale: ptBR });
    
    let message = `📦 *CONFERÊNCIA DE RECEBIMENTO*\n`;
    message += `Fornecedor: ${supplierName}\n`;
    message += `Data Pedido: ${date}\n`;
    message += `─────────────────\n\n`;
    
    message += `*RESUMO:*\n`;
    message += `• ${resumo.totalCaixas} caixas\n`;
    message += `• Valor Produtos: R$ ${resumo.valorProdutos.toFixed(2)}\n`;
    message += `• Peso Nota: ${resumo.pesoNota.toFixed(1)} kg\n`;
    
    if (pesoBalancaReal > 0) {
      message += `• Peso Balança: ${pesoBalancaReal.toFixed(1)} kg\n`;
      if (diferencaPeso !== null) {
        const diff = diferencaPeso >= 0 ? `+${diferencaPeso.toFixed(1)}` : diferencaPeso.toFixed(1);
        message += `• Diferença: ${diff} kg\n`;
      }
    }
    
    if (valorFrete > 0) {
      message += `• Frete: R$ ${valorFrete.toFixed(2)}\n`;
    }
    if (outrosCustos > 0) {
      message += `• Outros Custos: R$ ${outrosCustos.toFixed(2)}`;
      if (descricaoCustos) message += ` (${descricaoCustos})`;
      message += `\n`;
    }
    
    message += `\n*TOTAL: R$ ${resumo.valorTotal.toFixed(2)}*`;

    const supplierPhone = order.supplier?.phone?.replace(/\D/g, '');
    const phoneWithCountry = supplierPhone?.startsWith('55') ? supplierPhone : `55${supplierPhone}`;
    
    const encodedMessage = encodeURIComponent(message);
    const url = supplierPhone 
      ? `https://wa.me/${phoneWithCountry}?text=${encodedMessage}`
      : `https://wa.me/?text=${encodedMessage}`;
    
    window.open(url, '_blank');
  };

  const handleAprovar = async () => {
    if (!order || !resumo) return;

    setIsApproving(true);
    try {
      // Gera output para log/debug
      const closingOutput = generateClosingOutput();
      console.log('[ClosingProtocol] Output:', closingOutput);

      // === TRANSAÇÃO ATÔMICA ===
      
      // 1. Atualizar purchase_order_items com custo real
      for (const item of order.items || []) {
        const pricing = itemsPricing[item.id];
        if (!pricing) continue;

        const { error: itemError } = await supabase
          .from('purchase_order_items')
          .update({
            quantity_received: pricing.qtdVolumes,
            unit_cost_actual: pricing.custoRealKg,
          })
          .eq('id', item.id);
        
        if (itemError) throw itemError;
      }

      // 2. Atualizar produtos (preço de venda + custo de compra)
      for (const item of order.items || []) {
        const pricing = itemsPricing[item.id];
        if (!pricing || !item.product_id) continue;

        const { error: productError } = await supabase
          .from('products')
          .update({ 
            price: pricing.precoVenda,
            custo_compra: pricing.custoRealKg,
          })
          .eq('id', item.product_id);
        
        if (productError) throw productError;
      }

      // 3. CRIAR LOTES DE ESTOQUE com custo real por kg
      for (const item of order.items || []) {
        const pricing = itemsPricing[item.id];
        if (!pricing || pricing.pesoLiquido <= 0) continue;
        
        const product = item.product;
        const shelfLife = product?.shelf_life || 7;
        const expiryDate = addDays(new Date(), shelfLife).toISOString().split('T')[0];

        const { error: batchError } = await supabase
          .from('stock_batches')
          .insert({
            product_id: item.product_id,
            quantity: pricing.pesoLiquido,      // Peso líquido real (kg)
            cost_per_unit: pricing.custoRealKg, // Custo real (R$/kg) com rateio
            expiry_date: expiryDate,
            received_at: new Date().toISOString(),
          });

        if (batchError) throw batchError;
      }

      // 4. Fechar pedido
      const notesContent = [
        valorFrete > 0 ? `Frete: R$${valorFrete.toFixed(2)}` : null,
        outrosCustos > 0 ? `Outros: R$${outrosCustos.toFixed(2)}${descricaoCustos ? ` (${descricaoCustos})` : ''}` : null,
        pesoBalancaReal > 0 ? `Peso Balança: ${pesoBalancaReal.toFixed(1)}kg` : null,
      ].filter(Boolean).join(' | ');

      const { error } = await supabase
        .from('purchase_orders')
        .update({
          status: 'fechado',
          total_received: resumo.valorTotal,
          received_at: new Date().toISOString(),
          notes: notesContent || null,
        })
        .eq('id', order.id);

      if (error) throw error;

      // 5. Sucesso!
      toast.success('Pedido fechado! Estoque e preços atualizados.');
      onSuccess();
      onOpenChange(false);
      
      // Reset state
      setValorFrete(0);
      setOutrosCustos(0);
      setDescricaoCustos('');
      setPesoBalancaReal(0);
      setItemsPricing({});
      
      // 6. Redirecionar para Relatórios com destaque
      navigate('/relatorios', { 
        state: { 
          highlightOrder: order.id,
          activeTab: 'fechamento',
        } 
      });
      
    } catch (error: any) {
      console.error('Erro ao aprovar:', error);
      toast.error('Erro: ' + error.message);
    } finally {
      setIsApproving(false);
    }
  };

  if (!order || !resumo) return null;

  const Content = () => (
    <ScrollArea className="flex-1">
      <div className="p-4 space-y-4">
        {/* RESUMO DO PEDIDO */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4" />
              Resumo do Pedido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{format(new Date(order.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{order.supplier?.name}</span>
            </div>
            <Separator className="my-2" />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-muted-foreground">Volumes:</span>
                <span className="ml-2 font-mono">{resumo.totalCaixas}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Valor:</span>
                <span className="ml-2 font-mono">R$ {resumo.valorProdutos.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Peso Nota:</span>
                <span className="ml-2 font-mono">{resumo.pesoNota.toFixed(1)} kg</span>
              </div>
              <div>
                <span className="text-muted-foreground">Peso Líq.:</span>
                <span className="ml-2 font-mono">{precificacaoTotais.totalPesoLiquido.toFixed(1)} kg</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CUSTOS ADICIONAIS */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Custos Adicionais (rateados por kg)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Frete (R$)</Label>
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                value={valorFrete || ''}
                onChange={(e) => setValorFrete(parseFloat(e.target.value) || 0)}
                className="h-12 font-mono text-lg"
                placeholder="0,00"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Outros Custos (R$)</Label>
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                value={outrosCustos || ''}
                onChange={(e) => setOutrosCustos(parseFloat(e.target.value) || 0)}
                className="h-12 font-mono text-lg"
                placeholder="0,00"
              />
            </div>
            {outrosCustos > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground">Descrição dos custos</Label>
                <Input
                  value={descricaoCustos}
                  onChange={(e) => setDescricaoCustos(e.target.value)}
                  className="h-10"
                  placeholder="Ex: Descarga, taxas..."
                />
              </div>
            )}
            {(valorFrete > 0 || outrosCustos > 0) && (
              <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                Rateio: R$ {((valorFrete + outrosCustos) / precificacaoTotais.totalPesoLiquido).toFixed(2)}/kg
              </div>
            )}
          </CardContent>
        </Card>

        {/* CONFERÊNCIA DE PESO */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Scale className="h-4 w-4" />
              Conferência de Peso
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Peso Balança Real (kg)</Label>
              <Input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={pesoBalancaReal || ''}
                onChange={(e) => setPesoBalancaReal(parseFloat(e.target.value) || 0)}
                className="h-12 font-mono text-lg"
                placeholder="0,0"
              />
            </div>
            
            {pesoBalancaReal > 0 && diferencaPeso !== null && (
              <div className={`p-3 rounded-lg flex items-center gap-2 ${
                Math.abs(diferencaPeso) > resumo.pesoNota * 0.05
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
              }`}>
                {Math.abs(diferencaPeso) > resumo.pesoNota * 0.05 ? (
                  <AlertTriangle className="h-5 w-5" />
                ) : (
                  <CheckCircle2 className="h-5 w-5" />
                )}
                <div>
                  <div className="font-medium">
                    Diferença: {diferencaPeso >= 0 ? '+' : ''}{diferencaPeso.toFixed(1)} kg
                  </div>
                  <div className="text-xs opacity-80">
                    ({((diferencaPeso / resumo.pesoNota) * 100).toFixed(1)}% do peso nota)
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* PRECIFICAÇÃO POR ITEM */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Precificação por Item
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {order.items?.map((item) => {
              const pricing = itemsPricing[item.id];
              if (!pricing) return null;
              
              return (
                <div key={item.id} className="p-3 bg-muted/50 rounded-lg space-y-2">
                  <div className="font-medium text-sm truncate">
                    {item.product?.name || 'Produto'}
                  </div>
                  
                  {/* Info calculada - CUSTO REAL IMUTÁVEL */}
                  <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                    <div>
                      <span className="block">Peso Líq.</span>
                      <span className="font-mono text-foreground">{pricing.pesoLiquido.toFixed(1)} kg</span>
                    </div>
                    <div>
                      <span className="block">Custo Total</span>
                      <span className="font-mono text-foreground">R$ {pricing.custoTotal.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        Custo/kg
                      </span>
                      <span className="font-mono text-foreground font-bold">
                        R$ {pricing.custoRealKg.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Inputs bidirecionais */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div>
                      <Label className="text-xs text-muted-foreground flex items-center gap-1">
                        <Percent className="h-3 w-3" />
                        Margem %
                      </Label>
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="1"
                        min="0.1"
                        max="99"
                        value={pricing.margem.toFixed(1)}
                        onChange={(e) => handleMargemChange(item.id, parseFloat(e.target.value) || 0)}
                        className="h-10 font-mono"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Preço Venda (R$/kg)</Label>
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min={pricing.custoRealKg + 0.01}
                        value={pricing.precoVenda.toFixed(2)}
                        onChange={(e) => handlePrecoVendaChange(item.id, parseFloat(e.target.value) || 0)}
                        className="h-10 font-mono"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Totais de Precificação */}
            <Separator />
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="text-center p-2 bg-muted rounded-lg">
                <div className="text-xs text-muted-foreground">Total Custo</div>
                <div className="font-mono font-bold">
                  R$ {(precificacaoTotais.totalCusto + valorFrete + outrosCustos).toFixed(2)}
                </div>
              </div>
              <div className="text-center p-2 bg-primary/10 rounded-lg">
                <div className="text-xs text-muted-foreground">Margem Ponderada</div>
                <div className="font-mono font-bold text-primary">{precificacaoTotais.margemPonderada.toFixed(1)}%</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* TOTAL */}
        <Card className="bg-primary/5 border-primary">
          <CardContent className="py-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium">Total a Pagar</span>
              <span className="text-2xl font-bold font-mono">
                R$ {resumo.valorTotal.toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );

  const Footer = () => (
    <div className="flex gap-2 p-4 border-t">
      <Button
        variant="outline"
        className="flex-1"
        onClick={handleWhatsApp}
      >
        <MessageCircle className="h-4 w-4 mr-2" />
        WhatsApp
      </Button>
      <Button
        className="flex-[2]"
        onClick={handleAprovar}
        disabled={isApproving}
      >
        {isApproving ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <CheckCircle2 className="h-4 w-4 mr-2" />
        )}
        {isApproving ? 'Fechando...' : 'Fechar e Atualizar Preços'}
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh] flex flex-col">
          <DrawerHeader className="border-b">
            <DrawerTitle>Protocolo de Fechamento</DrawerTitle>
          </DrawerHeader>
          <Content />
          <Footer />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Protocolo de Fechamento</DialogTitle>
        </DialogHeader>
        <Content />
        <Footer />
      </DialogContent>
    </Dialog>
  );
}
