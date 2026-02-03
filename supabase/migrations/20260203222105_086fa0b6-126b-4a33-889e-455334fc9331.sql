
-- =====================================================
-- ETAPA 2: BACKEND AUTOMATION - TRIGGERS E FUNCTIONS
-- =====================================================

-- 1. Trigger para atualizar totais do pedido de compra
CREATE OR REPLACE FUNCTION public.update_purchase_order_total()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

DROP TRIGGER IF EXISTS trigger_update_po_total ON purchase_order_items;
CREATE TRIGGER trigger_update_po_total
AFTER INSERT OR UPDATE OR DELETE ON purchase_order_items
FOR EACH ROW
EXECUTE FUNCTION update_purchase_order_total();

-- 2. Lazy Learning: Aprender associação fornecedor-produto
CREATE OR REPLACE FUNCTION public.learn_supplier_product_association()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_supplier_id UUID;
  v_price NUMERIC;
BEGIN
  -- Busca o supplier_id do pedido
  SELECT supplier_id INTO v_supplier_id
  FROM purchase_orders
  WHERE id = NEW.order_id;
  
  IF v_supplier_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  v_price := COALESCE(NEW.unit_cost_estimated, NEW.unit_cost_actual, 0);
  
  -- UPSERT: Cria ou atualiza associação (Lazy Learning)
  INSERT INTO supplier_product_associations (
    supplier_id, 
    product_id, 
    ultimo_preco,
    quantidade_compras,
    total_kg_comprado,
    last_purchase_at
  )
  VALUES (
    v_supplier_id,
    NEW.product_id,
    v_price,
    1,
    NEW.estimated_kg,
    now()
  )
  ON CONFLICT (supplier_id, product_id) DO UPDATE SET
    ultimo_preco = EXCLUDED.ultimo_preco,
    quantidade_compras = supplier_product_associations.quantidade_compras + 1,
    total_kg_comprado = supplier_product_associations.total_kg_comprado + EXCLUDED.total_kg_comprado,
    preco_medio = (
      (supplier_product_associations.preco_medio * supplier_product_associations.quantidade_compras) + EXCLUDED.ultimo_preco
    ) / (supplier_product_associations.quantidade_compras + 1),
    last_purchase_at = now(),
    updated_at = now();
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_learn_association ON purchase_order_items;
CREATE TRIGGER trigger_learn_association
AFTER INSERT ON purchase_order_items
FOR EACH ROW
EXECUTE FUNCTION learn_supplier_product_association();

-- 3. Atualizar último preço do produto no recebimento
CREATE OR REPLACE FUNCTION public.update_product_last_price()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Só atualiza quando o pedido é marcado como recebido
  IF NEW.status = 'recebido' AND OLD.status != 'recebido' THEN
    UPDATE products p
    SET 
      ultimo_preco_caixa = poi.unit_cost_actual,
      custo_compra = poi.unit_cost_actual,
      updated_at = now()
    FROM purchase_order_items poi
    WHERE poi.order_id = NEW.id
      AND poi.product_id = p.id
      AND poi.unit_cost_actual IS NOT NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_product_price ON purchase_orders;
CREATE TRIGGER trigger_update_product_price
AFTER UPDATE ON purchase_orders
FOR EACH ROW
EXECUTE FUNCTION update_product_last_price();

-- 4. Criar lote de estoque no recebimento (FIFO)
CREATE OR REPLACE FUNCTION public.create_stock_batch_on_receiving()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_item RECORD;
  v_shelf_life INTEGER;
BEGIN
  -- Só executa quando o pedido é marcado como recebido
  IF NEW.status = 'recebido' AND OLD.status != 'recebido' THEN
    FOR v_item IN 
      SELECT poi.*, p.shelf_life
      FROM purchase_order_items poi
      JOIN products p ON p.id = poi.product_id
      WHERE poi.order_id = NEW.id
    LOOP
      v_shelf_life := COALESCE(v_item.shelf_life, 7);
      
      INSERT INTO stock_batches (
        product_id,
        quantity,
        cost_per_unit,
        received_at,
        expiry_date
      ) VALUES (
        v_item.product_id,
        COALESCE(v_item.quantity_received, v_item.quantity) * COALESCE(v_item.estimated_kg, 1),
        COALESCE(v_item.unit_cost_actual, v_item.unit_cost_estimated, 0),
        now(),
        CURRENT_DATE + v_shelf_life
      );
    END LOOP;
    
    -- Atualiza timestamp de recebimento
    NEW.received_at := now();
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_create_stock_batch ON purchase_orders;
CREATE TRIGGER trigger_create_stock_batch
BEFORE UPDATE ON purchase_orders
FOR EACH ROW
EXECUTE FUNCTION create_stock_batch_on_receiving();

-- 5. Dedução FIFO do estoque nas vendas
CREATE OR REPLACE FUNCTION public.deduct_stock_fifo()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_remaining NUMERIC;
  v_batch RECORD;
  v_deduct NUMERIC;
BEGIN
  v_remaining := NEW.quantity;
  
  -- Busca lotes do produto ordenados por FIFO
  FOR v_batch IN 
    SELECT id, quantity 
    FROM stock_batches 
    WHERE product_id = NEW.product_id 
      AND quantity > 0
    ORDER BY received_at ASC, expiry_date ASC NULLS LAST
  LOOP
    EXIT WHEN v_remaining <= 0;
    
    v_deduct := LEAST(v_batch.quantity, v_remaining);
    
    UPDATE stock_batches 
    SET quantity = quantity - v_deduct
    WHERE id = v_batch.id;
    
    -- Registra o batch usado (para rastreabilidade)
    IF NEW.batch_id IS NULL THEN
      NEW.batch_id := v_batch.id;
    END IF;
    
    v_remaining := v_remaining - v_deduct;
  END LOOP;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_deduct_stock_sale ON sale_items;
CREATE TRIGGER trigger_deduct_stock_sale
BEFORE INSERT ON sale_items
FOR EACH ROW
EXECUTE FUNCTION deduct_stock_fifo();

-- 6. Dedução FIFO nas quebras
CREATE OR REPLACE FUNCTION public.deduct_stock_on_breakage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_remaining NUMERIC;
  v_batch RECORD;
  v_deduct NUMERIC;
BEGIN
  v_remaining := NEW.quantity;
  
  FOR v_batch IN 
    SELECT id, quantity 
    FROM stock_batches 
    WHERE product_id = NEW.product_id 
      AND quantity > 0
    ORDER BY received_at ASC, expiry_date ASC NULLS LAST
  LOOP
    EXIT WHEN v_remaining <= 0;
    
    v_deduct := LEAST(v_batch.quantity, v_remaining);
    
    UPDATE stock_batches 
    SET quantity = quantity - v_deduct
    WHERE id = v_batch.id;
    
    IF NEW.batch_id IS NULL THEN
      NEW.batch_id := v_batch.id;
    END IF;
    
    v_remaining := v_remaining - v_deduct;
  END LOOP;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_deduct_stock_breakage ON breakages;
CREATE TRIGGER trigger_deduct_stock_breakage
BEFORE INSERT ON breakages
FOR EACH ROW
EXECUTE FUNCTION deduct_stock_on_breakage();

-- 7. Atualizar totais da venda
CREATE OR REPLACE FUNCTION public.update_sale_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE sales
  SET 
    total = (
      SELECT COALESCE(SUM(total), 0)
      FROM sale_items
      WHERE sale_id = COALESCE(NEW.sale_id, OLD.sale_id)
    ),
    items_count = (
      SELECT COUNT(*)
      FROM sale_items
      WHERE sale_id = COALESCE(NEW.sale_id, OLD.sale_id)
    )
  WHERE id = COALESCE(NEW.sale_id, OLD.sale_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_sale_totals ON sale_items;
CREATE TRIGGER trigger_update_sale_totals
AFTER INSERT OR UPDATE OR DELETE ON sale_items
FOR EACH ROW
EXECUTE FUNCTION update_sale_totals();

-- 8. Função para calcular custo real com rateio
CREATE OR REPLACE FUNCTION public.calculate_real_cost(
  p_order_id UUID,
  p_valor_frete NUMERIC DEFAULT 0,
  p_custo_descarga NUMERIC DEFAULT 0
)
RETURNS TABLE (
  product_id UUID,
  product_name VARCHAR,
  peso_liquido NUMERIC,
  preco_kg NUMERIC,
  custo_kg_rateado NUMERIC,
  custo_real_kg NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_peso_total NUMERIC;
BEGIN
  -- Calcula peso total do pedido
  SELECT COALESCE(SUM(COALESCE(poi.quantity_received, poi.quantity) * COALESCE(poi.estimated_kg, 1)), 1)
  INTO v_peso_total
  FROM purchase_order_items poi
  WHERE poi.order_id = p_order_id;
  
  RETURN QUERY
  SELECT 
    poi.product_id,
    p.name,
    COALESCE(poi.quantity_received, poi.quantity) * COALESCE(poi.estimated_kg, 1) as peso_liquido,
    COALESCE(poi.unit_cost_actual, poi.unit_cost_estimated, 0) as preco_kg,
    (p_valor_frete + p_custo_descarga) / v_peso_total as custo_kg_rateado,
    COALESCE(poi.unit_cost_actual, poi.unit_cost_estimated, 0) + 
      ((p_valor_frete + p_custo_descarga) / v_peso_total) as custo_real_kg
  FROM purchase_order_items poi
  JOIN products p ON p.id = poi.product_id
  WHERE poi.order_id = p_order_id;
END;
$$;

-- 9. Função para buscar produtos do fornecedor ordenados por histórico
CREATE OR REPLACE FUNCTION public.get_supplier_products(p_supplier_id UUID)
RETURNS TABLE (
  product_id UUID,
  product_name VARCHAR,
  category TEXT,
  ultimo_preco NUMERIC,
  ultimo_vasilhame_id UUID,
  vasilhame_nome VARCHAR,
  quantidade_compras INTEGER,
  preco_medio NUMERIC,
  last_purchase_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  SELECT 
    p.id as product_id,
    p.name as product_name,
    p.category::TEXT,
    COALESCE(spa.ultimo_preco, p.ultimo_preco_caixa, 0) as ultimo_preco,
    spa.ultimo_vasilhame_id,
    pkg.name as vasilhame_nome,
    COALESCE(spa.quantidade_compras, 0) as quantidade_compras,
    COALESCE(spa.preco_medio, 0) as preco_medio,
    spa.last_purchase_at
  FROM products p
  LEFT JOIN supplier_product_associations spa 
    ON spa.product_id = p.id AND spa.supplier_id = p_supplier_id
  LEFT JOIN packagings pkg ON pkg.id = spa.ultimo_vasilhame_id
  WHERE p.is_active = true
  ORDER BY 
    spa.quantidade_compras DESC NULLS LAST,
    spa.last_purchase_at DESC NULLS LAST,
    p.name ASC
$$;

-- 10. Função para atualizar vasilhame do fornecedor-produto
CREATE OR REPLACE FUNCTION public.update_supplier_product_packaging(
  p_supplier_id UUID,
  p_product_id UUID,
  p_packaging_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE supplier_product_associations
  SET 
    ultimo_vasilhame_id = p_packaging_id,
    updated_at = now()
  WHERE supplier_id = p_supplier_id 
    AND product_id = p_product_id;
  
  -- Se não existir, cria
  IF NOT FOUND THEN
    INSERT INTO supplier_product_associations (supplier_id, product_id, ultimo_vasilhame_id)
    VALUES (p_supplier_id, p_product_id, p_packaging_id);
  END IF;
END;
$$;

-- 11. View para ranking de fornecedores por produto
CREATE OR REPLACE VIEW public.supplier_product_ranking AS
SELECT 
  spa.supplier_id,
  s.name as supplier_name,
  spa.product_id,
  p.name as product_name,
  p.category,
  spa.quantidade_compras,
  spa.ultimo_preco,
  spa.preco_medio,
  spa.total_kg_comprado,
  spa.ultimo_vasilhame_id,
  pkg.name as vasilhame_nome,
  spa.last_purchase_at,
  ROW_NUMBER() OVER (
    PARTITION BY spa.product_id 
    ORDER BY spa.quantidade_compras DESC, spa.last_purchase_at DESC
  ) as rank
FROM supplier_product_associations spa
JOIN suppliers s ON s.id = spa.supplier_id
JOIN products p ON p.id = spa.product_id
LEFT JOIN packagings pkg ON pkg.id = spa.ultimo_vasilhame_id
WHERE s.is_active = true AND p.is_active = true;

-- 12. Função para buscar produtos com estoque crítico
CREATE OR REPLACE FUNCTION public.get_critical_stock_products()
RETURNS TABLE (
  product_id UUID,
  product_name VARCHAR,
  current_stock NUMERIC,
  min_stock NUMERIC,
  deficit NUMERIC
)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  SELECT 
    p.id as product_id,
    p.name as product_name,
    COALESCE(SUM(sb.quantity), 0) as current_stock,
    p.min_stock,
    p.min_stock - COALESCE(SUM(sb.quantity), 0) as deficit
  FROM products p
  LEFT JOIN stock_batches sb ON sb.product_id = p.id AND sb.quantity > 0
  WHERE p.is_active = true
  GROUP BY p.id, p.name, p.min_stock
  HAVING COALESCE(SUM(sb.quantity), 0) < p.min_stock
  ORDER BY (p.min_stock - COALESCE(SUM(sb.quantity), 0)) DESC
$$;

-- 13. Função para buscar lotes próximos do vencimento
CREATE OR REPLACE FUNCTION public.get_expiring_batches(p_days INTEGER DEFAULT 3)
RETURNS TABLE (
  batch_id UUID,
  product_id UUID,
  product_name VARCHAR,
  quantity NUMERIC,
  expiry_date DATE,
  days_until_expiry INTEGER
)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  SELECT 
    sb.id as batch_id,
    sb.product_id,
    p.name as product_name,
    sb.quantity,
    sb.expiry_date,
    (sb.expiry_date - CURRENT_DATE) as days_until_expiry
  FROM stock_batches sb
  JOIN products p ON p.id = sb.product_id
  WHERE sb.quantity > 0
    AND sb.expiry_date IS NOT NULL
    AND sb.expiry_date <= CURRENT_DATE + p_days
  ORDER BY sb.expiry_date ASC, sb.quantity DESC
$$;
