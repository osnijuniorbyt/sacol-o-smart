import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProducts } from '@/hooks/useProducts';
import { useSuppliers } from '@/hooks/useSuppliers';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { useOrderForm } from '@/hooks/useOrderForm';
import { OrdersList } from '@/components/compras/OrdersList';
import { SuggestedOrderDialog } from '@/components/compras/SuggestedOrderDialog';
import { SupplierSelector } from '@/components/compras/SupplierSelector';
import { ProductGrid } from '@/components/compras/ProductGrid';
import { OrderItemsTable } from '@/components/compras/OrderItemsTable';
import { OrderFooter } from '@/components/compras/OrderFooter';
import { 
  Plus, 
  Truck,
  CheckCircle2,
  Loader2
} from 'lucide-react';

export default function Compras() {
  const { activeProducts, isLoading: loadingProducts } = useProducts();
  const { activeSuppliers, isLoading: loadingSuppliers } = useSuppliers();
  const { 
    pendingOrders, 
    receivedOrders, 
    isLoading: loadingOrders,
    deleteOrder 
  } = usePurchaseOrders();
  
  const [activeTab, setActiveTab] = useState('novo');
  
  const {
    selectedSupplier,
    setSelectedSupplier,
    items,
    isSupplierSelected,
    isSaving,
    totalPedido,
    totalItens,
    hasItemsWithoutPrice,
    handleAddProduct,
    handleDecrement,
    handleUpdatePrice,
    handleRemoveItem,
    getQuantity,
    handleApplySuggestion,
    handleEnviarPedido,
  } = useOrderForm();

  // Scroll to top when changing tabs
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  const selectedSupplierData = activeSuppliers.find(s => s.id === selectedSupplier);

  const handleDeleteOrder = async (id: string) => {
    if (confirm('Excluir este pedido?')) {
      deleteOrder.mutate(id);
    }
  };

  const handleRefresh = () => {
    // Query invalidation happens automatically via usePurchaseOrders
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
      <h1 className="text-2xl font-bold">Compras</h1>

      {/* Botão Pedido Sugerido */}
      <div className="flex justify-end">
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
        <TabsContent value="novo" className="mt-4 space-y-4">
          {/* PASSO 1: FORNECEDOR */}
          <SupplierSelector
            suppliers={activeSuppliers}
            selectedSupplier={selectedSupplier}
            onSupplierChange={setSelectedSupplier}
          />

          {/* PASSO 2: GRID DE PRODUTOS */}
          <ProductGrid
            products={activeProducts}
            selectedSupplierId={selectedSupplier}
            getQuantity={getQuantity}
            onAddProduct={handleAddProduct}
            onDecrement={handleDecrement}
            isSupplierSelected={isSupplierSelected}
          />

          {/* PASSO 3: LISTA DE ITENS */}
          <OrderItemsTable
            items={items}
            products={activeProducts}
            totalItens={totalItens}
            totalPedido={totalPedido}
            hasItemsWithoutPrice={hasItemsWithoutPrice}
            onAddProduct={handleAddProduct}
            onDecrement={handleDecrement}
            onUpdatePrice={handleUpdatePrice}
            onRemoveItem={handleRemoveItem}
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

      {/* BOTÃO ENVIAR - FIXO NO RODAPÉ */}
      {activeTab === 'novo' && isSupplierSelected && items.length > 0 && (
        <OrderFooter
          supplierName={selectedSupplierData?.name || ''}
          totalItens={totalItens}
          totalPedido={totalPedido}
          isSaving={isSaving}
          onEnviarPedido={handleEnviarPedido}
        />
      )}
    </div>
  );
}
