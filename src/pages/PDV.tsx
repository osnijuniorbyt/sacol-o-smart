import { useState, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ApprovalCard } from '@/components/pricing/ApprovalCard';
import { usePendingApprovals } from '@/hooks/usePendingApprovals';
import { formatBRL } from '@/types/pricing';
import {
  Inbox,
  CheckCircle2,
  Sparkles,
  PartyPopper,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Legacy PDV imports (preserved from original)
// ---------------------------------------------------------------------------
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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

// =============================================================================
// COMPONENT: PDV (Refactored with Inbox)
// =============================================================================
// The PDV page now has two tabs:
// 1. "Inbox" — Pricing approval cards (Human-in-the-Loop)
// 2. "PDV Venda" — Legacy barcode scanner / cart (preserved as-is)
// =============================================================================

export default function PDV() {
  // =========================================================================
  // INBOX TAB STATE
  // =========================================================================
  const {
    pendingApprovals,
    approvedApprovals,
    isLoading: isApprovalsLoading,
    approvePrice,
    updateSuggestedPrice,
    refresh,
  } = usePendingApprovals();

  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set());

  const handleApprove = useCallback(
    async (id: string, price: number) => {
      // 1. Start exit animation
      setExitingIds((prev) => new Set(prev).add(id));

      // 2. Wait for animation to finish
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 3. Actually approve (removes from pending list)
      await approvePrice(id, price);

      // 4. Clean up exiting set
      setExitingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    },
    [approvePrice]
  );

  // =========================================================================
  // LEGACY PDV TAB STATE (preserved as-is)
  // =========================================================================
  const { products, getProductByPlu } = useProducts();
  const { parseEAN13 } = useBarcode();
  const { createSale } = useSales();
  const { getProductStock } = useStock();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [lastScannedCode, setLastScannedCode] = useState<string>('');

  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }, []);

  const addToCart = useCallback(
    (productId: string, quantity: number = 1) => {
      const product = products.find((p) => p.id === productId);
      if (!product) return;

      const stock = getProductStock(productId);

      setCart((prev) => {
        const existingItem = prev.find((item) => item.product.id === productId);
        const currentQuantity = existingItem ? existingItem.quantity : 0;

        if (currentQuantity + quantity > stock) {
          toast.error(
            `Estoque insuficiente. Disponível: ${stock.toFixed(3)} ${product.unit}`
          );
          return prev;
        }

        if (existingItem) {
          return prev.map((item) =>
            item.product.id === productId
              ? {
                ...item,
                quantity: item.quantity + quantity,
                total: (item.quantity + quantity) * item.unit_price,
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
            total: quantity * Number(product.price),
          },
        ];
      });

      try {
        const audioContext = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
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
    },
    [products, getProductStock]
  );

  const handleScan = useCallback(
    (barcode: string) => {
      setLastScannedCode(barcode);
      const data = parseEAN13(barcode);
      if (data) {
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
    },
    [parseEAN13, getProductByPlu, addToCart]
  );

  useBarcodeScanner({
    onScan: handleScan,
    enabled: true,
  });

  const updateQuantity = useCallback(
    (productId: string, delta: number) => {
      setCart((prev) =>
        prev
          .map((item) => {
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
              total: newQuantity * item.unit_price,
            };
          })
          .filter(Boolean) as CartItem[]
      );
    },
    [getProductStock]
  );

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
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
    await createSale.mutateAsync(cart);
    setCart([]);
  }, [cart, createSale]);

  const total = cart.reduce((sum, item) => sum + item.total, 0);

  // =========================================================================
  // RENDER
  // =========================================================================
  return (
    <Tabs defaultValue="inbox" className="w-full">
      {/* ================================================================= */}
      {/* TAB NAVIGATION                                                     */}
      {/* ================================================================= */}
      <TabsList className="grid w-full grid-cols-2 h-14 p-1.5 bg-muted/50 rounded-2xl mb-4">
        <TabsTrigger
          value="inbox"
          className="h-full text-sm font-bold rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-md transition-all gap-2"
        >
          <Inbox className="h-4 w-4" />
          Aguardando
          {pendingApprovals.length > 0 && (
            <Badge
              variant="destructive"
              className="ml-1 h-5 min-w-[20px] px-1.5 text-[10px] font-bold rounded-full animate-pulse"
            >
              {pendingApprovals.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger
          value="pdv"
          className="h-full text-sm font-bold rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-md transition-all gap-2"
        >
          <ShoppingCart className="h-4 w-4" />
          PDV Venda
        </TabsTrigger>
      </TabsList>

      {/* ================================================================= */}
      {/* TAB 1: INBOX DE APROVAÇÃO                                         */}
      {/* ================================================================= */}
      <TabsContent value="inbox" className="mt-0">
        <div className="space-y-4">
          {/* Header section */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-foreground">
                  Inbox de Precificação
                </h2>
                <p className="text-xs text-muted-foreground">
                  {pendingApprovals.length > 0
                    ? `${pendingApprovals.length} ${pendingApprovals.length === 1 ? 'item aguardando' : 'itens aguardando'} sua aprovação`
                    : 'Tudo em dia!'}
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-xl"
              onClick={refresh}
              disabled={isApprovalsLoading}
            >
              <RefreshCw
                className={cn(
                  'h-4 w-4',
                  isApprovalsLoading && 'animate-spin'
                )}
              />
            </Button>
          </div>

          {/* Pending approvals list */}
          {pendingApprovals.length > 0 ? (
            <div className="space-y-3">
              {pendingApprovals.map((approval) => (
                <ApprovalCard
                  key={approval.id}
                  approval={approval}
                  onApprove={handleApprove}
                  onUpdatePrice={updateSuggestedPrice}
                  isExiting={exitingIds.has(approval.id)}
                />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="h-24 w-24 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
                <PartyPopper className="h-12 w-12 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                Tudo limpo! 🎉
              </h3>
              <p className="text-sm text-muted-foreground text-center max-w-xs">
                Nenhuma pendência de precificação. Os preços estão todos
                atualizados e aprovados.
              </p>

              {/* Approved summary */}
              {approvedApprovals.length > 0 && (
                <div className="mt-6 w-full max-w-sm">
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">
                        Aprovados Hoje
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {approvedApprovals.map((a) => (
                        <div
                          key={a.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-muted-foreground">
                            {a.product.name}
                          </span>
                          <span className="font-bold text-foreground">
                            {formatBRL(a.approved_price ?? a.suggested_price)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </TabsContent>

      {/* ================================================================= */}
      {/* TAB 2: PDV VENDA (Legacy — preserved)                             */}
      {/* ================================================================= */}
      <TabsContent value="pdv" className="mt-0">
        <FocusTrap enabled={true}>
          <div className="flex flex-col lg:grid lg:grid-cols-10 gap-4 h-[calc(100vh-200px)] lg:h-[calc(100vh-200px)]">
            {/* Left Panel - Cart Items (70% on desktop, full on mobile) */}
            <div className="col-span-7 flex flex-col gap-4 flex-1 lg:flex-none min-h-0">
              {/* Scanner status indicator - MD3 Style */}
              <Card className="bg-card shadow-sm rounded-2xl border-border/50 flex-shrink-0">
                <CardContent className="p-3 lg:p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                        <Barcode className="h-5 w-5 lg:h-6 lg:w-6 text-emerald-500" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm lg:text-base">
                          Scanner Ativo
                        </p>
                        <p className="text-xs lg:text-sm text-muted-foreground hidden sm:block">
                          Aguardando leitura do código de barras...
                        </p>
                      </div>
                    </div>
                    {lastScannedCode && (
                      <div className="text-right bg-muted/50 px-3 py-1.5 rounded-xl">
                        <p className="text-[10px] text-muted-foreground uppercase">
                          Último
                        </p>
                        <p className="font-mono text-xs lg:text-sm font-medium">
                          {lastScannedCode}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Cart Items List */}
              <Card className="flex-1 overflow-hidden flex flex-col bg-muted/30 rounded-2xl border-border/50 min-h-0">
                <CardHeader className="pb-2 border-b border-border flex-shrink-0 bg-card rounded-t-2xl">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <ShoppingCart className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-semibold">Itens do Carrinho</span>
                    <span className="ml-auto text-xs bg-muted px-2.5 py-1 rounded-full font-medium">
                      {cart.length} {cart.length === 1 ? 'item' : 'itens'}
                    </span>
                  </div>
                </CardHeader>
                <ScrollArea className="flex-1">
                  <div className="p-3 lg:p-4">
                    {cart.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 lg:py-16">
                        <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
                          <ShoppingCart className="h-10 w-10 text-muted-foreground/30" />
                        </div>
                        <p className="text-base lg:text-lg font-medium text-muted-foreground">
                          Carrinho vazio
                        </p>
                        <p className="text-sm text-muted-foreground/70">
                          Escaneie um produto para começar
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 lg:space-y-3">
                        {cart.map((item) => (
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

            {/* Right Panel - Totals */}
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
      </TabsContent>
    </Tabs>
  );
}
