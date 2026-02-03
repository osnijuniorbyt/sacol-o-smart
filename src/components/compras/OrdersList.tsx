import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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
  FileText
} from 'lucide-react';
import { PurchaseOrder, PURCHASE_ORDER_STATUS_LABELS } from '@/types/database';
import { ReceivingDialog } from './ReceivingDialog';
import { EditOrderDialog } from './EditOrderDialog';
import { PhotoGallery } from './PhotoGallery';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

  const statusColors: Record<string, string> = {
    rascunho: 'bg-muted text-muted-foreground',
    enviado: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    recebido: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    cancelado: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
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
          <Card key={order.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-base">
                      {order.supplier?.name || 'Fornecedor não definido'}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(order.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                    <Badge className={statusColors[order.status]}>
                      {PURCHASE_ORDER_STATUS_LABELS[order.status]}
                    </Badge>
                    {order.edited_at && (
                      <Badge variant="secondary">
                        ✏️ Editado
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">
                    {type === 'received' ? 'Valor Pago' : 'Estimado'}
                  </p>
                  <p className="text-lg font-bold font-mono">
                    R$ {(type === 'received' && order.total_received 
                      ? order.total_received 
                      : order.total_estimated
                    ).toFixed(2)}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="items" className="border-none">
                  <AccordionTrigger className="py-2 hover:no-underline">
                    <span className="flex items-center gap-2 text-sm">
                      <Package className="h-4 w-4" />
                      {order.items?.length || 0} itens
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produto</TableHead>
                          <TableHead className="text-right">Pedido</TableHead>
                          {type === 'received' && (
                            <TableHead className="text-right">Recebido</TableHead>
                          )}
                          <TableHead className="text-right">
                            {type === 'received' ? 'Custo Real' : 'Custo Est.'}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {order.items?.map(item => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">
                              {item.product?.name}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {item.quantity} kg
                            </TableCell>
                            {type === 'received' && (
                              <TableCell className="text-right font-mono">
                                {item.quantity_received ?? '-'} kg
                              </TableCell>
                            )}
                            <TableCell className="text-right font-mono">
                              R$ {(type === 'received' && item.unit_cost_actual 
                                ? item.unit_cost_actual 
                                : item.unit_cost_estimated || 0
                              ).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {type === 'pending' && (
                <div className="space-y-2 mt-4">
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1 h-12"
                      onClick={() => setReceivingOrder(order)}
                    >
                      <ClipboardCheck className="mr-2 h-5 w-5" />
                      Conferir Item a Item
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 h-12"
                      onClick={() => navigate(`/protocolo/${order.id}`)}
                    >
                      <FileText className="mr-2 h-5 w-5" />
                      Protocolo Fechamento
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10"
                      onClick={() => setEditingOrder(order)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {onDelete && (
                      <Button 
                        variant="outline" 
                        size="icon"
                        className="text-destructive h-10 w-10"
                        onClick={() => onDelete(order.id)}
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {type === 'received' && order.received_at && (
                <div className="mt-4 space-y-3">
                  <div className="text-sm text-muted-foreground">
                    Recebido em: {format(new Date(order.received_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </div>
                  <PhotoGallery orderId={order.id} order={order} compact />
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
