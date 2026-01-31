
-- BLOCO 1: SANEAMENTO - Adicionar Foreign Keys faltantes

-- 1. FK de products -> suppliers (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'products_supplier_id_fkey'
  ) THEN
    ALTER TABLE public.products 
    ADD CONSTRAINT products_supplier_id_fkey 
    FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 2. FK de stock_batches -> products (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'stock_batches_product_id_fkey'
  ) THEN
    ALTER TABLE public.stock_batches 
    ADD CONSTRAINT stock_batches_product_id_fkey 
    FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 3. FK de breakages -> products (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'breakages_product_id_fkey'
  ) THEN
    ALTER TABLE public.breakages 
    ADD CONSTRAINT breakages_product_id_fkey 
    FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 4. FK de breakages -> stock_batches (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'breakages_batch_id_fkey'
  ) THEN
    ALTER TABLE public.breakages 
    ADD CONSTRAINT breakages_batch_id_fkey 
    FOREIGN KEY (batch_id) REFERENCES public.stock_batches(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 5. FK de sale_items -> products (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'sale_items_product_id_fkey'
  ) THEN
    ALTER TABLE public.sale_items 
    ADD CONSTRAINT sale_items_product_id_fkey 
    FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- 6. FK de sale_items -> sales (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'sale_items_sale_id_fkey'
  ) THEN
    ALTER TABLE public.sale_items 
    ADD CONSTRAINT sale_items_sale_id_fkey 
    FOREIGN KEY (sale_id) REFERENCES public.sales(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 7. FK de sale_items -> stock_batches (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'sale_items_batch_id_fkey'
  ) THEN
    ALTER TABLE public.sale_items 
    ADD CONSTRAINT sale_items_batch_id_fkey 
    FOREIGN KEY (batch_id) REFERENCES public.stock_batches(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 8. Índices para performance
CREATE INDEX IF NOT EXISTS idx_products_supplier ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_plu ON products(plu);
CREATE INDEX IF NOT EXISTS idx_stock_batches_product ON stock_batches(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_batches_expiry ON stock_batches(expiry_date);
CREATE INDEX IF NOT EXISTS idx_breakages_product ON breakages(product_id);
CREATE INDEX IF NOT EXISTS idx_breakages_created ON breakages(created_at);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(created_at);

-- 9. Constraint para garantir quantidade positiva
ALTER TABLE stock_batches DROP CONSTRAINT IF EXISTS stock_batches_quantity_positive;
ALTER TABLE stock_batches ADD CONSTRAINT stock_batches_quantity_positive CHECK (quantity >= 0);

ALTER TABLE breakages DROP CONSTRAINT IF EXISTS breakages_quantity_positive;
ALTER TABLE breakages ADD CONSTRAINT breakages_quantity_positive CHECK (quantity > 0);

-- 10. Constraint para preço positivo
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_price_positive;
ALTER TABLE products ADD CONSTRAINT products_price_positive CHECK (price >= 0);

-- 11. Trigger para atualizar updated_at em suppliers
DROP TRIGGER IF EXISTS update_suppliers_updated_at ON suppliers;
CREATE TRIGGER update_suppliers_updated_at
BEFORE UPDATE ON suppliers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
