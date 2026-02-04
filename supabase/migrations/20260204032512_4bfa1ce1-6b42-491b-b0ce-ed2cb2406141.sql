-- HOTFIX SEGURANÇA: Atualizar RLS para exigir autenticação

-- ===== BREAKAGES =====
DROP POLICY IF EXISTS "Public read breakages" ON public.breakages;
DROP POLICY IF EXISTS "Public insert breakages" ON public.breakages;
DROP POLICY IF EXISTS "Public update breakages" ON public.breakages;
DROP POLICY IF EXISTS "Public delete breakages" ON public.breakages;

CREATE POLICY "Authenticated users can read breakages" ON public.breakages FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert breakages" ON public.breakages FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update breakages" ON public.breakages FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete breakages" ON public.breakages FOR DELETE USING (auth.role() = 'authenticated');

-- ===== LOCATIONS =====
DROP POLICY IF EXISTS "Public read locations" ON public.locations;
DROP POLICY IF EXISTS "Public insert locations" ON public.locations;
DROP POLICY IF EXISTS "Public update locations" ON public.locations;
DROP POLICY IF EXISTS "Public delete locations" ON public.locations;

CREATE POLICY "Authenticated users can read locations" ON public.locations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert locations" ON public.locations FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update locations" ON public.locations FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete locations" ON public.locations FOR DELETE USING (auth.role() = 'authenticated');

-- ===== PACKAGINGS =====
DROP POLICY IF EXISTS "Public read packagings" ON public.packagings;
DROP POLICY IF EXISTS "Public insert packagings" ON public.packagings;
DROP POLICY IF EXISTS "Public update packagings" ON public.packagings;
DROP POLICY IF EXISTS "Public delete packagings" ON public.packagings;

CREATE POLICY "Authenticated users can read packagings" ON public.packagings FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert packagings" ON public.packagings FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update packagings" ON public.packagings FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete packagings" ON public.packagings FOR DELETE USING (auth.role() = 'authenticated');

-- ===== PEOPLE =====
DROP POLICY IF EXISTS "Public read people" ON public.people;
DROP POLICY IF EXISTS "Public insert people" ON public.people;
DROP POLICY IF EXISTS "Public update people" ON public.people;
DROP POLICY IF EXISTS "Public delete people" ON public.people;

CREATE POLICY "Authenticated users can read people" ON public.people FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert people" ON public.people FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update people" ON public.people FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete people" ON public.people FOR DELETE USING (auth.role() = 'authenticated');

-- ===== PRODUCTS =====
DROP POLICY IF EXISTS "Public read products" ON public.products;
DROP POLICY IF EXISTS "Public insert products" ON public.products;
DROP POLICY IF EXISTS "Public update products" ON public.products;
DROP POLICY IF EXISTS "Public delete products" ON public.products;

CREATE POLICY "Authenticated users can read products" ON public.products FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert products" ON public.products FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update products" ON public.products FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete products" ON public.products FOR DELETE USING (auth.role() = 'authenticated');

-- ===== PURCHASE_ORDERS =====
DROP POLICY IF EXISTS "Public read purchase_orders" ON public.purchase_orders;
DROP POLICY IF EXISTS "Public insert purchase_orders" ON public.purchase_orders;
DROP POLICY IF EXISTS "Public update purchase_orders" ON public.purchase_orders;
DROP POLICY IF EXISTS "Public delete purchase_orders" ON public.purchase_orders;

CREATE POLICY "Authenticated users can read purchase_orders" ON public.purchase_orders FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert purchase_orders" ON public.purchase_orders FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update purchase_orders" ON public.purchase_orders FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete purchase_orders" ON public.purchase_orders FOR DELETE USING (auth.role() = 'authenticated');

-- ===== PURCHASE_ORDER_ITEMS =====
DROP POLICY IF EXISTS "Public read purchase_order_items" ON public.purchase_order_items;
DROP POLICY IF EXISTS "Public insert purchase_order_items" ON public.purchase_order_items;
DROP POLICY IF EXISTS "Public update purchase_order_items" ON public.purchase_order_items;
DROP POLICY IF EXISTS "Public delete purchase_order_items" ON public.purchase_order_items;

CREATE POLICY "Authenticated users can read purchase_order_items" ON public.purchase_order_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert purchase_order_items" ON public.purchase_order_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update purchase_order_items" ON public.purchase_order_items FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete purchase_order_items" ON public.purchase_order_items FOR DELETE USING (auth.role() = 'authenticated');

-- ===== RECEIVING_PHOTOS =====
DROP POLICY IF EXISTS "Public read receiving_photos" ON public.receiving_photos;
DROP POLICY IF EXISTS "Public insert receiving_photos" ON public.receiving_photos;
DROP POLICY IF EXISTS "Public update receiving_photos" ON public.receiving_photos;
DROP POLICY IF EXISTS "Public delete receiving_photos" ON public.receiving_photos;

CREATE POLICY "Authenticated users can read receiving_photos" ON public.receiving_photos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert receiving_photos" ON public.receiving_photos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update receiving_photos" ON public.receiving_photos FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete receiving_photos" ON public.receiving_photos FOR DELETE USING (auth.role() = 'authenticated');

-- ===== SALE_ITEMS =====
DROP POLICY IF EXISTS "Public read sale_items" ON public.sale_items;
DROP POLICY IF EXISTS "Public insert sale_items" ON public.sale_items;
DROP POLICY IF EXISTS "Public update sale_items" ON public.sale_items;
DROP POLICY IF EXISTS "Public delete sale_items" ON public.sale_items;

CREATE POLICY "Authenticated users can read sale_items" ON public.sale_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert sale_items" ON public.sale_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update sale_items" ON public.sale_items FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete sale_items" ON public.sale_items FOR DELETE USING (auth.role() = 'authenticated');

-- ===== SALES =====
DROP POLICY IF EXISTS "Public read sales" ON public.sales;
DROP POLICY IF EXISTS "Public insert sales" ON public.sales;
DROP POLICY IF EXISTS "Public update sales" ON public.sales;
DROP POLICY IF EXISTS "Public delete sales" ON public.sales;

CREATE POLICY "Authenticated users can read sales" ON public.sales FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert sales" ON public.sales FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update sales" ON public.sales FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete sales" ON public.sales FOR DELETE USING (auth.role() = 'authenticated');

-- ===== STOCK_BATCHES =====
DROP POLICY IF EXISTS "Public read stock_batches" ON public.stock_batches;
DROP POLICY IF EXISTS "Public insert stock_batches" ON public.stock_batches;
DROP POLICY IF EXISTS "Public update stock_batches" ON public.stock_batches;
DROP POLICY IF EXISTS "Public delete stock_batches" ON public.stock_batches;

CREATE POLICY "Authenticated users can read stock_batches" ON public.stock_batches FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert stock_batches" ON public.stock_batches FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update stock_batches" ON public.stock_batches FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete stock_batches" ON public.stock_batches FOR DELETE USING (auth.role() = 'authenticated');

-- ===== SUPPLIERS =====
DROP POLICY IF EXISTS "Public read suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Public insert suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Public update suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Public delete suppliers" ON public.suppliers;

CREATE POLICY "Authenticated users can read suppliers" ON public.suppliers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert suppliers" ON public.suppliers FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update suppliers" ON public.suppliers FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete suppliers" ON public.suppliers FOR DELETE USING (auth.role() = 'authenticated');

-- ===== SUPPLIER_PRODUCT_ASSOCIATIONS =====
DROP POLICY IF EXISTS "Public read supplier_product_associations" ON public.supplier_product_associations;
DROP POLICY IF EXISTS "Public insert supplier_product_associations" ON public.supplier_product_associations;
DROP POLICY IF EXISTS "Public update supplier_product_associations" ON public.supplier_product_associations;
DROP POLICY IF EXISTS "Public delete supplier_product_associations" ON public.supplier_product_associations;

CREATE POLICY "Authenticated users can read supplier_product_associations" ON public.supplier_product_associations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert supplier_product_associations" ON public.supplier_product_associations FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update supplier_product_associations" ON public.supplier_product_associations FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete supplier_product_associations" ON public.supplier_product_associations FOR DELETE USING (auth.role() = 'authenticated');

-- ===== LOTES_DEMANDA =====
DROP POLICY IF EXISTS "Authenticated users can manage lotes_demanda" ON public.lotes_demanda;

CREATE POLICY "Authenticated users can read lotes_demanda" ON public.lotes_demanda FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert lotes_demanda" ON public.lotes_demanda FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update lotes_demanda" ON public.lotes_demanda FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete lotes_demanda" ON public.lotes_demanda FOR DELETE USING (auth.role() = 'authenticated');

-- ===== ITENS_DEMANDA =====
DROP POLICY IF EXISTS "Authenticated users can manage itens_demanda" ON public.itens_demanda;

CREATE POLICY "Authenticated users can read itens_demanda" ON public.itens_demanda FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert itens_demanda" ON public.itens_demanda FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update itens_demanda" ON public.itens_demanda FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete itens_demanda" ON public.itens_demanda FOR DELETE USING (auth.role() = 'authenticated');