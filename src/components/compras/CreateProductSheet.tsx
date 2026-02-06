import { useState } from 'react';
import { Button } from '@/components/ui/button';
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Product, CATEGORY_LABELS } from '@/types/database';
import { Plus, Loader2, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface CreateProductSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductCreated?: (product: Product) => void;
  /** Nome inicial para pré-preencher o campo (opcional) */
  initialName?: string;
}

type UnitType = 'kg' | 'un' | 'maco' | 'caixa' | 'bandeja' | 'engradado' | 'saco' | 'penca';
type CategoryType = 'frutas' | 'verduras' | 'legumes' | 'temperos' | 'outros';

const UNIT_OPTIONS: { value: UnitType; label: string }[] = [
  { value: 'kg', label: 'Quilograma (kg)' },
  { value: 'un', label: 'Unidade (un)' },
  { value: 'maco', label: 'Maço' },
  { value: 'caixa', label: 'Caixa' },
  { value: 'bandeja', label: 'Bandeja' },
  { value: 'engradado', label: 'Engradado' },
  { value: 'saco', label: 'Saco' },
  { value: 'penca', label: 'Penca' },
];

export function CreateProductSheet({
  open,
  onOpenChange,
  onProductCreated,
  initialName = '',
}: CreateProductSheetProps) {
  const queryClient = useQueryClient();
  
  const [name, setName] = useState(initialName);
  const [unit, setUnit] = useState<UnitType>('kg');
  const [category, setCategory] = useState<CategoryType>('outros');
  const [costPrice, setCostPrice] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Reset form when opening
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setName(initialName);
      setUnit('kg');
      setCategory('outros');
      setCostPrice('');
    }
    onOpenChange(isOpen);
  };

  // Gera PLU sequencial automático (lógica do handleQuickCreate)
  const generateNextPlu = async (): Promise<string> => {
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

    return String(nextPluNum).padStart(4, '0');
  };

  const handleSubmit = async () => {
    // Validação
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error('Nome do produto é obrigatório');
      return;
    }

    if (trimmedName.length < 2) {
      toast.error('Nome deve ter pelo menos 2 caracteres');
      return;
    }

    if (trimmedName.length > 100) {
      toast.error('Nome deve ter no máximo 100 caracteres');
      return;
    }

    setIsCreating(true);
    try {
      const plu = await generateNextPlu();
      
      // Parse custo (opcional)
      let custoCompra: number | null = null;
      if (costPrice.trim()) {
        const parsed = parseFloat(costPrice.replace(',', '.'));
        if (!isNaN(parsed) && parsed >= 0) {
          custoCompra = parsed;
        }
      }

      const { data: newProduct, error } = await supabase
        .from('products')
        .insert({
          name: trimmedName,
          plu,
          category,
          unit,
          price: 0,
          custo_compra: custoCompra,
          min_stock: 0,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(`Produto "${trimmedName}" criado com PLU ${plu}!`);
      
      // Invalidar cache de produtos
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      
      // Callback com produto criado
      if (onProductCreated && newProduct) {
        onProductCreated(newProduct as Product);
      }
      
      // Fechar sheet
      onOpenChange(false);
      
    } catch (error: any) {
      console.error('Erro ao criar produto:', error);
      toast.error('Erro ao criar produto: ' + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  const isValid = name.trim().length >= 2;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="h-auto max-h-[85vh] rounded-t-2xl">
        <SheetHeader className="text-left pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Criar Novo Produto
          </SheetTitle>
          <SheetDescription>
            Preencha os dados básicos. O PLU será gerado automaticamente.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 pb-6">
          {/* Nome do Produto */}
          <div className="space-y-2">
            <Label htmlFor="product-name" className="text-sm font-medium">
              Nome do Produto <span className="text-destructive">*</span>
            </Label>
            <Input
              id="product-name"
              type="text"
              placeholder="Ex: Banana Prata"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 text-base"
              autoFocus
              maxLength={100}
            />
          </div>

          {/* Unidade e Categoria lado a lado */}
          <div className="grid grid-cols-2 gap-3">
            {/* Unidade */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Unidade</Label>
              <Select value={unit} onValueChange={(v) => setUnit(v as UnitType)}>
                <SelectTrigger className="h-12 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Categoria */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Categoria</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as CategoryType)}>
                <SelectTrigger className="h-12 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Preço de Custo (opcional) */}
          <div className="space-y-2">
            <Label htmlFor="cost-price" className="text-sm font-medium">
              Preço de Custo (R$) <span className="text-muted-foreground text-xs">(opcional)</span>
            </Label>
            <Input
              id="cost-price"
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
              className="h-12 text-base"
            />
          </div>
        </div>

        {/* Botão de Salvar */}
        <Button
          onClick={handleSubmit}
          disabled={!isValid || isCreating}
          className="w-full h-14 text-base font-semibold"
        >
          {isCreating ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Criando...
            </>
          ) : (
            <>
              <Plus className="h-5 w-5 mr-2" />
              Criar Produto
            </>
          )}
        </Button>
      </SheetContent>
    </Sheet>
  );
}
