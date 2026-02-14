-- ==============================================
-- 1. RPC process_sale: transação atômica para vendas
-- ==============================================
CREATE OR REPLACE FUNCTION public.process_sale(
  p_items JSONB -- array of { product_id, quantity, unit_price, total }
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_sale_id UUID;
  v_total NUMERIC := 0;
  v_items_count INTEGER := 0;
  v_item JSONB;
  v_product_id UUID;
  v_quantity NUMERIC;
  v_remaining NUMERIC;
  v_batch RECORD;
  v_deduct NUMERIC;
BEGIN
  -- Calcula totais
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_total := v_total + (v_item->>'total')::NUMERIC;
    v_items_count := v_items_count + 1;
  END LOOP;

  IF v_items_count = 0 THEN
    RAISE EXCEPTION 'Nenhum item na venda';
  END IF;

  -- Insere a venda
  INSERT INTO sales (total, items_count)
  VALUES (v_total, v_items_count)
  RETURNING id INTO v_sale_id;

  -- Insere itens e baixa estoque FIFO
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::UUID;
    v_quantity := (v_item->>'quantity')::NUMERIC;
    v_remaining := v_quantity;

    -- Baixa FIFO nos lotes
    FOR v_batch IN
      SELECT id, quantity FROM stock_batches
      WHERE product_id = v_product_id AND quantity > 0
      ORDER BY received_at ASC
      FOR UPDATE
    LOOP
      EXIT WHEN v_remaining <= 0;
      v_deduct := LEAST(v_batch.quantity, v_remaining);

      -- Insere item da venda vinculado ao lote
      INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total, batch_id)
      VALUES (
        v_sale_id,
        v_product_id,
        v_deduct,
        (v_item->>'unit_price')::NUMERIC,
        v_deduct * (v_item->>'unit_price')::NUMERIC,
        v_batch.id
      );

      UPDATE stock_batches SET quantity = quantity - v_deduct WHERE id = v_batch.id;
      v_remaining := v_remaining - v_deduct;
    END LOOP;

    -- Se ainda sobrou quantidade sem lote, insere sem batch_id
    IF v_remaining > 0 THEN
      INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total)
      VALUES (
        v_sale_id,
        v_product_id,
        v_remaining,
        (v_item->>'unit_price')::NUMERIC,
        v_remaining * (v_item->>'unit_price')::NUMERIC
      );
    END IF;
  END LOOP;

  RETURN v_sale_id;
END;
$$;

-- ==============================================
-- 2. Restringir DELETE em products para admin only
-- ==============================================
DROP POLICY IF EXISTS "Authenticated users can delete products" ON public.products;
CREATE POLICY "Only admins can delete products"
  ON public.products
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- ==============================================
-- 3. Restringir DELETE em stock_batches para admin only
-- ==============================================
DROP POLICY IF EXISTS "Managers can delete stock_batches" ON public.stock_batches;
CREATE POLICY "Only admins can delete stock_batches"
  ON public.stock_batches
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'));