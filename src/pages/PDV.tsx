import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useProducts } from '@/hooks/useProducts';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { useBarcode } from '@/hooks/useBarcode';
import { useSales } from '@/hooks/useSales';
import { useStock } from '@/hooks/useStock';
import { FocusTrap } from '@/components/FocusTrap';
import { CartItemRow } from '@/components/pdv/CartItemRow';
import { TotalsPanel } from '@/components/pdv/TotalsPanel';
import { CartItem } from '@/types/database';
import { Barcode, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';

export default function PDV() {
  const { products, getProductByPlu } = useProducts();
  const { parseEAN13 } = useBarcode();
  const { createSale } = useSales();
  const { getProductStock } = useStock();
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [lastScannedCode, setLastScannedCode] = useState<string>('');

  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }, []);

  const addToCart = useCallback((productId: string, quantity: number = 1) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const stock = getProductStock(productId);
    
    setCart(prev => {
      const existingItem = prev.find(item => item.product.id === productId);
      const currentQuantity = existingItem ? existingItem.quantity : 0;

      if (currentQuantity + quantity > stock) {
        toast.error(`Estoque insuficiente. Disponível: ${stock.toFixed(3)} ${product.unit}`);
        return prev;
      }

      if (existingItem) {
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

    // Play beep sound on successful add
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = 1000;
      gainNode.gain.value = 0.1;
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
      // Audio not supported
    }
  }, [products, getProductStock]);

  // Handle barcode scan from scanner
  const handleScan = useCallback((barcode: string) => {
    setLastScannedCode(barcode);
    
    const data = parseEAN13(barcode);
    if (data) {
      // Use cached products from React Query (no DB call)
      const product = getProductByPlu(data.plu);
      if (product) {
        addToCart(product.id, data.weight);
        toast.success(`${product.name} - ${data.weight.toFixed(3)} kg`);
      } else {
        toast.error(`Produto não encontrado: PLU ${data.plu}`);
      }
    } else {
      toast.error('Código de barras inválido');
    }
  }, [parseEAN13, getProductByPlu, addToCart]);

  // Initialize barcode scanner
  useBarcodeScanner({
    onScan: handleScan,
    enabled: true
  });

  const updateQuantity = useCallback((productId: string, delta: number) => {
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
  }, [getProductStock]);

  const removeFromCart = useCallback((productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    toast.info('Carrinho limpo');
  }, []);

  const finalizeSale = useCallback(async () => {
    if (cart.length === 0) {
      toast.error('Carrinho vazio');
      return;
    }

    // Only DB call happens here on finalize
    await createSale.mutateAsync(cart);
    setCart([]);
  }, [cart, createSale]);

  const total = cart.reduce((sum, item) => sum + item.total, 0);

  return (
    <FocusTrap enabled={true}>
      <div className="flex flex-col lg:grid lg:grid-cols-10 gap-4 h-[calc(100vh-120px)] lg:h-[calc(100vh-120px)]">
        {/* Left Panel - Cart Items (70% on desktop, full on mobile) */}
        <div className="col-span-7 flex flex-col gap-4 flex-1 lg:flex-none min-h-0">
          {/* Scanner status indicator */}
          <Card className="bg-card flex-shrink-0">
            <CardContent className="p-3 lg:p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Barcode className="h-5 w-5 lg:h-6 lg:w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm lg:text-base">Scanner Ativo</p>
                    <p className="text-xs lg:text-sm text-muted-foreground hidden sm:block">
                      Aguardando leitura do código de barras...
                    </p>
                  </div>
                </div>
                {lastScannedCode && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Último:</p>
                    <p className="font-mono text-xs lg:text-sm">{lastScannedCode}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Cart Items List */}
          <Card className="flex-1 overflow-hidden flex flex-col bg-card min-h-0">
            <CardHeader className="pb-2 border-b flex-shrink-0">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                <span className="font-semibold">Itens do Carrinho</span>
                <span className="ml-auto text-muted-foreground">
                  {cart.length} {cart.length === 1 ? 'item' : 'itens'}
                </span>
              </div>
            </CardHeader>
            <ScrollArea className="flex-1">
              <div className="p-3 lg:p-4">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 lg:py-16 text-muted-foreground">
                    <ShoppingCart className="h-12 w-12 lg:h-16 lg:w-16 mb-4 opacity-50" />
                    <p className="text-base lg:text-lg">Carrinho vazio</p>
                    <p className="text-sm">Escaneie um produto para começar</p>
                  </div>
                ) : (
                  <div className="space-y-2 lg:space-y-3">
                    {cart.map(item => (
                      <CartItemRow
                        key={item.product.id}
                        item={item}
                        onUpdateQuantity={updateQuantity}
                        onRemove={removeFromCart}
                        formatCurrency={formatCurrency}
                      />
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </Card>
        </div>

        {/* Right Panel - Totals (30% on desktop, fixed bottom on mobile) */}
        <div className="lg:col-span-3 flex-shrink-0">
          <TotalsPanel
            itemsCount={cart.length}
            total={total}
            onFinalize={finalizeSale}
            onClearCart={clearCart}
            isProcessing={createSale.isPending}
            formatCurrency={formatCurrency}
          />
        </div>
      </div>
    </FocusTrap>
  );
}
