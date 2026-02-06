import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PurchaseOrder } from '@/types/database';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Building2,
  Calendar,
  FileDown,
  Package,
  Percent,
  Scale,
} from 'lucide-react';

interface ClosingReportCardProps {
  order: PurchaseOrder;
  onExportPdf: () => void;
  isHighlighted?: boolean;
}

export function ClosingReportCard({ order, onExportPdf, isHighlighted }: ClosingReportCardProps) {
  const items = order.items || [];
  
  // Calcular totais
  const totalPesoLiquido = items.reduce((sum, i) => {
    const pesoBruto = i.estimated_kg || 1;
    const tara = i.tare_total || 0;
    return sum + Math.max(0, pesoBruto - tara);
  }, 0);
  
  const totalCusto = order.total_received || order.total_estimated;
  
  // Calcular margem média do pedido
  const margemMedia = items.reduce((sum, i) => {
    const product = i.product;
    if (!product) return sum;
    const custo = product.custo_compra || 0;
    const preco = product.price || 0;
    return sum + (custo > 0 && preco > custo ? (1 - custo / preco) * 100 : 60);
  }, 0) / Math.max(items.length, 1);
  
  const closedDate = order.received_at 
    ? format(new Date(order.received_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
    : format(new Date(order.created_at), 'dd/MM/yyyy', { locale: ptBR });

  return (
    <Card className={isHighlighted ? 'ring-2 ring-primary shadow-lg' : ''}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="h-5 w-5 text-primary flex-shrink-0" />
              <h3 className="font-bold truncate">
                {order.supplier?.name || 'Fornecedor'}
              </h3>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-3 w-3 flex-shrink-0" />
              <span>{closedDate}</span>
            </div>
          </div>
          <Badge variant="secondary" className="flex-shrink-0">
            {items.length} itens
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-muted/50 rounded-lg p-2 text-center">
            <Scale className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-lg font-bold font-mono">{totalPesoLiquido.toFixed(1)}</p>
            <p className="text-[10px] text-muted-foreground">kg líq.</p>
          </div>
          <div className="bg-primary/10 rounded-lg p-2 text-center">
            <Package className="h-4 w-4 mx-auto mb-1 text-primary" />
            <p className="text-lg font-bold font-mono text-primary">
              R$ {totalCusto.toFixed(0)}
            </p>
            <p className="text-[10px] text-muted-foreground">custo total</p>
          </div>
          <div className="bg-success/10 rounded-lg p-2 text-center">
            <Percent className="h-4 w-4 mx-auto mb-1 text-success" />
            <p className="text-lg font-bold font-mono text-success">
              {margemMedia.toFixed(1)}%
            </p>
            <p className="text-[10px] text-muted-foreground">margem</p>
          </div>
        </div>

        {order.notes && (
          <p className="text-xs text-muted-foreground bg-muted/30 rounded p-2 mb-3 truncate">
            {order.notes}
          </p>
        )}

        <Button
          variant="outline"
          size="sm"
          className="w-full h-10"
          onClick={onExportPdf}
        >
          <FileDown className="mr-2 h-4 w-4" />
          Exportar PDF
        </Button>
      </CardContent>
    </Card>
  );
}
