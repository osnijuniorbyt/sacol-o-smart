import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProducts } from '@/hooks/useProducts';
import { useSuppliers } from '@/hooks/useSuppliers';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { OrdersList } from '@/components/compras/OrdersList';
import { SuggestedOrderDialog } from '@/components/compras/SuggestedOrderDialog';
import { NewOrderForm, OrderItem } from '@/components/compras/NewOrderForm';
import { 
  Plus, 
  Truck,
  CheckCircle2,
  Loader2
} from 'lucide-react';

// Tipo para itens vindos da sugestão
interface SuggestedOrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_cost: number | null;
}

export default function Compras() {
  const { activeProducts, isLoading: loadingProducts } = useProducts();
  const { activeSuppliers, isLoading: loadingSuppliers } = useSuppliers();
  const { 
    pendingOrders, 
    receivedOrders, 
    isLoading: loadingOrders,
    deleteOrder,
    finalizeOrder
  } = usePurchaseOrders();
  
  const [activeTab, setActiveTab] = useState('novo');
  
  // Estado para receber dados do Pedido Sugerido
  const [suggestedItems, setSuggestedItems] = useState<SuggestedOrderItem[] | null>(null);
  const [suggestedSupplierId, setSuggestedSupplierId] = useState<string | null>(null);

  // Scroll to top when changing tabs
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  const handleDeleteOrder = async (id: string) => {
    if (confirm('Excluir este pedido?')) {
      deleteOrder.mutate(id);
    }
  };

  const handleRefresh = () => {
    // Query invalidation happens automatically
  };

  const handleOrderSent = () => {
    setActiveTab('enviados');
  };

  // Handler que recebe os dados do Pedido Sugerido
  const handleApplySuggestion = (
    items: SuggestedOrderItem[],
    supplierId: string
  ) => {
    setSuggestedItems(items);
    setSuggestedSupplierId(supplierId);
    setActiveTab('novo');
  };

  // Limpar sugestão quando for consumida pelo NewOrderForm
  const handleSuggestionConsumed = () => {
    setSuggestedItems(null);
    setSuggestedSupplierId(null);
  };

  if (loadingSuppliers || loadingProducts || loadingOrders) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-36">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Compras</h1>
        
        {/* Botão Pedido Sugerido */}
        <SuggestedOrderDialog
          suppliers={activeSuppliers}
          products={activeProducts}
          onApplySuggestion={handleApplySuggestion}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 h-12">
          <TabsTrigger value="novo" className="flex items-center gap-1.5 h-10 text-sm">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Novo</span>
          </TabsTrigger>
          <TabsTrigger value="enviados" className="flex items-center gap-1.5 h-10 text-sm">
            <Truck className="h-4 w-4" />
            <span className="hidden sm:inline">Enviados</span>
            {pendingOrders.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {pendingOrders.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="recebidos" className="flex items-center gap-1.5 h-10 text-sm">
            <CheckCircle2 className="h-4 w-4" />
            <span className="hidden sm:inline">Recebidos</span>
          </TabsTrigger>
        </TabsList>

        {/* ============ ABA: NOVO PEDIDO ============ */}
        <TabsContent value="novo" className="mt-4">
          <NewOrderForm
            suppliers={activeSuppliers}
            allProducts={activeProducts}
            onOrderSent={handleOrderSent}
            suggestedItems={suggestedItems}
            suggestedSupplierId={suggestedSupplierId}
            onSuggestionConsumed={handleSuggestionConsumed}
          />
        </TabsContent>

        {/* ============ ABA: ENVIADOS ============ */}
        <TabsContent value="enviados" className="mt-4">
          <OrdersList
            orders={pendingOrders}
            type="pending"
            onDelete={handleDeleteOrder}
            onRefresh={handleRefresh}
            isDeleting={deleteOrder.isPending}
          />
        </TabsContent>

        {/* ============ ABA: RECEBIDOS ============ */}
        <TabsContent value="recebidos" className="mt-4">
          <OrdersList
            orders={receivedOrders}
            type="received"
            onRefresh={handleRefresh}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}