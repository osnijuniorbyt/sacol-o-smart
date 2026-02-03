import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ShoppingCart, Minus, Plus, Trash2 } from 'lucide-react';
import { PedidoItem } from '@/hooks/useOrderForm';
import { Product } from '@/types/database';

interface OrderItemsTableProps {
  items: PedidoItem[];
  products: Product[];
  totalItens: number;
  totalPedido: number;
  hasItemsWithoutPrice: boolean;
  onAddProduct: (product: Product) => void;
  onDecrement: (productId: string) => void;
  onUpdatePrice: (productId: string, price: string) => void;
  onRemoveItem: (productId: string) => void;
}

export function OrderItemsTable({
  items,
  products,
  totalItens,
  totalPedido,
  hasItemsWithoutPrice,
  onAddProduct,
  onDecrement,
  onUpdatePrice,
  onRemoveItem,
}: OrderItemsTableProps) {
  if (items.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShoppingCart className="h-5 w-5" />
          3. Itens do Pedido ({items.length} produtos, {totalItens} caixas)
        </CardTitle>
        {hasItemsWithoutPrice && (
          <p className="text-sm text-muted-foreground">
            💡 Preço é opcional - pode preencher ao faturar
          </p>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead className="text-center w-20">Cx</TableHead>
              <TableHead className="text-right w-28">R$/Cx</TableHead>
              <TableHead className="text-right w-24">Subtotal</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map(item => (
              <TableRow key={item.product_id}>
                <TableCell className="font-medium">{item.product_name}</TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onDecrement(item.product_id)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="font-mono w-6 text-center">{item.quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        const product = products.find(p => p.id === item.product_id);
                        if (product) onAddProduct(product);
                      }}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Input
                    inputMode="decimal"
                    value={item.unit_cost ?? ''}
                    onChange={(e) => onUpdatePrice(item.product_id, e.target.value)}
                    className="h-8 w-24 text-right font-mono text-sm"
                    placeholder="0,00"
                  />
                </TableCell>
                <TableCell className="text-right font-mono">
                  {item.subtotal !== null 
                    ? `R$ ${item.subtotal.toFixed(2)}`
                    : <span className="text-muted-foreground">-</span>
                  }
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => onRemoveItem(item.product_id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {totalPedido > 0 && (
              <TableRow className="bg-muted/50">
                <TableCell colSpan={3} className="text-right font-bold">TOTAL ESTIMADO</TableCell>
                <TableCell className="text-right font-mono font-bold text-lg">
                  R$ {totalPedido.toFixed(2)}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
