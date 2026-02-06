import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { useSuppliers } from '@/hooks/useSuppliers';
import { PurchaseOrder, PURCHASE_ORDER_STATUS_LABELS } from '@/types/database';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  FileText,
  Eye,
  MessageCircle,
  Calendar,
  Building2,
  Package,
  DollarSign,
  Filter,
  Loader2,
  FileDown,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateReceivingPdf } from '@/lib/generateReceivingPdf';
import { toast } from 'sonner';

export default function Relatorios() {
  const { closedOrders, isLoading: loadingOrders } = usePurchaseOrders();
  const { activeSuppliers, isLoading: loadingSuppliers } = useSuppliers();
  
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [detailsOrder, setDetailsOrder] = useState<PurchaseOrder | null>(null);

  // Filter orders
  const filteredOrders = useMemo(() => {
    return closedOrders.filter(order => {
      // Filter by supplier
      if (selectedSupplier !== 'all' && order.supplier_id !== selectedSupplier) {
        return false;
      }
      
      // Filter by date range
      const orderDate = new Date(order.created_at);
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (orderDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (orderDate > end) return false;
      }
      
      return true;
    });
  }, [closedOrders, selectedSupplier, startDate, endDate]);

  // Calculate totals
  const totals = useMemo(() => {
    return {
      count: filteredOrders.length,
      totalValue: filteredOrders.reduce((sum, o) => sum + (o.total_received || o.total_estimated), 0),
      totalItems: filteredOrders.reduce((sum, o) => sum + (o.items?.length || 0), 0),
    };
  }, [filteredOrders]);

  const handleGeneratePdf = async (order: PurchaseOrder) => {
    try {
      await generateReceivingPdf({ order, photos: [] });
      toast.success('PDF gerado com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar PDF');
      console.error(error);
    }
  };

  const handleShareWhatsApp = (order: PurchaseOrder) => {
    const supplierName = order.supplier?.name || 'Fornecedor';
    const phone = order.supplier?.phone?.replace(/\D/g, '');
    const total = (order.total_received || order.total_estimated).toFixed(2);
    const itemsList = order.items?.map((item, idx) => 
      `${idx + 1}. ${item.product?.name || 'Produto'}: ${item.quantity_received || item.quantity} ${item.unit}`
    ).join('\n') || '';
    
    const message = encodeURIComponent(
      `📦 *Relatório de Pedido Fechado*\n\n` +
      `🏪 *Horti Campos*\n` +
      `📅 ${format(new Date(order.created_at), 'dd/MM/yyyy', { locale: ptBR })}\n` +
      `🏢 ${supplierName}\n\n` +
      `*Itens:*\n${itemsList}\n\n` +
      `💰 *Total: R$ ${total}*`
    );
    
    const url = phone 
      ? `https://wa.me/55${phone}?text=${message}`
      : `https://wa.me/?text=${message}`;
    
    window.open(url, '_blank');
  };

  const clearFilters = () => {
    setSelectedSupplier('all');
    setStartDate('');
    setEndDate('');
  };

  if (loadingOrders || loadingSuppliers) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-36">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Relatórios</h1>
        <Badge variant="secondary" className="text-sm">
          {filteredOrders.length} pedidos
        </Badge>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplier">Fornecedor</Label>
              <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                <SelectTrigger id="supplier">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os fornecedores</SelectItem>
                  {activeSuppliers.map(supplier => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="startDate">Data Início</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endDate">Data Fim</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          
          {(selectedSupplier !== 'all' || startDate || endDate) && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Limpar filtros
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <Package className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-2xl font-bold">{totals.count}</p>
            <p className="text-xs text-muted-foreground">Pedidos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-2xl font-bold">{totals.totalItems}</p>
            <p className="text-xs text-muted-foreground">Itens</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-6 w-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold text-primary">
              R$ {totals.totalValue.toFixed(0)}
            </p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">Nenhum pedido fechado encontrado</p>
            {(selectedSupplier !== 'all' || startDate || endDate) && (
              <p className="text-sm text-muted-foreground mt-2">
                Tente ajustar os filtros
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map(order => (
            <Card key={order.id} className="overflow-hidden">
              <CardContent className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="h-5 w-5 text-primary flex-shrink-0" />
                      <h3 className="text-lg font-bold truncate">
                        {order.supplier?.name || 'Fornecedor não definido'}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <span>
                        {format(new Date(order.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                  <Badge className="bg-slate-600 text-white">
                    {PURCHASE_ORDER_STATUS_LABELS[order.status]}
                  </Badge>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Itens</p>
                    <p className="text-xl font-bold">{order.items?.length || 0}</p>
                  </div>
                  <div className="bg-primary/10 rounded-lg p-3">
                    <p className="text-xs text-primary mb-1">Valor</p>
                    <p className="text-xl font-bold text-primary">
                      R$ {(order.total_received || order.total_estimated).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 h-12"
                    onClick={() => setDetailsOrder(order)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Detalhes
                  </Button>
                  <Button
                    variant="outline"
                    className="h-12 px-4"
                    onClick={() => handleGeneratePdf(order)}
                  >
                    <FileDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="h-12 px-4 text-green-600 hover:text-green-700 hover:bg-green-50"
                    onClick={() => handleShareWhatsApp(order)}
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={!!detailsOrder} onOpenChange={(open) => !open && setDetailsOrder(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {detailsOrder?.supplier?.name || 'Detalhes do Pedido'}
            </DialogTitle>
          </DialogHeader>
          
          {detailsOrder && (
            <div className="space-y-4">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Data do Pedido</p>
                  <p className="font-medium">
                    {format(new Date(detailsOrder.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
                {detailsOrder.received_at && (
                  <div>
                    <p className="text-muted-foreground">Data do Recebimento</p>
                    <p className="font-medium">
                      {format(new Date(detailsOrder.received_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge className="bg-slate-600 text-white">
                    {PURCHASE_ORDER_STATUS_LABELS[detailsOrder.status]}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Valor Total</p>
                  <p className="font-bold text-primary">
                    R$ {(detailsOrder.total_received || detailsOrder.total_estimated).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <p className="font-medium mb-2">Itens do Pedido</p>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead className="text-right">Qtd</TableHead>
                        <TableHead className="text-right">Preço</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailsOrder.items?.map(item => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.product?.name || 'Produto'}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.quantity_received || item.quantity} {item.unit}
                          </TableCell>
                          <TableCell className="text-right">
                            R$ {(item.unit_cost_actual || item.unit_cost_estimated || 0).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Notes */}
              {detailsOrder.notes && (
                <div>
                  <p className="font-medium mb-1">Observações</p>
                  <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                    {detailsOrder.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
