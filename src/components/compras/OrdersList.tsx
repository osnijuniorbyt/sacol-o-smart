import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  Trash2, 
  ClipboardCheck,
  Calendar,
  Building2,
  Loader2,
  Pencil,
  FileText,
  DollarSign,
  ChevronRight,
  MessageCircle,
  Printer
} from 'lucide-react';
import { PurchaseOrder, PURCHASE_ORDER_STATUS_LABELS } from '@/types/database';
import { ReceivingDialog } from './ReceivingDialog';
import { EditOrderDialog } from './EditOrderDialog';
import { PhotoGallery } from './PhotoGallery';
import { OrderPrintView } from './OrderPrintView';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface OrdersListProps {
  orders: PurchaseOrder[];
  type: 'pending' | 'received';
  onDelete?: (id: string) => void;
  onRefresh: () => void;
  isDeleting?: boolean;
}

export function OrdersList({ orders, type, onDelete, onRefresh, isDeleting }: OrdersListProps) {
  const navigate = useNavigate();
  const [receivingOrder, setReceivingOrder] = useState<PurchaseOrder | null>(null);
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null);
  const [clickedButton, setClickedButton] = useState<string | null>(null);
  const [printingOrder, setPrintingOrder] = useState<PurchaseOrder | null>(null);

  const generateWhatsAppText = (order: PurchaseOrder): string => {
    const date = format(new Date(order.created_at), "dd/MM/yyyy", { locale: ptBR });
    const lines: string[] = [
      `🛒 *PEDIDO DE COMPRA*`,
      `📅 ${date}`,
      `🏢 *${order.supplier?.name || 'Fornecedor'}*`,
      ``,
      `📦 *Itens:*`,
    ];
    
    order.items?.forEach((item, i) => {
      const cost = item.unit_cost_estimated || 0;
      lines.push(`${i + 1}. ${item.product?.name || 'Produto'} — ${item.quantity} ${item.unit} × R$ ${cost.toFixed(2)}`);
    });
    
    lines.push(``);
    lines.push(`💰 *Total Estimado: R$ ${order.total_estimated.toFixed(2)}*`);
    
    if (order.notes) {
      lines.push(``);
      lines.push(`📝 Obs: ${order.notes}`);
    }
    
    return lines.join('\n');
  };

  const handleWhatsApp = async (order: PurchaseOrder) => {
    const text = generateWhatsAppText(order);
    const encoded = encodeURIComponent(text);
    const phone = order.supplier?.phone?.replace(/\D/g, '') || '';
    const phoneWithCountry = phone.startsWith('55') ? phone : `55${phone}`;
    const fullUrl = phone 
      ? `https://wa.me/${phoneWithCountry}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
    
    if (fullUrl.length > 1800) {
      try {
        await navigator.clipboard.writeText(text);
        const baseUrl = phone ? `https://wa.me/${phoneWithCountry}` : `https://wa.me/`;
        window.open(baseUrl, '_blank');
        toast.success('Texto copiado! Cole no WhatsApp.');
      } catch {
        window.open(fullUrl, '_blank');
        toast.success('Abrindo WhatsApp...');
      }
    } else {
      window.open(fullUrl, '_blank');
      toast.success('Abrindo WhatsApp...');
    }
  };

  const handlePrint = (order: PurchaseOrder) => {
    setPrintingOrder(order);
    // Wait for render then print
    setTimeout(() => {
      window.print();
      setPrintingOrder(null);
    }, 100);
  };

  const statusConfig: Record<string, { bg: string; text: string; border: string }> = {
    rascunho: { 
      bg: 'bg-muted', 
      text: 'text-muted-foreground',
      border: 'border-muted'
    },
    enviado: { 
      bg: 'bg-amber-100 dark:bg-amber-900/30', 
      text: 'text-amber-800 dark:text-amber-200',
      border: 'border-amber-300 dark:border-amber-700'
    },
    recebido: { 
      bg: 'bg-emerald-100 dark:bg-emerald-900/30', 
      text: 'text-emerald-800 dark:text-emerald-200',
      border: 'border-emerald-300 dark:border-emerald-700'
    },
    cancelado: { 
      bg: 'bg-red-100 dark:bg-red-900/30', 
      text: 'text-red-800 dark:text-red-200',
      border: 'border-red-300 dark:border-red-700'
    },
  };

  // Optimistic UI handler
  const handleButtonClick = (buttonId: string, action: () => void) => {
    setClickedButton(buttonId);
    // Reset after animation
    setTimeout(() => setClickedButton(null), 300);
    action();
  };

  if (orders.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          {type === 'pending' ? (
            <>
              <Truck className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">Nenhum pedido aguardando recebimento</p>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">Nenhum pedido recebido ainda</p>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {orders.map(order => (
          <Card 
            key={order.id} 
            className="bg-white shadow-sm hover:shadow-md rounded-2xl border-0 overflow-hidden transition-all duration-200"
          >
            <CardContent className="p-4 sm:p-5">
              {/* Header: Supplier + Status */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-semibold truncate">
                        {order.supplier?.name || 'Fornecedor não definido'}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {format(new Date(order.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <Badge 
                    className={cn(
                      "text-xs px-2.5 py-1 font-medium rounded-full",
                      order.status === 'enviado' && "bg-amber-50 text-amber-700",
                      order.status === 'recebido' && "bg-green-50 text-green-700",
                      order.status === 'cancelado' && "bg-red-50 text-red-700",
                      order.status === 'rascunho' && "bg-gray-100 text-gray-600"
                    )}
                  >
                    {PURCHASE_ORDER_STATUS_LABELS[order.status]}
                  </Badge>
                  {order.edited_at && (
                    <Badge className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                      ✏️ Editado
                    </Badge>
                  )}
                </div>
              </div>

              {/* Stats Row: Items + Value - MD3 Style */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-gray-50 rounded-2xl p-3 sm:p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Package className="h-4 w-4" />
                    <span className="text-xs font-medium">Itens</span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-800">
                    {order.items?.length || 0}
                  </p>
                </div>
                <div className="bg-green-50 rounded-2xl p-3 sm:p-4">
                  <div className="flex items-center gap-2 text-green-700 mb-1">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-xs font-medium">
                      {type === 'received' ? 'Pago' : 'Estimado'}
                    </span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold font-mono text-green-700">
                    R$ {(type === 'received' && order.total_received 
                      ? order.total_received 
                      : order.total_estimated
                    ).toFixed(0)}
                  </p>
                </div>
              </div>

              {type === 'pending' && (
                <div className="space-y-3">
                  {/* WhatsApp & Print */}
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className={cn(
                        "flex-1 h-12 text-sm font-medium border-green-300 text-green-700 hover:bg-green-50 transition-all duration-150",
                        clickedButton === `whatsapp-${order.id}` && "scale-95 opacity-80"
                      )}
                      onClick={() => handleButtonClick(`whatsapp-${order.id}`, () => handleWhatsApp(order))}
                    >
                      <MessageCircle className="mr-2 h-5 w-5" />
                      WhatsApp
                    </Button>
                    <Button
                      variant="outline"
                      className={cn(
                        "flex-1 h-12 text-sm font-medium transition-all duration-150",
                        clickedButton === `print-${order.id}` && "scale-95 opacity-80"
                      )}
                      onClick={() => handleButtonClick(`print-${order.id}`, () => handlePrint(order))}
                    >
                      <Printer className="mr-2 h-5 w-5" />
                      Imprimir
                    </Button>
                  </div>

                  {/* Primary Actions - Large Touch Targets */}
                  <Button 
                    className={cn(
                      "w-full h-14 text-base font-semibold transition-all duration-150",
                      clickedButton === `conferir-${order.id}` && "scale-95 opacity-80"
                    )}
                    onClick={() => handleButtonClick(`conferir-${order.id}`, () => setReceivingOrder(order))}
                  >
                    <ClipboardCheck className="mr-3 h-6 w-6" />
                    Conferir Item a Item
                    <ChevronRight className="ml-auto h-5 w-5" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-14 text-base font-semibold transition-all duration-150",
                      clickedButton === `protocolo-${order.id}` && "scale-95 opacity-80"
                    )}
                    onClick={() => handleButtonClick(`protocolo-${order.id}`, () => navigate(`/protocolo/${order.id}`))}
                  >
                    <FileText className="mr-3 h-6 w-6" />
                    Protocolo Fechamento
                    <ChevronRight className="ml-auto h-5 w-5" />
                  </Button>

                  {/* Secondary Actions */}
                  <div className="flex gap-3 pt-2">
                    <Button 
                      variant="outline"
                      className={cn(
                        "flex-1 h-12 text-sm font-medium transition-all duration-150",
                        clickedButton === `editar-${order.id}` && "scale-95 opacity-80"
                      )}
                      onClick={() => handleButtonClick(`editar-${order.id}`, () => setEditingOrder(order))}
                    >
                      <Pencil className="mr-2 h-5 w-5" />
                      Editar
                    </Button>
                    {onDelete && (
                      <Button 
                        variant="outline" 
                        className={cn(
                          "h-12 px-4 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all duration-150",
                          clickedButton === `delete-${order.id}` && "scale-95 opacity-80"
                        )}
                        onClick={() => handleButtonClick(`delete-${order.id}`, () => onDelete(order.id))}
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Trash2 className="h-5 w-5" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {type === 'received' && (
                <div className="space-y-3">
                  {order.received_at && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      <span>
                        Recebido em: {format(new Date(order.received_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  )}
                  <PhotoGallery orderId={order.id} order={order} compact />
                  
                  {/* Actions for received orders */}
                  <div className="flex gap-3 pt-2">
                    <Button 
                      variant="outline"
                      className={cn(
                        "flex-1 h-12 text-sm font-medium transition-all duration-150",
                        clickedButton === `editar-${order.id}` && "scale-95 opacity-80"
                      )}
                      onClick={() => handleButtonClick(`editar-${order.id}`, () => setEditingOrder(order))}
                    >
                      <Pencil className="mr-2 h-5 w-5" />
                      Editar
                    </Button>
                    {onDelete && (
                      <Button 
                        variant="outline" 
                        className={cn(
                          "h-12 px-4 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all duration-150",
                          clickedButton === `delete-${order.id}` && "scale-95 opacity-80"
                        )}
                        onClick={() => handleButtonClick(`delete-${order.id}`, () => onDelete(order.id))}
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Trash2 className="h-5 w-5" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <ReceivingDialog
        order={receivingOrder}
        open={!!receivingOrder}
        onOpenChange={(open) => !open && setReceivingOrder(null)}
        onSuccess={onRefresh}
      />

      <EditOrderDialog
        order={editingOrder}
        open={!!editingOrder}
        onOpenChange={(open) => !open && setEditingOrder(null)}
        onSuccess={onRefresh}
      />

      {/* Hidden print view */}
      {printingOrder && <OrderPrintView order={printingOrder} />}
    </>
  );
}
