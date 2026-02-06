import { useState } from 'react';
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
  CheckCheck
} from 'lucide-react';
import { PurchaseOrder, PURCHASE_ORDER_STATUS_LABELS } from '@/types/database';
import { ReceivingDialog } from './ReceivingDialog';
import { EditOrderDialog } from './EditOrderDialog';
import { PhotoGallery } from './PhotoGallery';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface OrdersListProps {
  orders: PurchaseOrder[];
  type: 'pending' | 'received';
  onDelete?: (id: string) => void;
  onFinalize?: (id: string) => void;
  onRefresh: () => void;
  isDeleting?: boolean;
  isFinalizing?: boolean;
}

export function OrdersList({ orders, type, onDelete, onFinalize, onRefresh, isDeleting, isFinalizing }: OrdersListProps) {
  const navigate = useNavigate();
  const [receivingOrder, setReceivingOrder] = useState<PurchaseOrder | null>(null);
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null);
  const [clickedButton, setClickedButton] = useState<string | null>(null);

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
            className={cn(
              "overflow-hidden transition-all duration-200",
              "border-l-4",
              statusConfig[order.status]?.border || 'border-muted'
            )}
          >
            <CardContent className="p-4 sm:p-5">
              {/* Header: Supplier + Status */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="h-5 w-5 text-primary flex-shrink-0" />
                    <h3 className="text-xl sm:text-2xl font-bold truncate">
                      {order.supplier?.name || 'Fornecedor não definido'}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    <span>
                      {format(new Date(order.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge 
                    className={cn(
                      "text-sm px-3 py-1 font-semibold",
                      statusConfig[order.status]?.bg,
                      statusConfig[order.status]?.text
                    )}
                  >
                    {PURCHASE_ORDER_STATUS_LABELS[order.status]}
                  </Badge>
                  {order.edited_at && (
                    <Badge variant="secondary" className="text-xs">
                      ✏️ Editado
                    </Badge>
                  )}
                </div>
              </div>

              {/* Stats Row: Items + Value */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-muted/50 rounded-xl p-3 sm:p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Package className="h-4 w-4" />
                    <span className="text-xs sm:text-sm font-medium">Itens</span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold">
                    {order.items?.length || 0}
                  </p>
                </div>
                <div className="bg-primary/10 rounded-xl p-3 sm:p-4">
                  <div className="flex items-center gap-2 text-primary mb-1">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-xs sm:text-sm font-medium">
                      {type === 'received' ? 'Valor Pago' : 'Estimado'}
                    </span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold font-mono text-primary">
                    R$ {(type === 'received' && order.total_received 
                      ? order.total_received 
                      : order.total_estimated
                    ).toFixed(2)}
                  </p>
                </div>
              </div>

              {type === 'pending' && (
                <div className="space-y-3">
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

              {type === 'received' && order.received_at && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <span>
                      Recebido em: {format(new Date(order.received_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <PhotoGallery orderId={order.id} order={order} compact />
                  
                  {/* Botão Finalizar */}
                  {onFinalize && (
                    <Button
                      className={cn(
                        "w-full h-14 text-base font-semibold transition-all duration-150 bg-emerald-600 hover:bg-emerald-700",
                        clickedButton === `finalizar-${order.id}` && "scale-95 opacity-80"
                      )}
                      onClick={() => handleButtonClick(`finalizar-${order.id}`, () => onFinalize(order.id))}
                      disabled={isFinalizing}
                    >
                      {isFinalizing ? (
                        <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                      ) : (
                        <CheckCheck className="mr-3 h-6 w-6" />
                      )}
                      Finalizar Pedido
                      <ChevronRight className="ml-auto h-5 w-5" />
                    </Button>
                  )}
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
    </>
  );
}
