
-- TAREFA 1.2: NORMALIZAR COMPRAS

-- Enum para status do pedido
CREATE TYPE public.purchase_order_status AS ENUM ('rascunho', 'enviado', 'recebido', 'cancelado');

-- 1. TABELA PURCHASE_ORDERS (Pedidos de Compra)
CREATE TABLE public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  status purchase_order_status NOT NULL DEFAULT 'rascunho',
  total_estimated NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_received NUMERIC(12,2),
  created_by UUID REFERENCES public.people(id) ON DELETE SET NULL,
  notes TEXT,
  offline_id VARCHAR(100), -- Para rastrear pedidos criados offline
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  received_at TIMESTAMPTZ
);

-- 2. TABELA PURCHASE_ORDER_ITEMS (Itens do Pedido)
CREATE TABLE public.purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity NUMERIC(10,3) NOT NULL,
  unit VARCHAR(10) NOT NULL DEFAULT 'kg', -- 'cx' ou 'kg'
  estimated_kg NUMERIC(10,3) NOT NULL,
  unit_cost_estimated NUMERIC(10,2),
  unit_cost_actual NUMERIC(10,2),
  quantity_received NUMERIC(10,3),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- HABILITAR RLS
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS RLS - PURCHASE_ORDERS
CREATE POLICY "Authenticated users can view purchase_orders"
  ON public.purchase_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert purchase_orders"
  ON public.purchase_orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update purchase_orders"
  ON public.purchase_orders FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete purchase_orders"
  ON public.purchase_orders FOR DELETE TO authenticated USING (true);

-- POLÍTICAS RLS - PURCHASE_ORDER_ITEMS
CREATE POLICY "Authenticated users can view purchase_order_items"
  ON public.purchase_order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert purchase_order_items"
  ON public.purchase_order_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update purchase_order_items"
  ON public.purchase_order_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete purchase_order_items"
  ON public.purchase_order_items FOR DELETE TO authenticated USING (true);

-- ÍNDICES
CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX idx_purchase_orders_created_at ON purchase_orders(created_at);
CREATE INDEX idx_purchase_orders_offline_id ON purchase_orders(offline_id);
CREATE INDEX idx_purchase_order_items_order ON purchase_order_items(order_id);
CREATE INDEX idx_purchase_order_items_product ON purchase_order_items(product_id);

-- TRIGGER PARA UPDATED_AT
CREATE TRIGGER update_purchase_orders_updated_at
  BEFORE UPDATE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- FUNÇÃO PARA CALCULAR TOTAL DO PEDIDO
CREATE OR REPLACE FUNCTION public.update_purchase_order_total()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE purchase_orders
  SET total_estimated = (
    SELECT COALESCE(SUM(estimated_kg * COALESCE(unit_cost_estimated, 0)), 0)
    FROM purchase_order_items
    WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
  )
  WHERE id = COALESCE(NEW.order_id, OLD.order_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- TRIGGER PARA ATUALIZAR TOTAL
CREATE TRIGGER trigger_update_order_total
  AFTER INSERT OR UPDATE OR DELETE ON purchase_order_items
  FOR EACH ROW EXECUTE FUNCTION update_purchase_order_total();
