-- Função auxiliar para verificar se usuário é gestor (admin ou moderator)
CREATE OR REPLACE FUNCTION public.is_manager(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'moderator')
  )
$$;

-- =====================================================
-- TABELAS FINANCEIRAS: Apenas gestores podem acessar
-- =====================================================

-- PURCHASE_ORDERS: Dados financeiros de compras
DROP POLICY IF EXISTS "Authenticated users can read purchase_orders" ON purchase_orders;
DROP POLICY IF EXISTS "Authenticated users can insert purchase_orders" ON purchase_orders;
DROP POLICY IF EXISTS "Authenticated users can update purchase_orders" ON purchase_orders;
DROP POLICY IF EXISTS "Authenticated users can delete purchase_orders" ON purchase_orders;

CREATE POLICY "Managers can read purchase_orders" ON purchase_orders
  FOR SELECT USING (is_manager(auth.uid()));
CREATE POLICY "Managers can insert purchase_orders" ON purchase_orders
  FOR INSERT WITH CHECK (is_manager(auth.uid()));
CREATE POLICY "Managers can update purchase_orders" ON purchase_orders
  FOR UPDATE USING (is_manager(auth.uid()));
CREATE POLICY "Managers can delete purchase_orders" ON purchase_orders
  FOR DELETE USING (is_manager(auth.uid()));

-- PURCHASE_ORDER_ITEMS: Detalhes de custos
DROP POLICY IF EXISTS "Authenticated users can read purchase_order_items" ON purchase_order_items;
DROP POLICY IF EXISTS "Authenticated users can insert purchase_order_items" ON purchase_order_items;
DROP POLICY IF EXISTS "Authenticated users can update purchase_order_items" ON purchase_order_items;
DROP POLICY IF EXISTS "Authenticated users can delete purchase_order_items" ON purchase_order_items;

CREATE POLICY "Managers can read purchase_order_items" ON purchase_order_items
  FOR SELECT USING (is_manager(auth.uid()));
CREATE POLICY "Managers can insert purchase_order_items" ON purchase_order_items
  FOR INSERT WITH CHECK (is_manager(auth.uid()));
CREATE POLICY "Managers can update purchase_order_items" ON purchase_order_items
  FOR UPDATE USING (is_manager(auth.uid()));
CREATE POLICY "Managers can delete purchase_order_items" ON purchase_order_items
  FOR DELETE USING (is_manager(auth.uid()));

-- SALES: Dados de vendas e receita
DROP POLICY IF EXISTS "Authenticated users can read sales" ON sales;
DROP POLICY IF EXISTS "Authenticated users can insert sales" ON sales;
DROP POLICY IF EXISTS "Authenticated users can update sales" ON sales;

CREATE POLICY "Managers can read sales" ON sales
  FOR SELECT USING (is_manager(auth.uid()));
CREATE POLICY "Managers can insert sales" ON sales
  FOR INSERT WITH CHECK (is_manager(auth.uid()));
CREATE POLICY "Managers can update sales" ON sales
  FOR UPDATE USING (is_manager(auth.uid()));

-- SALE_ITEMS: Detalhes de preços de venda
DROP POLICY IF EXISTS "Authenticated users can read sale_items" ON sale_items;
DROP POLICY IF EXISTS "Authenticated users can insert sale_items" ON sale_items;
DROP POLICY IF EXISTS "Authenticated users can update sale_items" ON sale_items;

CREATE POLICY "Managers can read sale_items" ON sale_items
  FOR SELECT USING (is_manager(auth.uid()));
CREATE POLICY "Managers can insert sale_items" ON sale_items
  FOR INSERT WITH CHECK (is_manager(auth.uid()));
CREATE POLICY "Managers can update sale_items" ON sale_items
  FOR UPDATE USING (is_manager(auth.uid()));

-- BREAKAGES: Dados de perdas financeiras
DROP POLICY IF EXISTS "Authenticated users can read breakages" ON breakages;
DROP POLICY IF EXISTS "Authenticated users can insert breakages" ON breakages;
DROP POLICY IF EXISTS "Authenticated users can update breakages" ON breakages;

CREATE POLICY "Managers can read breakages" ON breakages
  FOR SELECT USING (is_manager(auth.uid()));
CREATE POLICY "Managers can insert breakages" ON breakages
  FOR INSERT WITH CHECK (is_manager(auth.uid()));
CREATE POLICY "Managers can update breakages" ON breakages
  FOR UPDATE USING (is_manager(auth.uid()));

-- STOCK_BATCHES: Contém cost_per_unit
DROP POLICY IF EXISTS "Authenticated users can read stock_batches" ON stock_batches;
DROP POLICY IF EXISTS "Authenticated users can insert stock_batches" ON stock_batches;
DROP POLICY IF EXISTS "Authenticated users can update stock_batches" ON stock_batches;
DROP POLICY IF EXISTS "Authenticated users can delete stock_batches" ON stock_batches;

CREATE POLICY "Managers can read stock_batches" ON stock_batches
  FOR SELECT USING (is_manager(auth.uid()));
CREATE POLICY "Managers can insert stock_batches" ON stock_batches
  FOR INSERT WITH CHECK (is_manager(auth.uid()));
CREATE POLICY "Managers can update stock_batches" ON stock_batches
  FOR UPDATE USING (is_manager(auth.uid()));
CREATE POLICY "Managers can delete stock_batches" ON stock_batches
  FOR DELETE USING (is_manager(auth.uid()));

-- SUPPLIER_PRODUCT_ASSOCIATIONS: Histórico de preços
DROP POLICY IF EXISTS "Authenticated users can read supplier_product_associations" ON supplier_product_associations;
DROP POLICY IF EXISTS "Authenticated users can insert supplier_product_associations" ON supplier_product_associations;
DROP POLICY IF EXISTS "Authenticated users can update supplier_product_associations" ON supplier_product_associations;
DROP POLICY IF EXISTS "Authenticated users can delete supplier_product_associations" ON supplier_product_associations;

CREATE POLICY "Managers can read supplier_product_associations" ON supplier_product_associations
  FOR SELECT USING (is_manager(auth.uid()));
CREATE POLICY "Managers can insert supplier_product_associations" ON supplier_product_associations
  FOR INSERT WITH CHECK (is_manager(auth.uid()));
CREATE POLICY "Managers can update supplier_product_associations" ON supplier_product_associations
  FOR UPDATE USING (is_manager(auth.uid()));
CREATE POLICY "Managers can delete supplier_product_associations" ON supplier_product_associations
  FOR DELETE USING (is_manager(auth.uid()));

-- =====================================================
-- TABELAS COM PII: Apenas gestores
-- =====================================================

-- PEOPLE: Contém CPF/CNPJ, email, telefone
DROP POLICY IF EXISTS "Authenticated users can read people" ON people;
DROP POLICY IF EXISTS "Authenticated users can insert people" ON people;
DROP POLICY IF EXISTS "Authenticated users can update people" ON people;
DROP POLICY IF EXISTS "Authenticated users can delete people" ON people;

CREATE POLICY "Managers can read people" ON people
  FOR SELECT USING (is_manager(auth.uid()));
CREATE POLICY "Managers can insert people" ON people
  FOR INSERT WITH CHECK (is_manager(auth.uid()));
CREATE POLICY "Managers can update people" ON people
  FOR UPDATE USING (is_manager(auth.uid()));
CREATE POLICY "Managers can delete people" ON people
  FOR DELETE USING (is_manager(auth.uid()));

-- SUPPLIERS: Contém CNPJ, telefone, condições de pagamento
DROP POLICY IF EXISTS "Authenticated users can read suppliers" ON suppliers;
DROP POLICY IF EXISTS "Authenticated users can insert suppliers" ON suppliers;
DROP POLICY IF EXISTS "Authenticated users can update suppliers" ON suppliers;
DROP POLICY IF EXISTS "Authenticated users can delete suppliers" ON suppliers;

CREATE POLICY "Managers can read suppliers" ON suppliers
  FOR SELECT USING (is_manager(auth.uid()));
CREATE POLICY "Managers can insert suppliers" ON suppliers
  FOR INSERT WITH CHECK (is_manager(auth.uid()));
CREATE POLICY "Managers can update suppliers" ON suppliers
  FOR UPDATE USING (is_manager(auth.uid()));
CREATE POLICY "Managers can delete suppliers" ON suppliers
  FOR DELETE USING (is_manager(auth.uid()));

-- RECEIVING_PHOTOS: Documentação sensível
DROP POLICY IF EXISTS "Authenticated users can read receiving_photos" ON receiving_photos;
DROP POLICY IF EXISTS "Authenticated users can insert receiving_photos" ON receiving_photos;
DROP POLICY IF EXISTS "Authenticated users can update receiving_photos" ON receiving_photos;
DROP POLICY IF EXISTS "Authenticated users can delete receiving_photos" ON receiving_photos;

CREATE POLICY "Managers can read receiving_photos" ON receiving_photos
  FOR SELECT USING (is_manager(auth.uid()));
CREATE POLICY "Managers can insert receiving_photos" ON receiving_photos
  FOR INSERT WITH CHECK (is_manager(auth.uid()));
CREATE POLICY "Managers can update receiving_photos" ON receiving_photos
  FOR UPDATE USING (is_manager(auth.uid()));
CREATE POLICY "Managers can delete receiving_photos" ON receiving_photos
  FOR DELETE USING (is_manager(auth.uid()));