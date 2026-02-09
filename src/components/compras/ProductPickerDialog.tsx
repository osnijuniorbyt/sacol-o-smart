import { useState, useEffect, useCallback, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
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
import { ProductImage } from '@/components/ui/product-image';
import { Product, CATEGORY_LABELS } from '@/types/database';
import { Search, Plus, Minus, Package, Check, ShoppingCart } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface SelectedProduct {
  product: Product;
  quantity: number;
}

interface ProductItemProps {
  product: Product;
  isSelected: boolean;
  quantity: number;
  multiSelect: boolean;
  onSelect: (product: Product) => void;
  onIncrement: (productId: string) => void;
  onDecrement: (productId: string) => void;
}

// Componente de item de produto extraído e memoizado para evitar re-renders
const ProductItem = memo(function ProductItem({
  product,
  isSelected,
  quantity,
  multiSelect,
  onSelect,
  onIncrement,
  onDecrement,
}: ProductItemProps) {
  return (
    <div
      className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
        isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-accent'
      }`}
    >
      <button
        onClick={() => onSelect(product)}
        className="flex items-center gap-3 flex-1 min-w-0 text-left"
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
      </button>

      {multiSelect ? (
        isSelected ? (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => onDecrement(product.id)}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="font-mono font-bold text-lg w-8 text-center">
              {quantity}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => onIncrement(product.id)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-primary"
            onClick={() => onSelect(product)}
          >
            <Plus className="h-5 w-5" />
          </Button>
        )
      ) : (
        <Plus className="h-5 w-5 text-primary" />
      )}
    </div>
  );
});

// Skeleton de carregamento para o estado inicial
function ProductListSkeleton() {
  return (
    <div className="p-4 space-y-4">
      {[1, 2, 3].map((cat) => (
        <div key={cat}>
          <Skeleton className="h-4 w-24 mb-2" />
          <div className="space-y-2">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex items-center gap-3 p-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

interface ProductPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  excludeProductIds?: string[];
  onSelectProduct: (product: Product) => void;
  /** Modo multi-seleção: permite selecionar vários produtos de uma vez */
  multiSelect?: boolean;
  onSelectMultiple?: (selections: { product: Product; quantity: number }[]) => void;
}

export function ProductPickerDialog({
  open,
  onOpenChange,
  products,
  excludeProductIds = [],
  onSelectProduct,
  multiSelect = false,
  onSelectMultiple,
}: ProductPickerDialogProps) {
  const isMobile = useIsMobile();
  const [search, setSearch] = useState('');
  const [selections, setSelections] = useState<Map<string, SelectedProduct>>(new Map());
  
  // Estado para garantir que o conteúdo só renderize após a animação do Drawer
  // Isso resolve o problema do ScrollArea vazio no iOS Safari
  const [isReady, setIsReady] = useState(false);

  // Aguarda a animação do Drawer terminar antes de mostrar o conteúdo
  useEffect(() => {
    if (open) {
      // Delay breve para garantir que o layout foi calculado após animação
      const timer = setTimeout(() => setIsReady(true), 50);
      return () => clearTimeout(timer);
    } else {
      setIsReady(false);
    }
  }, [open]);

  // Filtrar produtos não excluídos e pela busca
  const filteredProducts = products.filter(p => {
    if (excludeProductIds.includes(p.id)) return false;
    const trimmedSearch = search.trim();
    if (!trimmedSearch) return true;
    return p.name.toLowerCase().includes(trimmedSearch.toLowerCase()) ||
           p.plu.includes(trimmedSearch);
  });

  // Agrupar por categoria
  const groupedProducts = filteredProducts.reduce((acc, product) => {
    const category = product.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  const handleSelect = useCallback((product: Product) => {
    if (multiSelect) {
      // No modo multi, adiciona/incrementa a seleção
      setSelections(prev => {
        const newMap = new Map(prev);
        const existing = newMap.get(product.id);
        if (existing) {
          newMap.set(product.id, { ...existing, quantity: existing.quantity + 1 });
        } else {
          newMap.set(product.id, { product, quantity: 1 });
        }
        return newMap;
      });
    } else {
      // Modo single: comportamento original
      onSelectProduct(product);
      onOpenChange(false);
      setSearch('');
    }
  }, [multiSelect, onSelectProduct, onOpenChange]);

  const handleDecrement = useCallback((productId: string) => {
    setSelections(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(productId);
      if (existing && existing.quantity > 1) {
        newMap.set(productId, { ...existing, quantity: existing.quantity - 1 });
      } else {
        newMap.delete(productId);
      }
      return newMap;
    });
  }, []);

  const handleIncrement = useCallback((productId: string) => {
    setSelections(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(productId);
      if (existing) {
        newMap.set(productId, { ...existing, quantity: existing.quantity + 1 });
      }
      return newMap;
    });
  }, []);

  const handleConfirmMultiple = () => {
    if (selections.size === 0) return;
    
    const selectionsArray = Array.from(selections.values());
    
    if (onSelectMultiple) {
      onSelectMultiple(selectionsArray);
    } else {
      // Fallback: adicionar um por um
      selectionsArray.forEach(({ product, quantity }) => {
        for (let i = 0; i < quantity; i++) {
          onSelectProduct(product);
        }
      });
    }
    
    setSelections(new Map());
    setSearch('');
    onOpenChange(false);
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setSelections(new Map());
      setSearch('');
    }
    onOpenChange(isOpen);
  };

  const totalSelected = Array.from(selections.values()).reduce((sum, s) => sum + s.quantity, 0);

  // Footer com botão de confirmar (multi-select)
  const multiSelectFooter = multiSelect && selections.size > 0 ? (
    <div className="p-4 border-t bg-background">
      <Button
        onClick={handleConfirmMultiple}
        className="w-full h-14 text-base font-semibold"
      >
        <Check className="h-5 w-5 mr-2" />
        Adicionar {totalSelected} {totalSelected === 1 ? 'produto' : 'produtos'}
      </Button>
    </div>
  ) : null;

  // Conteúdo da busca e listagem
  const searchAndListContent = (
    <>
      {/* Busca */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produto por nome ou PLU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>
        {multiSelect && (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            <ShoppingCart className="inline h-3 w-3 mr-1" />
            Toque para adicionar, ajuste quantidades e confirme
          </p>
        )}
      </div>

      {/* Lista de produtos - usando div nativa em vez de ScrollArea para iOS Safari */}
      <div 
        className="flex-1 overflow-y-auto overscroll-contain min-h-[200px]"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {!isReady ? (
          <ProductListSkeleton />
        ) : filteredProducts.length === 0 ? (
          <div className="py-8 text-center px-4">
            <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              {search.trim() ? `Nenhum produto encontrado para "${search}"` : 'Nenhum produto disponível'}
            </p>
            <p className="text-xs text-muted-foreground/70 mt-3 leading-relaxed">
              Feche esta janela e use o botão <span className="font-semibold text-primary">[+]</span> ao lado de "Itens do Pedido" para cadastrar novos produtos.
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
              <div key={category}>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category}
                </h3>
                <div className="space-y-2">
                  {categoryProducts.map(product => {
                    const selection = selections.get(product.id);
                    return (
                      <ProductItem
                        key={product.id}
                        product={product}
                        isSelected={!!selection}
                        quantity={selection?.quantity ?? 0}
                        multiSelect={multiSelect}
                        onSelect={handleSelect}
                        onIncrement={handleIncrement}
                        onDecrement={handleDecrement}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {multiSelectFooter}
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleClose}>
        <DrawerContent className="max-h-[85vh] flex flex-col">
          <DrawerHeader className="border-b">
            <DrawerTitle>
              {multiSelect ? 'Selecionar Produtos' : 'Adicionar Produto do Catálogo'}
            </DrawerTitle>
          </DrawerHeader>
          <div className="flex flex-col flex-1 overflow-hidden">
            {searchAndListContent}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // DESKTOP
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>
            {multiSelect ? 'Selecionar Produtos' : 'Adicionar Produto do Catálogo'}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col flex-1 overflow-hidden">
          {searchAndListContent}
        </div>
      </DialogContent>
    </Dialog>
  );
}
