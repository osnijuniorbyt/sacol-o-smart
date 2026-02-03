import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProductImage } from '@/components/ui/product-image';
import { ProductSupplierIndicator } from './ProductSupplierIndicator';
import { Product } from '@/types/database';
import { Package, Plus, Minus, Lock } from 'lucide-react';

interface ProductGridProps {
  products: Product[];
  selectedSupplierId: string;
  getQuantity: (productId: string) => number;
  onAddProduct: (product: Product) => void;
  onDecrement: (productId: string) => void;
  isSupplierSelected: boolean;
}

export function ProductGrid({ 
  products, 
  selectedSupplierId,
  getQuantity, 
  onAddProduct, 
  onDecrement,
  isSupplierSelected 
}: ProductGridProps) {
  // Bloqueio se não selecionou fornecedor
  if (!isSupplierSelected) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12">
          <div className="text-center">
            <Lock className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-xl font-medium text-muted-foreground">
              Selecione um fornecedor acima
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              para habilitar a adição de produtos
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Package className="h-5 w-5" />
          2. Selecione os Produtos (Caixas)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {products.map(product => {
            const qty = getQuantity(product.id);
            const lastPrice = (product as any).ultimo_preco_caixa;
            
            return (
              <div 
                key={product.id}
                className={`relative p-3 rounded-lg border-2 transition-all ${
                  qty > 0 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {/* Badge de quantidade */}
                {qty > 0 && (
                  <Badge 
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center"
                  >
                    {qty}
                  </Badge>
                )}
                
                <div className="flex items-center gap-2 mb-2">
                  <ProductImage 
                    src={product.image_url}
                    alt={product.name}
                    category={product.category}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {product.name}
                    </div>
                    <ProductSupplierIndicator 
                      productId={product.id} 
                      selectedSupplierId={selectedSupplierId}
                    />
                  </div>
                </div>
                
                {lastPrice > 0 && (
                  <div className="text-xs text-muted-foreground mb-2">
                    Último: R$ {lastPrice.toFixed(2)}/cx
                  </div>
                )}
                
                <div className="flex items-center gap-1">
                  {qty > 0 && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10"
                      onClick={() => onDecrement(product.id)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant={qty > 0 ? "default" : "outline"}
                    size="icon"
                    className="h-10 flex-1"
                    onClick={() => onAddProduct(product)}
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
