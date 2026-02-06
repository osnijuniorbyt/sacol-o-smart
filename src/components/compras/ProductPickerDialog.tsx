import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Badge } from '@/components/ui/badge';
import { ProductImage } from '@/components/ui/product-image';
import { Product, CATEGORY_LABELS } from '@/types/database';
import { Search, Plus, Package } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface ProductPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  excludeProductIds?: string[];
  onSelectProduct: (product: Product) => void;
}

export function ProductPickerDialog({
  open,
  onOpenChange,
  products,
  excludeProductIds = [],
  onSelectProduct,
}: ProductPickerDialogProps) {
  const isMobile = useIsMobile();
  const [search, setSearch] = useState('');

  // Filtrar produtos não excluídos e pela busca
  const filteredProducts = products.filter(p => {
    if (excludeProductIds.includes(p.id)) return false;
    if (!search) return true;
    return p.name.toLowerCase().includes(search.toLowerCase()) ||
           p.plu.includes(search);
  });

  // Agrupar por categoria
  const groupedProducts = filteredProducts.reduce((acc, product) => {
    const category = product.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  const handleSelect = (product: Product) => {
    onSelectProduct(product);
    onOpenChange(false);
    setSearch('');
  };

  const contentElement = (
    <div className="flex flex-col h-full">
      {/* Busca */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produto por nome ou PLU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-12 text-base"
            autoFocus
          />
        </div>
      </div>

      {/* Lista de produtos */}
      <ScrollArea className="flex-1">
        {filteredProducts.length === 0 ? (
          <div className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground">Nenhum produto encontrado</p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
              <div key={category}>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category}
                </h3>
                <div className="space-y-2">
                  {categoryProducts.map(product => (
                    <button
                      key={product.id}
                      onClick={() => handleSelect(product)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors text-left"
                    >
                      <ProductImage
                        src={product.image_url}
                        alt={product.name}
                        category={product.category}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{product.name}</div>
                        <div className="text-xs text-muted-foreground">
                          PLU: {product.plu}
                          {(product as any).ultimo_preco_caixa > 0 && (
                            <span> • Último: R$ {(product as any).ultimo_preco_caixa.toFixed(2)}</span>
                          )}
                        </div>
                      </div>
                      <Plus className="h-5 w-5 text-primary" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="border-b">
            <DrawerTitle>Adicionar Produto do Catálogo</DrawerTitle>
          </DrawerHeader>
          {contentElement}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Adicionar Produto do Catálogo</DialogTitle>
        </DialogHeader>
        {contentElement}
      </DialogContent>
    </Dialog>
  );
}
