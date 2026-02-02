import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useProductSupplierStats, ProductSupplierRanking } from '@/hooks/useProductSupplierStats';
import { useProducts } from '@/hooks/useProducts';
import { ProductImage } from '@/components/ui/product-image';
import { History, Package, TrendingUp, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SupplierHistorySheetProps {
  supplierId: string;
  supplierName: string;
}

export function SupplierHistorySheet({ supplierId, supplierName }: SupplierHistorySheetProps) {
  const { getProductsForSupplier, isLoading } = useProductSupplierStats();
  const { products } = useProducts();
  
  const supplierProducts = getProductsForSupplier(supplierId);
  
  const totalQuantity = supplierProducts.reduce((sum, p) => sum + p.total_quantity, 0);
  const totalOrders = supplierProducts.reduce((sum, p) => sum + p.order_count, 0);

  const getProductDetails = (productId: string) => {
    return products.find(p => p.id === productId);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <History className="h-4 w-4" />
          Histórico
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico: {supplierName}
          </SheetTitle>
        </SheetHeader>
        
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">
            Carregando...
          </div>
        ) : supplierProducts.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <Package className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>Nenhum pedido encontrado para este fornecedor</p>
            <p className="text-sm mt-1">
              O histórico será preenchido conforme pedidos forem enviados
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Package className="h-4 w-4" />
                  Produtos
                </div>
                <div className="text-2xl font-bold">{supplierProducts.length}</div>
              </div>
              <div className="p-3 rounded-lg bg-primary/10">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  Total Caixas
                </div>
                <div className="text-2xl font-bold">{totalQuantity}</div>
              </div>
            </div>

            {/* Products List */}
            <div>
              <h4 className="font-medium mb-2">Produtos Comprados</h4>
              <ScrollArea className="h-[calc(100vh-280px)]">
                <div className="space-y-2 pr-4">
                  {supplierProducts.map((stat) => {
                    const product = getProductDetails(stat.product_id);
                    return (
                      <div
                        key={stat.product_id}
                        className="flex items-center gap-3 p-3 rounded-lg border"
                      >
                        <ProductImage
                          src={product?.image_url}
                          alt={product?.name || 'Produto'}
                          category={product?.category}
                          size="sm"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {product?.name || 'Produto removido'}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{stat.total_quantity} cx</span>
                            <span>•</span>
                            <span>{stat.order_count} pedidos</span>
                          </div>
                        </div>
                        {stat.rank === 1 && (
                          <Badge variant="default" className="shrink-0">
                            Principal
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
