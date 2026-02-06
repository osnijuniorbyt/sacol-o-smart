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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { useSuppliers } from '@/hooks/useSuppliers';
import { usePackagings } from '@/hooks/usePackagings';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Box,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  Package,
  RotateCcw,
  Search,
  AlertTriangle,
  FileDown,
  ArrowUpDown,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import { PACKAGING_MATERIAL_LABELS, PackagingMaterial } from '@/types/database';

interface PackagingMovement {
  id: string;
  orderId: string;
  orderDate: string;
  supplierName: string;
  supplierId: string;
  packagingId: string;
  packagingName: string;
  packagingCode: string | null;
  material: PackagingMaterial;
  quantity: number;
  productName: string;
  isReturned: boolean;
  returnedAt: string | null;
}

export default function ReturnablePackagingReport() {
  const { closedOrders, receivedOrders } = usePurchaseOrders();
  const { activeSuppliers } = useSuppliers();
  const { packagings } = usePackagings();
  
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  const [selectedPackaging, setSelectedPackaging] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [returnDialog, setReturnDialog] = useState<PackagingMovement | null>(null);

  // Get returnable packagings only
  const returnablePackagings = useMemo(() => {
    return packagings.filter(p => p.is_returnable && p.is_active);
  }, [packagings]);

  // Build movements from orders
  const movements = useMemo(() => {
    const allOrders = [...closedOrders, ...receivedOrders];
    const movementList: PackagingMovement[] = [];

    allOrders.forEach(order => {
      if (!order.items) return;
      
      order.items.forEach(item => {
        if (!item.packaging_id) return;
        
        const packaging = packagings.find(p => p.id === item.packaging_id);
        if (!packaging || !packaging.is_returnable) return;

        movementList.push({
          id: `${order.id}-${item.id}`,
          orderId: order.id,
          orderDate: order.received_at || order.created_at,
          supplierName: order.supplier?.name || 'Desconhecido',
          supplierId: order.supplier_id || '',
          packagingId: packaging.id,
          packagingName: packaging.name,
          packagingCode: packaging.codigo,
          material: packaging.material,
          quantity: item.quantity_received || item.quantity,
          productName: item.product?.name || 'Produto',
          isReturned: false, // TODO: track in database
          returnedAt: null,
        });
      });
    });

    return movementList.sort((a, b) => 
      new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
    );
  }, [closedOrders, receivedOrders, packagings]);

  // Filter movements
  const filteredMovements = useMemo(() => {
    return movements.filter(m => {
      if (selectedSupplier !== 'all' && m.supplierId !== selectedSupplier) return false;
      if (selectedPackaging !== 'all' && m.packagingId !== selectedPackaging) return false;
      if (statusFilter === 'pending' && m.isReturned) return false;
      if (statusFilter === 'returned' && !m.isReturned) return false;
      
      const movementDate = new Date(m.orderDate);
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (movementDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (movementDate > end) return false;
      }
      
      return true;
    });
  }, [movements, selectedSupplier, selectedPackaging, statusFilter, startDate, endDate]);

  // Calculate totals by supplier
  const supplierTotals = useMemo(() => {
    const totals: Record<string, { name: string; pending: number; returned: number }> = {};
    
    filteredMovements.forEach(m => {
      if (!totals[m.supplierId]) {
        totals[m.supplierId] = { name: m.supplierName, pending: 0, returned: 0 };
      }
      if (m.isReturned) {
        totals[m.supplierId].returned += m.quantity;
      } else {
        totals[m.supplierId].pending += m.quantity;
      }
    });
    
    return Object.values(totals).sort((a, b) => b.pending - a.pending);
  }, [filteredMovements]);

  // Calculate totals by packaging type
  const packagingTotals = useMemo(() => {
    const totals: Record<string, { name: string; code: string | null; pending: number; returned: number }> = {};
    
    filteredMovements.forEach(m => {
      if (!totals[m.packagingId]) {
        totals[m.packagingId] = { name: m.packagingName, code: m.packagingCode, pending: 0, returned: 0 };
      }
      if (m.isReturned) {
        totals[m.packagingId].returned += m.quantity;
      } else {
        totals[m.packagingId].pending += m.quantity;
      }
    });
    
    return Object.values(totals).sort((a, b) => b.pending - a.pending);
  }, [filteredMovements]);

  // Summary stats
  const stats = useMemo(() => {
    const pending = filteredMovements.filter(m => !m.isReturned).reduce((sum, m) => sum + m.quantity, 0);
    const returned = filteredMovements.filter(m => m.isReturned).reduce((sum, m) => sum + m.quantity, 0);
    return {
      total: pending + returned,
      pending,
      returned,
      pendingRate: pending > 0 ? ((pending / (pending + returned)) * 100) : 0,
    };
  }, [filteredMovements]);

  const getMaterialIcon = (material: PackagingMaterial) => {
    switch (material) {
      case 'plastico': return '🧊';
      case 'madeira': return '🪵';
      case 'papelao': return '📦';
      case 'isopor': return '❄️';
      default: return '📦';
    }
  };

  const clearFilters = () => {
    setSelectedSupplier('all');
    setSelectedPackaging('all');
    setStatusFilter('all');
    setStartDate('');
    setEndDate('');
  };

  const handleExportPdf = () => {
    try {
      const doc = new jsPDF();
      
      doc.setFontSize(18);
      doc.text('Relatório de Vasilhames Retornáveis', 14, 22);
      doc.setFontSize(10);
      doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 14, 30);
      
      // Summary
      doc.setFontSize(12);
      doc.text(`Total de Movimentações: ${stats.total}`, 14, 42);
      doc.text(`Pendentes de Devolução: ${stats.pending}`, 14, 50);
      doc.text(`Devolvidos: ${stats.returned}`, 14, 58);

      // Table by supplier
      if (supplierTotals.length > 0) {
        doc.setFontSize(14);
        doc.text('Resumo por Fornecedor', 14, 72);
        
        autoTable(doc, {
          head: [['Fornecedor', 'Pendentes', 'Devolvidos', 'Total']],
          body: supplierTotals.map(s => [
            s.name,
            s.pending.toString(),
            s.returned.toString(),
            (s.pending + s.returned).toString(),
          ]),
          startY: 76,
          styles: { fontSize: 9 },
          headStyles: { fillColor: [34, 197, 94] },
        });
      }

      // Detailed movements
      const finalY = (doc as any).lastAutoTable?.finalY || 90;
      doc.setFontSize(14);
      doc.text('Movimentações Detalhadas', 14, finalY + 15);
      
      autoTable(doc, {
        head: [['Data', 'Fornecedor', 'Vasilhame', 'Qtd', 'Status']],
        body: filteredMovements.slice(0, 50).map(m => [
          format(new Date(m.orderDate), 'dd/MM/yy', { locale: ptBR }),
          m.supplierName,
          `${m.packagingCode || ''} ${m.packagingName}`.trim(),
          m.quantity.toString(),
          m.isReturned ? 'Devolvido' : 'Pendente',
        ]),
        startY: finalY + 20,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [34, 197, 94] },
      });

      doc.save(`vasilhames-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success('PDF exportado com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar PDF');
      console.error(error);
    }
  };

  if (returnablePackagings.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <Box className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground">Nenhum vasilhame retornável cadastrado</p>
          <p className="text-sm text-muted-foreground mt-2">
            Cadastre vasilhames com a opção "Retornável" ativada
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Fornecedor</Label>
              <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os fornecedores</SelectItem>
                  {activeSuppliers.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Vasilhame</Label>
              <Select value={selectedPackaging} onValueChange={setSelectedPackaging}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os vasilhames</SelectItem>
                  {returnablePackagings.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.codigo ? `${p.codigo} - ` : ''}{p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="returned">Devolvidos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data Início</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Data Fim</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            {(selectedSupplier !== 'all' || selectedPackaging !== 'all' || statusFilter !== 'all' || startDate || endDate) && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Limpar filtros
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleExportPdf}>
              <FileDown className="mr-2 h-4 w-4" />
              Exportar PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <Package className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total Movimentado</p>
          </CardContent>
        </Card>
        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 mx-auto mb-2 text-warning" />
            <p className="text-2xl font-bold text-warning">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">Pendentes</p>
          </CardContent>
        </Card>
        <Card className="border-success/50 bg-success/5">
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-success" />
            <p className="text-2xl font-bold text-success">{stats.returned}</p>
            <p className="text-xs text-muted-foreground">Devolvidos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <RotateCcw className="h-6 w-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{stats.pendingRate.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">Taxa Pendente</p>
          </CardContent>
        </Card>
      </div>

      {/* Summary by Supplier */}
      {supplierTotals.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Resumo por Fornecedor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {supplierTotals.map((supplier, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{supplier.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    {supplier.pending > 0 && (
                      <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
                        <Clock className="mr-1 h-3 w-3" />
                        {supplier.pending} pendentes
                      </Badge>
                    )}
                    {supplier.returned > 0 && (
                      <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        {supplier.returned} devolvidos
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary by Packaging Type */}
      {packagingTotals.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Box className="h-4 w-4" />
              Resumo por Tipo de Vasilhame
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {packagingTotals.map((pkg, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📦</span>
                    <div>
                      <p className="font-medium text-sm">{pkg.name}</p>
                      {pkg.code && (
                        <p className="text-xs text-muted-foreground font-mono">{pkg.code}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-warning">{pkg.pending}</p>
                    <p className="text-xs text-muted-foreground">pendentes</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Movements Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4" />
            Movimentações ({filteredMovements.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredMovements.length === 0 ? (
            <div className="py-12 text-center">
              <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">Nenhuma movimentação encontrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Vasilhame</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-center">Qtd</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMovements.slice(0, 100).map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {format(new Date(movement.orderDate), 'dd/MM/yy', { locale: ptBR })}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {movement.supplierName}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{getMaterialIcon(movement.material)}</span>
                          <div>
                            <p className="text-sm">{movement.packagingName}</p>
                            {movement.packagingCode && (
                              <p className="text-xs text-muted-foreground font-mono">
                                {movement.packagingCode}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {movement.productName}
                      </TableCell>
                      <TableCell className="text-center font-mono font-bold">
                        {movement.quantity}
                      </TableCell>
                      <TableCell className="text-center">
                        {movement.isReturned ? (
                          <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Devolvido
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            Pendente
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Return Dialog (for future use) */}
      <Dialog open={!!returnDialog} onOpenChange={() => setReturnDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Devolução</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Confirmar devolução de {returnDialog?.quantity} {returnDialog?.packagingName}?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturnDialog(null)}>
              Cancelar
            </Button>
            <Button onClick={() => setReturnDialog(null)}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Confirmar Devolução
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
