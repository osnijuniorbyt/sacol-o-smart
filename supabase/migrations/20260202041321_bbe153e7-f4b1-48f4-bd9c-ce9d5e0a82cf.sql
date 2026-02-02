-- Remover políticas RESTRICTIVE existentes e criar novas PERMISSIVE para testes
-- NOTA: Isso é TEMPORÁRIO para testes - reativar autenticação depois!

-- PRODUCTS
DROP POLICY IF EXISTS "Authenticated users can view products" ON products;
DROP POLICY IF EXISTS "Authenticated users can insert products" ON products;
DROP POLICY IF EXISTS "Authenticated users can update products" ON products;
DROP POLICY IF EXISTS "Authenticated users can delete products" ON products;

CREATE POLICY "Public read products" ON products FOR SELECT USING (true);
CREATE POLICY "Public insert products" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update products" ON products FOR UPDATE USING (true);
CREATE POLICY "Public delete products" ON products FOR DELETE USING (true);

-- SUPPLIERS
DROP POLICY IF EXISTS "Authenticated users can view suppliers" ON suppliers;
DROP POLICY IF EXISTS "Authenticated users can insert suppliers" ON suppliers;
DROP POLICY IF EXISTS "Authenticated users can update suppliers" ON suppliers;
DROP POLICY IF EXISTS "Authenticated users can delete suppliers" ON suppliers;

CREATE POLICY "Public read suppliers" ON suppliers FOR SELECT USING (true);
CREATE POLICY "Public insert suppliers" ON suppliers FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update suppliers" ON suppliers FOR UPDATE USING (true);
CREATE POLICY "Public delete suppliers" ON suppliers FOR DELETE USING (true);

-- STOCK_BATCHES
DROP POLICY IF EXISTS "Authenticated users can view stock_batches" ON stock_batches;
DROP POLICY IF EXISTS "Authenticated users can insert stock_batches" ON stock_batches;
DROP POLICY IF EXISTS "Authenticated users can update stock_batches" ON stock_batches;
DROP POLICY IF EXISTS "Authenticated users can delete stock_batches" ON stock_batches;

CREATE POLICY "Public read stock_batches" ON stock_batches FOR SELECT USING (true);
CREATE POLICY "Public insert stock_batches" ON stock_batches FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update stock_batches" ON stock_batches FOR UPDATE USING (true);
CREATE POLICY "Public delete stock_batches" ON stock_batches FOR DELETE USING (true);

-- SALES
DROP POLICY IF EXISTS "Authenticated users can view sales" ON sales;
DROP POLICY IF EXISTS "Authenticated users can insert sales" ON sales;
DROP POLICY IF EXISTS "Authenticated users can update sales" ON sales;
DROP POLICY IF EXISTS "Authenticated users can delete sales" ON sales;

CREATE POLICY "Public read sales" ON sales FOR SELECT USING (true);
CREATE POLICY "Public insert sales" ON sales FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update sales" ON sales FOR UPDATE USING (true);
CREATE POLICY "Public delete sales" ON sales FOR DELETE USING (true);

-- SALE_ITEMS
DROP POLICY IF EXISTS "Authenticated users can view sale_items" ON sale_items;
DROP POLICY IF EXISTS "Authenticated users can insert sale_items" ON sale_items;
DROP POLICY IF EXISTS "Authenticated users can update sale_items" ON sale_items;
DROP POLICY IF EXISTS "Authenticated users can delete sale_items" ON sale_items;

CREATE POLICY "Public read sale_items" ON sale_items FOR SELECT USING (true);
CREATE POLICY "Public insert sale_items" ON sale_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update sale_items" ON sale_items FOR UPDATE USING (true);
CREATE POLICY "Public delete sale_items" ON sale_items FOR DELETE USING (true);

-- BREAKAGES
DROP POLICY IF EXISTS "Authenticated users can view breakages" ON breakages;
DROP POLICY IF EXISTS "Authenticated users can insert breakages" ON breakages;
DROP POLICY IF EXISTS "Authenticated users can update breakages" ON breakages;
DROP POLICY IF EXISTS "Authenticated users can delete breakages" ON breakages;

CREATE POLICY "Public read breakages" ON breakages FOR SELECT USING (true);
CREATE POLICY "Public insert breakages" ON breakages FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update breakages" ON breakages FOR UPDATE USING (true);
CREATE POLICY "Public delete breakages" ON breakages FOR DELETE USING (true);

-- PURCHASE_ORDERS
DROP POLICY IF EXISTS "Authenticated users can view purchase_orders" ON purchase_orders;
DROP POLICY IF EXISTS "Authenticated users can insert purchase_orders" ON purchase_orders;
DROP POLICY IF EXISTS "Authenticated users can update purchase_orders" ON purchase_orders;
DROP POLICY IF EXISTS "Authenticated users can delete purchase_orders" ON purchase_orders;

CREATE POLICY "Public read purchase_orders" ON purchase_orders FOR SELECT USING (true);
CREATE POLICY "Public insert purchase_orders" ON purchase_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update purchase_orders" ON purchase_orders FOR UPDATE USING (true);
CREATE POLICY "Public delete purchase_orders" ON purchase_orders FOR DELETE USING (true);

-- PURCHASE_ORDER_ITEMS
DROP POLICY IF EXISTS "Authenticated users can view purchase_order_items" ON purchase_order_items;
DROP POLICY IF EXISTS "Authenticated users can insert purchase_order_items" ON purchase_order_items;
DROP POLICY IF EXISTS "Authenticated users can update purchase_order_items" ON purchase_order_items;
DROP POLICY IF EXISTS "Authenticated users can delete purchase_order_items" ON purchase_order_items;

CREATE POLICY "Public read purchase_order_items" ON purchase_order_items FOR SELECT USING (true);
CREATE POLICY "Public insert purchase_order_items" ON purchase_order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update purchase_order_items" ON purchase_order_items FOR UPDATE USING (true);
CREATE POLICY "Public delete purchase_order_items" ON purchase_order_items FOR DELETE USING (true);

-- PEOPLE
DROP POLICY IF EXISTS "Authenticated users can view people" ON people;
DROP POLICY IF EXISTS "Authenticated users can insert people" ON people;
DROP POLICY IF EXISTS "Authenticated users can update people" ON people;
DROP POLICY IF EXISTS "Authenticated users can delete people" ON people;

CREATE POLICY "Public read people" ON people FOR SELECT USING (true);
CREATE POLICY "Public insert people" ON people FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update people" ON people FOR UPDATE USING (true);
CREATE POLICY "Public delete people" ON people FOR DELETE USING (true);

-- LOCATIONS
DROP POLICY IF EXISTS "Authenticated users can view locations" ON locations;
DROP POLICY IF EXISTS "Authenticated users can insert locations" ON locations;
DROP POLICY IF EXISTS "Authenticated users can update locations" ON locations;
DROP POLICY IF EXISTS "Authenticated users can delete locations" ON locations;

CREATE POLICY "Public read locations" ON locations FOR SELECT USING (true);
CREATE POLICY "Public insert locations" ON locations FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update locations" ON locations FOR UPDATE USING (true);
CREATE POLICY "Public delete locations" ON locations FOR DELETE USING (true);

-- PACKAGINGS
DROP POLICY IF EXISTS "Authenticated users can view packagings" ON packagings;
DROP POLICY IF EXISTS "Authenticated users can insert packagings" ON packagings;
DROP POLICY IF EXISTS "Authenticated users can update packagings" ON packagings;
DROP POLICY IF EXISTS "Authenticated users can delete packagings" ON packagings;

CREATE POLICY "Public read packagings" ON packagings FOR SELECT USING (true);
CREATE POLICY "Public insert packagings" ON packagings FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update packagings" ON packagings FOR UPDATE USING (true);
CREATE POLICY "Public delete packagings" ON packagings FOR DELETE USING (true);