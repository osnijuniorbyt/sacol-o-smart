import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PedidoItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit: 'cx' | 'kg';
  estimated_kg: number;
}

interface PedidoOffline {
  id: string;
  items: PedidoItem[];
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

  // Save order (offline or online)
  const saveOrder = useCallback(async (items: PedidoItem[]) => {
    const orderId = crypto.randomUUID();
    const order: PedidoOffline = {
      id: orderId,
      items,
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

    // Online - send directly to Supabase
    try {
      // For now, we'll store purchases in a simple format
      // In production, you'd want a dedicated purchases table
      const { error } = await supabase.from('stock_batches').insert(
        items.map(item => ({
          product_id: item.product_id,
          quantity: item.estimated_kg,
          cost_per_unit: 0, // Will be filled later with actual cost
          received_at: new Date().toISOString(),
        }))
      );

      if (error) throw error;

      toast.success('✅ Pedido Enviado', {
        description: 'Dados salvos no servidor',
      });

      return { success: true, offline: false, orderId };
    } catch (error) {
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
        const { error } = await supabase.from('stock_batches').insert(
          order.items.map(item => ({
            product_id: item.product_id,
            quantity: item.estimated_kg,
            cost_per_unit: 0,
            received_at: order.created_at,
          }))
        );

        if (!error) {
          // Remove from localStorage
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(QUEUE_PREFIX)) {
              const data = localStorage.getItem(key);
              if (data) {
                const stored = JSON.parse(data);
                if (stored.id === order.id) {
                  localStorage.removeItem(key);
                  synced++;
                  break;
                }
              }
            }
          }
        }
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

  // Clear a specific pending order
  const clearPendingOrder = useCallback((orderId: string) => {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(QUEUE_PREFIX)) {
        const data = localStorage.getItem(key);
        if (data) {
          const stored = JSON.parse(data);
          if (stored.id === orderId) {
            localStorage.removeItem(key);
            countPending();
            return true;
          }
        }
      }
    }
    return false;
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
