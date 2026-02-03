import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
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
  ArrowLeft,
  Phone
} from 'lucide-react';
import { PurchaseOrder, PURCHASE_ORDER_STATUS_LABELS } from '@/types/database';

export default function Protocolo() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Custos adicionais
  const [valorFrete, setValorFrete] = useState<number>(0);
  const [outrosCustos, setOutrosCustos] = useState<number>(0);
  const [descricaoCustos, setDescricaoCustos] = useState('');
  
  // Conferência de peso
  const [pesoBalancaReal, setPesoBalancaReal] = useState<number>(0);
  
  const [isApproving, setIsApproving] = useState(false);

  useEffect(() => {
    if (orderId) {
      loadOrder(orderId);
    }
  }, [orderId]);

  async function loadOrder(id: string) {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          supplier:suppliers(*),
          items:purchase_order_items(
            *,
            product:products(*)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setOrder(data as unknown as PurchaseOrder);
    } catch (error: any) {
      console.error('Erro ao carregar pedido:', error);
      toast.error('Pedido não encontrado');
      navigate('/compras');
    } finally {
      setLoading(false);
    }
  }

  // Cálculos
  const resumo = useMemo(() => {
    if (!order?.items) return null;

    const totalCaixas = order.items.reduce((sum, i) => sum + i.quantity, 0);
    const valorProdutos = order.items.reduce(
      (sum, i) => sum + (i.quantity * (i.unit_cost_estimated || 0)), 0
    );
    const pesoNota = order.items.reduce(
      (sum, i) => sum + (i.quantity * (i.estimated_kg || 1)), 0
    );
    
    return {
      totalCaixas,
      valorProdutos,
      pesoNota,
      valorTotal: valorProdutos + valorFrete + outrosCustos,
    };
  }, [order?.items, valorFrete, outrosCustos]);

  const diferencaPeso = useMemo(() => {
    if (!resumo || !pesoBalancaReal) return null;
    return pesoBalancaReal - resumo.pesoNota;
  }, [resumo, pesoBalancaReal]);

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
    toast.success('WhatsApp aberto!');
  };

  const handleAprovar = async () => {
    if (!order || !resumo) return;

    setIsApproving(true);
    try {
      // Atualiza itens com custo real
      for (const item of order.items || []) {
        await supabase
          .from('purchase_order_items')
          .update({
            quantity_received: item.quantity,
            unit_cost_actual: item.unit_cost_estimated,
          })
          .eq('id', item.id);
      }

      // Atualiza pedido como recebido
      await supabase
        .from('purchase_orders')
        .update({
          status: 'recebido',
          total_received: resumo.valorTotal,
          received_at: new Date().toISOString(),
          notes: descricaoCustos ? `Frete: R$${valorFrete} | Outros: R$${outrosCustos} (${descricaoCustos})` : null,
        })
        .eq('id', order.id);

      toast.success('Pedido aprovado! Estoque gerado automaticamente.');
      navigate('/compras');
      
    } catch (error: any) {
      console.error('Erro ao aprovar:', error);
      toast.error('Erro: ' + error.message);
    } finally {
      setIsApproving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order || !resumo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Pedido não encontrado</p>
          <Button variant="link" onClick={() => navigate('/compras')}>
            Voltar para Compras
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header fixo */}
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/compras')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-semibold">Protocolo de Fechamento</h1>
            <p className="text-xs text-muted-foreground">
              {order.supplier?.name}
            </p>
          </div>
          <Badge className={
            order.status === 'enviado' 
              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
              : order.status === 'recebido'
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-muted text-muted-foreground'
          }>
            {PURCHASE_ORDER_STATUS_LABELS[order.status]}
          </Badge>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-lg mx-auto px-4 py-4 pb-32 space-y-4">
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
              {order.supplier?.phone && (
                <a 
                  href={`tel:${order.supplier.phone}`}
                  className="text-primary"
                >
                  <Phone className="h-4 w-4" />
                </a>
              )}
            </div>
            <Separator className="my-2" />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-muted-foreground">Caixas:</span>
                <span className="ml-2 font-mono font-medium">{resumo.totalCaixas}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Valor:</span>
                <span className="ml-2 font-mono font-medium">R$ {resumo.valorProdutos.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Peso Nota:</span>
                <span className="ml-2 font-mono font-medium">{resumo.pesoNota.toFixed(1)} kg</span>
              </div>
            </div>

            {/* Lista de itens */}
            <Separator className="my-2" />
            <div className="space-y-1">
              {order.items?.map(item => (
                <div key={item.id} className="flex justify-between text-xs">
                  <span className="truncate flex-1">{item.product?.name}</span>
                  <span className="font-mono ml-2">{item.quantity} × R${(item.unit_cost_estimated || 0).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* CUSTOS ADICIONAIS */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Custos Adicionais
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
                  : 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
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
      </main>

      {/* Footer fixo com ações */}
      <footer className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 safe-area-bottom">
        <div className="max-w-lg mx-auto flex gap-2">
          <Button
            variant="outline"
            className="flex-1 h-12"
            onClick={handleWhatsApp}
          >
            <MessageCircle className="h-5 w-5 mr-2" />
            WhatsApp
          </Button>
          <Button
            className="flex-[2] h-12"
            onClick={handleAprovar}
            disabled={isApproving || order.status === 'recebido'}
          >
            {isApproving ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="h-5 w-5 mr-2" />
            )}
            {isApproving ? 'Aprovando...' : 'Aprovar e Gerar Estoque'}
          </Button>
        </div>
      </footer>
    </div>
  );
}
