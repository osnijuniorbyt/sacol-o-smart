import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { useProducts } from '@/hooks/useProducts';
import { useStock } from '@/hooks/useStock';
import { useSuppliers } from '@/hooks/useSuppliers';
import { ProductImage } from '@/components/ui/product-image';
import { AiPricingAssistant } from '@/components/pricing/AiPricingAssistant';
import { supabase } from '@/integrations/supabase/client';
import {
  Product,
  ProductCategory,
  UnitType,
  CATEGORY_LABELS,
  UNIT_LABELS
} from '@/types/database';
import { Apple, Plus, Pencil, Search, Building2, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Produtos() {
  const { products, createProduct, updateProduct, isLoading, refresh } = useProducts();
  const { getProductStock } = useStock();
  const { suppliers } = useSuppliers();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [expandedAiProductId, setExpandedAiProductId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    plu: '',
    name: '',
    category: 'outros' as ProductCategory,
    unit: 'kg' as UnitType,
    unidade_venda: 'PARA_KG' as 'PARA_UN' | 'PARA_KG',
    peso_por_unidade: '1',
    price: '',
    min_stock: '',
    is_active: true,
    codigo_balanca: '',
    custo_compra: '',
    supplier_id: '',
    shelf_life: '7',
  });

  const resetForm = () => {
    setFormData({
      plu: '',
      name: '',
      category: 'outros',
      unit: 'kg',
      unidade_venda: 'PARA_KG',
      peso_por_unidade: '1',
      price: '',
      min_stock: '',
      is_active: true,
      codigo_balanca: '',
      custo_compra: '',
      supplier_id: '',
      shelf_life: '7',
    });
    setEditingProduct(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (product: Product) => {
    setFormData({
      plu: product.plu,
      name: product.name,
      category: product.category,
      unit: product.unit,
      unidade_venda: product.unidade_venda || 'PARA_KG',
      peso_por_unidade: String(product.peso_por_unidade || 1),
      price: String(product.price),
      min_stock: String(product.min_stock),
      is_active: product.is_active,
      codigo_balanca: product.codigo_balanca || '',
      custo_compra: String(product.custo_compra || ''),
      supplier_id: product.supplier_id || '',
      shelf_life: String(product.shelf_life || 7),
    });
    setEditingProduct(product);
    setDialogOpen(true);
  };

  const handleGenerateImage = async () => {
    if (!editingProduct) {
      toast.error('Salve o produto primeiro antes de gerar a imagem');
      return;
    }

    if (!formData.name.trim()) {
      toast.error('Nome do produto é obrigatório para gerar imagem');
      return;
    }

    setIsGeneratingImage(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-product-image', {
        body: {
          productName: formData.name,
          productId: editingProduct.id,
          category: CATEGORY_LABELS[formData.category]
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Ilustração gerada com sucesso!');
        refresh();
        // Update the editing product with the new image
        setEditingProduct(prev => prev ? { ...prev, image_url: data.imageUrl } : null);
      } else {
        throw new Error(data?.error || 'Erro desconhecido');
      }
    } catch (error: any) {
      console.error('Error generating image:', error);
      toast.error('Erro ao gerar ilustração: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      plu: formData.plu,
      name: formData.name,
      category: formData.category,
      unit: formData.unit,
      unidade_venda: formData.unidade_venda,
      peso_por_unidade: parseFloat(formData.peso_por_unidade) || 1,
      price: parseFloat(formData.price),
      min_stock: parseFloat(formData.min_stock) || 0,
      is_active: formData.is_active,
      codigo_balanca: formData.codigo_balanca || null,
      custo_compra: parseFloat(formData.custo_compra) || 0,
      supplier_id: formData.supplier_id || null,
      shelf_life: parseInt(formData.shelf_life) || 7,
    };

    if (editingProduct) {
      await updateProduct.mutateAsync({ id: editingProduct.id, ...data });
    } else {
      await createProduct.mutateAsync(data);
    }

    setDialogOpen(false);
    resetForm();
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.plu.includes(searchQuery);
    const matchesCategory = filterCategory === 'all' || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getSupplierName = (supplierId: string | null) => {
    if (!supplierId) return null;
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier?.name || null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Produtos</h1>
          <p className="text-muted-foreground">Cadastro e gerenciamento</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="h-14 px-6" onClick={openCreateDialog}>
              <Plus className="mr-2 h-5 w-5" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>PLU (5 dígitos)</Label>
                  <Input
                    value={formData.plu}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      plu: e.target.value.replace(/\D/g, '').slice(0, 5)
                    }))}
                    placeholder="00001"
                    className="h-12"
                    maxLength={5}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Código Balança</Label>
                  <Input
                    value={formData.codigo_balanca}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      codigo_balanca: e.target.value.replace(/\D/g, '').slice(0, 20)
                    }))}
                    placeholder="Opcional"
                    className="h-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Nome do Produto</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Banana Prata"
                  className="h-12"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      category: value as ProductCategory
                    }))}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Unidade</Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      unit: value as UnitType
                    }))}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(UNIT_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Preço Venda (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="0.00"
                    className="h-12"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Custo Compra (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.custo_compra}
                    onChange={(e) => setFormData(prev => ({ ...prev, custo_compra: e.target.value }))}
                    placeholder="0.00"
                    className="h-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Fornecedor Principal</Label>
                <Select
                  value={formData.supplier_id}
                  onValueChange={(value) => setFormData(prev => ({
                    ...prev,
                    supplier_id: value === 'none' ? '' : value
                  }))}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Selecionar fornecedor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {suppliers.filter(s => s.is_active).map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Conversão PDV</Label>
                  <Select
                    value={formData.unidade_venda}
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      unidade_venda: value as 'PARA_UN' | 'PARA_KG'
                    }))}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PARA_KG">Para Quilos (kg)</SelectItem>
                      <SelectItem value="PARA_UN">Para Unidades (un)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Peso/Unidade (kg)</Label>
                  <Input
                    type="number"
                    step="0.001"
                    value={formData.peso_por_unidade}
                    onChange={(e) => setFormData(prev => ({ ...prev, peso_por_unidade: e.target.value }))}
                    placeholder="1"
                    className="h-12"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Estoque Mín</Label>
                  <Input
                    type="number"
                    step="0.001"
                    value={formData.min_stock}
                    onChange={(e) => setFormData(prev => ({ ...prev, min_stock: e.target.value }))}
                    placeholder="0"
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Shelf Life (dias)</Label>
                  <Input
                    type="number"
                    value={formData.shelf_life}
                    onChange={(e) => setFormData(prev => ({ ...prev, shelf_life: e.target.value }))}
                    placeholder="7"
                    className="h-12"
                  />
                </div>
              </div>

              {/* Image section - only show when editing */}
              {editingProduct && (
                <div className="space-y-3 p-4 rounded-lg border border-border">
                  <Label>Imagem do Produto</Label>
                  <div className="flex items-center gap-4">
                    <ProductImage
                      src={editingProduct.image_url}
                      alt={editingProduct.name}
                      category={editingProduct.category}
                      size="xl"
                    />
                    <div className="flex-1 space-y-2">
                      <p className="text-sm text-muted-foreground">
                        {editingProduct.image_url
                          ? 'Ilustração atual do produto'
                          : 'Nenhuma ilustração cadastrada'}
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-12"
                        onClick={handleGenerateImage}
                        disabled={isGeneratingImage}
                      >
                        {isGeneratingImage ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Gerando...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Gerar Ilustração com IA
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                <Label htmlFor="is_active" className="cursor-pointer">Produto Ativo</Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
              </div>

              <Button
                type="submit"
                className="w-full h-14"
                disabled={createProduct.isPending || updateProduct.isPending}
              >
                {createProduct.isPending || updateProduct.isPending
                  ? 'Salvando...'
                  : editingProduct
                    ? 'Salvar Alterações'
                    : 'Criar Produto'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters - MD3 Style */}
      <Card className="bg-card/50 border-0 shadow-none">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou PLU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 rounded-full bg-muted/50 border-0 focus-visible:ring-2 focus-visible:ring-primary/20"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="h-14 w-full sm:w-48 rounded-full bg-muted/50 border-0">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid - MD3 Style */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <Card className="bg-white shadow-sm rounded-2xl border-0">
          <CardContent className="py-12 text-center">
            <Apple className="mx-auto h-16 w-16 mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground text-lg">Nenhum produto encontrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {filteredProducts.map(product => {
            const stock = getProductStock(product.id);
            const isLowStock = stock <= product.min_stock;
            const supplierName = getSupplierName(product.supplier_id);

            // Pastel backgrounds based on category - ALWAYS applied
            const categoryBgColors: Record<string, string> = {
              verduras: 'bg-green-50',
              frutas: 'bg-amber-50',
              legumes: 'bg-orange-50',
              temperos: 'bg-purple-50',
              outros: 'bg-gray-50',
            };

            const categoryEmojis: Record<string, string> = {
              frutas: '🍎',
              verduras: '🥬',
              legumes: '🥕',
              temperos: '🌿',
              outros: '📦',
            };

            const bgColor = categoryBgColors[product.category] || 'bg-gray-50';
            const emoji = categoryEmojis[product.category] || '📦';

            return (
              <Card
                key={product.id}
                className={`bg-white shadow-sm hover:shadow-md rounded-2xl border-0 transition-all duration-200 overflow-hidden ${!product.is_active ? 'opacity-60' : ''}`}
              >
                {/* Image Area - Fixed h-32 with pastel background */}
                <div className={`relative h-32 ${bgColor} flex items-center justify-center`}>
                  {/* Edit Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 text-foreground/40 hover:text-foreground hover:bg-white/50 z-10"
                    onClick={() => openEditDialog(product)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>

                  {/* Inactive Badge */}
                  {!product.is_active && (
                    <span className="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full bg-white/80 text-muted-foreground z-10">
                      Inativo
                    </span>
                  )}

                  {/* Image or Emoji - Fixed size h-20 w-20 */}
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="h-20 w-20 object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-5xl">{emoji}</span>
                  )}
                </div>

                {/* Content Area - p-4 */}
                <CardContent className="p-4 pt-3">
                  {/* Product Name */}
                  <h3 className="font-semibold text-center line-clamp-2 mb-0.5 text-sm leading-tight">
                    {product.name}
                  </h3>

                  {/* PLU - Discrete */}
                  <p className="text-xs text-muted-foreground text-center mb-2">
                    PLU: {product.plu}
                  </p>

                  {/* Price - Highlighted */}
                  <div className="text-center mb-2">
                    <span className="text-lg font-bold text-green-700">
                      {formatCurrency(Number(product.price))}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">/{product.unit}</span>
                  </div>

                  {/* Pills: Stock + Category */}
                  <div className="flex flex-wrap justify-center gap-1.5">
                    <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${isLowStock
                      ? 'bg-red-50 text-red-700'
                      : 'bg-blue-50 text-blue-700'
                      }`}>
                      {stock.toFixed(1)} {product.unit}
                    </span>
                    <span className="text-[10px] px-2 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">
                      {CATEGORY_LABELS[product.category]}
                    </span>
                  </div>

                  {/* Supplier - if exists */}
                  {supplierName && (
                    <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground mt-2 pt-2 border-t border-gray-100">
                      <Building2 className="h-3 w-3" />
                      <span className="truncate">{supplierName}</span>
                    </div>
                  )}

                  {/* AI Pricing Assistant */}
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <AiPricingAssistant
                      product={product}
                      onPriceUpdated={() => setExpandedAiProductId(null)}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
