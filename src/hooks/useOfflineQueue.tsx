import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PedidoItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit: 'cx' | 'kg';
  estimated_kg: number;
  unit_cost_estimated?: number;
}

interface PedidoOffline {
  id: string;
  supplier_id?: string;
  items: PedidoItem[];
  notes?: string;
  created_at: string;
  synced: boolean;
}

const QUEUE_PREFIX = 'queue_pedidos_';

export function useOfflineQueue() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Count pending items
  const countPending = useCallback(() => {
    let count = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(QUEUE_PREFIX)) {
        count++;
      }
    }
    setPendingCount(count);
    return count;
  }, []);

  // Get all pending orders
  const getPendingOrders = useCallback((): PedidoOffline[] => {
    const orders: PedidoOffline[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(QUEUE_PREFIX)) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            orders.push(JSON.parse(data));
          }
        } catch (e) {
          console.error('Error parsing pending order:', e);
        }
      }
    }
    return orders.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }, []);

  // Save order to normalized tables
  const saveOrderToDb = async (order: PedidoOffline) => {
    // 1. Create purchase_order
    const { data: purchaseOrder, error: orderError } = await supabase
      .from('purchase_orders')
      .insert({
        supplier_id: order.supplier_id || null,
        status: 'enviado',
        notes: order.notes || null,
        offline_id: order.id,
        created_at: order.created_at,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // 2. Create purchase_order_items
    const itemsToInsert = order.items.map(item => ({
      order_id: purchaseOrder.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit: item.unit,
      estimated_kg: item.estimated_kg,
      unit_cost_estimated: item.unit_cost_estimated || null,
    }));

    const { error: itemsError } = await supabase
      .from('purchase_order_items')
      .insert(itemsToInsert);

    if (itemsError) throw itemsError;

    return purchaseOrder;
  };

  // Save order (offline or online)
  const saveOrder = useCallback(async (
    items: PedidoItem[], 
    supplierId?: string,
    notes?: string
  ) => {
    const orderId = crypto.randomUUID();
    const order: PedidoOffline = {
      id: orderId,
      supplier_id: supplierId,
      items,
      notes,
      created_at: new Date().toISOString(),
      synced: false,
    };

    if (!navigator.onLine) {
      // Save to localStorage for offline
      const key = `${QUEUE_PREFIX}${Date.now()}`;
      localStorage.setItem(key, JSON.stringify(order));
      countPending();
      
      toast.success('📱 Salvo no Celular', {
        description: 'Pedido será enviado quando a conexão voltar',
        duration: 4000,
      });
      
      return { success: true, offline: true, orderId };
    }

    // Online - save to normalized tables
    try {
      await saveOrderToDb(order);

      toast.success('✅ Pedido Enviado', {
        description: 'Dados salvos no servidor',
      });

      return { success: true, offline: false, orderId };
    } catch (error) {
      console.error('Error saving order:', error);
      // If online send fails, save offline
      const key = `${QUEUE_PREFIX}${Date.now()}`;
      localStorage.setItem(key, JSON.stringify(order));
      countPending();
      
      toast.warning('⚠️ Erro ao enviar, salvo localmente', {
        description: 'Tentaremos enviar novamente em breve',
      });
      
      return { success: true, offline: true, orderId };
    }
  }, [countPending]);

  // Sync pending orders when online
  const syncPendingOrders = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;

    const pending = getPendingOrders();
    if (pending.length === 0) return;

    setIsSyncing(true);
    let synced = 0;

    for (const order of pending) {
      try {
        // Check if already synced by offline_id
        const { data: existing } = await supabase
          .from('purchase_orders')
          .select('id')
          .eq('offline_id', order.id)
          .maybeSingle();

        if (existing) {
          // Already synced, just remove from localStorage
          removeOrderFromLocalStorage(order.id);
          synced++;
          continue;
        }

        await saveOrderToDb(order);

        // Remove from localStorage
        removeOrderFromLocalStorage(order.id);
        synced++;
      } catch (e) {
        console.error('Error syncing order:', e);
      }
    }

    setIsSyncing(false);
    countPending();

    if (synced > 0) {
      toast.success(`🔄 ${synced} pedido(s) sincronizado(s)`, {
        description: 'Dados enviados para o servidor',
      });
    }
  }, [getPendingOrders, isSyncing, countPending]);

  // Helper to remove order from localStorage
  const removeOrderFromLocalStorage = (orderId: string) => {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key?.startsWith(QUEUE_PREFIX)) {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            const stored = JSON.parse(data);
            if (stored.id === orderId) {
              localStorage.removeItem(key);
              return true;
            }
          } catch (e) {
            console.error('Error parsing stored order:', e);
          }
        }
      }
    }
    return false;
  };

  // Clear a specific pending order
  const clearPendingOrder = useCallback((orderId: string) => {
    const removed = removeOrderFromLocalStorage(orderId);
    if (removed) {
      countPending();
    }
    return removed;
  }, [countPending]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('🌐 Conexão restaurada');
      // Auto-sync when back online
      syncPendingOrders();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('📴 Sem conexão', {
        description: 'Trabalhando em modo offline',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial count
    countPending();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncPendingOrders, countPending]);

  return {
    isOnline,
    pendingCount,
    isSyncing,
    saveOrder,
    syncPendingOrders,
    getPendingOrders,
    clearPendingOrder,
  };
}
