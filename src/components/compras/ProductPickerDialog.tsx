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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProductImage } from '@/components/ui/product-image';
import { Product, CATEGORY_LABELS } from '@/types/database';
import { Search, Plus, Package, Loader2, Sparkles } from 'lucide-react';
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
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductCategory, setNewProductCategory] = useState<string>('outros');

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
    setShowQuickCreate(false);
  };

  const handleShowQuickCreate = () => {
    setNewProductName(search);
    setShowQuickCreate(true);
  };

  const handleQuickCreate = async () => {
    if (!newProductName.trim()) {
      toast.error('Informe o nome do produto');
      return;
    }

    setIsCreating(true);
    try {
      const plu = `P${Date.now().toString().slice(-6)}`;

      const { data: newProduct, error } = await supabase
        .from('products')
        .insert({
          name: newProductName.trim(),
          plu,
          category: newProductCategory as any,
          price: 0,
          min_stock: 0,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(`Produto "${newProductName}" criado!`);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      handleSelect(newProduct as Product);
      
    } catch (error: any) {
      console.error('Erro ao criar produto:', error);
      toast.error('Erro ao criar produto: ' + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancelQuickCreate = () => {
    setShowQuickCreate(false);
    setNewProductName('');
    setNewProductCategory('outros');
  };

  // JSX inline para evitar remount - MOBILE
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
              {showQuickCreate ? (
                /* FORMULÁRIO DE CRIAÇÃO RÁPIDA - MOBILE */
                <div className="p-4 space-y-4 bg-primary/5 border-2 border-primary border-dashed rounded-lg mx-4 my-4">
                  <div className="flex items-center gap-2 text-primary font-medium">
                    <Sparkles className="h-5 w-5" />
                    Criar Produto Rápido
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Nome do Produto *</label>
                      <Input
                        value={newProductName}
                        onChange={(e) => setNewProductName(e.target.value)}
                        placeholder="Ex: Tomate Italiano"
                        className="h-12 text-base"
                        autoFocus
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Categoria</label>
                      <Select value={newProductCategory} onValueChange={setNewProductCategory}>
                        <SelectTrigger className="h-12">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover z-50">
                          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      onClick={handleCancelQuickCreate}
                      className="flex-1 h-12"
                      disabled={isCreating}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleQuickCreate}
                      className="flex-1 h-12"
                      disabled={isCreating || !newProductName.trim()}
                    >
                      {isCreating ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          <Plus className="h-5 w-5 mr-2" />
                          Criar e Adicionar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : filteredProducts.length === 0 ? (
                /* ESTADO VAZIO - MOBILE */
                <div className="py-8 text-center px-4">
                  <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-muted-foreground mb-4">
                    {search ? `Nenhum produto encontrado para "${search}"` : 'Nenhum produto encontrado'}
                  </p>
                  {search && (
                    <Button
                      variant="outline"
                      onClick={handleShowQuickCreate}
                      className="h-12 border-primary text-primary hover:bg-primary/10"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Criar "{search}"
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

  // JSX inline para evitar remount - DESKTOP
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
            {showQuickCreate ? (
              /* FORMULÁRIO DE CRIAÇÃO RÁPIDA - DESKTOP */
              <div className="p-4 space-y-4 bg-primary/5 border-2 border-primary border-dashed rounded-lg mx-4 my-4">
                <div className="flex items-center gap-2 text-primary font-medium">
                  <Sparkles className="h-5 w-5" />
                  Criar Produto Rápido
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Nome do Produto *</label>
                    <Input
                      value={newProductName}
                      onChange={(e) => setNewProductName(e.target.value)}
                      placeholder="Ex: Tomate Italiano"
                      className="h-12 text-base"
                      autoFocus
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Categoria</label>
                    <Select value={newProductCategory} onValueChange={setNewProductCategory}>
                      <SelectTrigger className="h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={handleCancelQuickCreate}
                    className="flex-1 h-12"
                    disabled={isCreating}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleQuickCreate}
                    className="flex-1 h-12"
                    disabled={isCreating || !newProductName.trim()}
                  >
                    {isCreating ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Plus className="h-5 w-5 mr-2" />
                        Criar e Adicionar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : filteredProducts.length === 0 ? (
              /* ESTADO VAZIO - DESKTOP */
              <div className="py-8 text-center px-4">
                <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground mb-4">
                  {search ? `Nenhum produto encontrado para "${search}"` : 'Nenhum produto encontrado'}
                </p>
                {search && (
                  <Button
                    variant="outline"
                    onClick={handleShowQuickCreate}
                    className="h-12 border-primary text-primary hover:bg-primary/10"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Criar "{search}"
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
