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
import { ProductImage } from '@/components/ui/product-image';
import { Product, CATEGORY_LABELS } from '@/types/database';
import { Search, Plus, Package, Loader2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

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
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);

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

  // Criar produto direto ao clicar (sem formulário)
  const handleQuickCreate = async () => {
    if (!search.trim() || search.length <= 2) return;

    setIsCreating(true);
    try {
      // Buscar maior PLU numérico existente para gerar sequencial
      const { data: allProducts } = await supabase
        .from('products')
        .select('plu')
        .order('plu', { ascending: false })
        .limit(200);

      let nextPluNum = 1;
      if (allProducts && allProducts.length > 0) {
        for (const item of allProducts) {
          const numMatch = item.plu.match(/\d+/);
          if (numMatch) {
            const num = parseInt(numMatch[0], 10);
            if (num >= nextPluNum) {
              nextPluNum = num + 1;
            }
          }
        }
      }

      const plu = String(nextPluNum).padStart(4, '0');

      const { data: newProduct, error } = await supabase
        .from('products')
        .insert({
          name: search.trim(),
          plu,
          category: 'frutas', // Padrão para CEASA
          price: 0,
          min_stock: 0,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(`Produto "${search}" criado com PLU ${plu}!`);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      
      // Selecionar automaticamente
      handleSelect(newProduct as Product);
      
    } catch (error: any) {
      console.error('Erro ao criar produto:', error);
      toast.error('Erro ao criar produto: ' + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  // Mostrar botão criar apenas quando: search > 2 chars E nenhum resultado
  const showCreateButton = search.length > 2 && filteredProducts.length === 0;

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="border-b">
            <DrawerTitle>Adicionar Produto do Catálogo</DrawerTitle>
          </DrawerHeader>
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

            <ScrollArea className="flex-1">
              {filteredProducts.length === 0 ? (
                /* ESTADO VAZIO - MOBILE */
                <div className="py-8 text-center px-4">
                  <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-muted-foreground mb-4">
                    {search ? `Nenhum produto encontrado para "${search}"` : 'Nenhum produto encontrado'}
                  </p>
                  {showCreateButton && (
                    <Button
                      onClick={handleQuickCreate}
                      disabled={isCreating}
                      className="h-14 text-base px-6 w-full max-w-xs"
                    >
                      {isCreating ? (
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      ) : (
                        <Plus className="h-5 w-5 mr-2" />
                      )}
                      {isCreating ? 'Criando...' : `Criar "${search}"`}
                    </Button>
                  )}
                </div>
              ) : (
                /* LISTA DE PRODUTOS - MOBILE */
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
        </DrawerContent>
      </Drawer>
    );
  }

  // DESKTOP
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Adicionar Produto do Catálogo</DialogTitle>
        </DialogHeader>
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

          <ScrollArea className="flex-1">
            {filteredProducts.length === 0 ? (
              /* ESTADO VAZIO - DESKTOP */
              <div className="py-8 text-center px-4">
                <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground mb-4">
                  {search ? `Nenhum produto encontrado para "${search}"` : 'Nenhum produto encontrado'}
                </p>
                {showCreateButton && (
                  <Button
                    onClick={handleQuickCreate}
                    disabled={isCreating}
                    className="h-14 text-base px-6"
                  >
                    {isCreating ? (
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    ) : (
                      <Plus className="h-5 w-5 mr-2" />
                    )}
                    {isCreating ? 'Criando...' : `Criar "${search}"`}
                  </Button>
                )}
              </div>
            ) : (
              /* LISTA DE PRODUTOS - DESKTOP */
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
      </DialogContent>
    </Dialog>
  );
}
