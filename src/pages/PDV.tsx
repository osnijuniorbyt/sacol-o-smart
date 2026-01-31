import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProducts } from '@/hooks/useProducts';
import { useBarcode } from '@/hooks/useBarcode';
import { useSales } from '@/hooks/useSales';
import { useStock } from '@/hooks/useStock';
import { CartItem } from '@/types/database';
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard,
  Barcode,
  Search
} from 'lucide-react';
import { toast } from 'sonner';

export default function PDV() {
  const { products, getProductByPlu } = useProducts();
  const { lastBarcode, parseEAN13, clearLastBarcode } = useBarcode();
  const { createSale } = useSales();
  const { getProductStock } = useStock();
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [manualBarcode, setManualBarcode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Process barcode from scanner
  useEffect(() => {
    if (lastBarcode) {
      const data = parseEAN13(lastBarcode);
      if (data) {
        const product = getProductByPlu(data.plu);
        if (product) {
          addToCart(product.id, data.weight);
        } else {
          toast.error(`Produto não encontrado: PLU ${data.plu}`);
        }
      }
      clearLastBarcode();
    }
  }, [lastBarcode]);

  const addToCart = (productId: string, quantity: number = 1) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const stock = getProductStock(productId);
    const existingItem = cart.find(item => item.product.id === productId);
    const currentQuantity = existingItem ? existingItem.quantity : 0;

    if (currentQuantity + quantity > stock) {
      toast.error(`Estoque insuficiente. Disponível: ${stock.toFixed(3)} ${product.unit}`);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.product.id === productId);
      if (existing) {
        return prev.map(item =>
          item.product.id === productId
            ? {
                ...item,
                quantity: item.quantity + quantity,
                total: (item.quantity + quantity) * item.unit_price
              }
            : item
        );
      }
      return [
        ...prev,
        {
          product,
          quantity,
          unit_price: Number(product.price),
          total: quantity * Number(product.price)
        }
      ];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev =>
      prev
        .map(item => {
          if (item.product.id !== productId) return item;
          const newQuantity = item.quantity + delta;
          if (newQuantity <= 0) return null;
          
          const stock = getProductStock(productId);
          if (newQuantity > stock) {
            toast.error('Estoque insuficiente');
            return item;
          }
          
          return {
            ...item,
            quantity: newQuantity,
            total: newQuantity * item.unit_price
          };
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleManualBarcode = () => {
    if (manualBarcode.length !== 13) {
      toast.error('Código de barras deve ter 13 dígitos');
      return;
    }

    const data = parseEAN13(manualBarcode);
    if (data) {
      const product = getProductByPlu(data.plu);
      if (product) {
        addToCart(product.id, data.weight);
        setManualBarcode('');
      } else {
        toast.error(`Produto não encontrado: PLU ${data.plu}`);
      }
    } else {
      toast.error('Código de barras inválido');
    }
  };

  const finalizeSale = async () => {
    if (cart.length === 0) {
      toast.error('Carrinho vazio');
      return;
    }

    await createSale.mutateAsync(cart);
    setCart([]);
  };

  const total = cart.reduce((sum, item) => sum + item.total, 0);

  const filteredProducts = products.filter(p =>
    p.is_active &&
    (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     p.plu.includes(searchQuery))
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-120px)]">
      {/* Product selection */}
      <div className="lg:col-span-2 flex flex-col gap-4">
        {/* Barcode input */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Código de barras (13 dígitos)"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value.replace(/\D/g, '').slice(0, 13))}
                  onKeyDown={(e) => e.key === 'Enter' && handleManualBarcode()}
                  className="pl-10 h-14 text-lg"
                />
              </div>
              <Button onClick={handleManualBarcode} className="h-14 px-6">
                Adicionar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Product search */}
        <Card className="flex-1 overflow-hidden flex flex-col">
          <CardHeader className="pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Buscar produto por nome ou PLU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-14"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {filteredProducts.map(product => {
                const stock = getProductStock(product.id);
                return (
                  <Button
                    key={product.id}
                    variant="outline"
                    className="h-auto py-4 px-3 flex flex-col items-start justify-start"
                    onClick={() => addToCart(product.id)}
                    disabled={stock <= 0}
                  >
                    <span className="font-medium text-left line-clamp-2">{product.name}</span>
                    <span className="text-xs text-muted-foreground">PLU: {product.plu}</span>
                    <span className="text-primary font-bold">{formatCurrency(Number(product.price))}/{product.unit}</span>
                    <span className={`text-xs ${stock <= product.min_stock ? 'text-destructive' : 'text-muted-foreground'}`}>
                      Estoque: {stock.toFixed(2)}
                    </span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cart */}
      <Card className="flex flex-col h-full">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Carrinho ({cart.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto pb-0">
          {cart.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Carrinho vazio
            </p>
          ) : (
            <div className="space-y-3">
              {cart.map(item => (
                <div key={item.product.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">{item.product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(item.unit_price)}/{item.product.unit}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => removeFromCart(item.product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10"
                        onClick={() => updateQuantity(item.product.id, -0.1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-20 text-center font-medium">
                        {item.quantity.toFixed(3)} {item.product.unit}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10"
                        onClick={() => updateQuantity(item.product.id, 0.1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <span className="font-bold text-primary">
                      {formatCurrency(item.total)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <div className="p-4 border-t mt-auto">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-medium">Total</span>
            <span className="text-2xl font-bold text-primary">
              {formatCurrency(total)}
            </span>
          </div>
          <Button
            className="w-full h-14 text-lg"
            onClick={finalizeSale}
            disabled={cart.length === 0 || createSale.isPending}
          >
            <CreditCard className="mr-2 h-5 w-5" />
            {createSale.isPending ? 'Processando...' : 'Finalizar Venda'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
