-- ==============================================
-- LAZY LEARNING: Associação Dinâmica Fornecedor-Produto
-- ==============================================

-- Tabela de associação (aprende com o uso)
CREATE TABLE IF NOT EXISTS public.supplier_product_associations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  ultimo_vasilhame_id UUID REFERENCES public.packagings(id),
  ultimo_preco NUMERIC DEFAULT 0,
  quantidade_compras INTEGER DEFAULT 1,
  total_kg_comprado NUMERIC DEFAULT 0,
  preco_medio NUMERIC DEFAULT 0,
  last_purchase_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (supplier_id, product_id)
);

-- Habilitar RLS
ALTER TABLE public.supplier_product_associations ENABLE ROW LEVEL SECURITY;

-- Policies públicas
CREATE POLICY "Public read supplier_product_associations" 
  ON public.supplier_product_associations FOR SELECT USING (true);
CREATE POLICY "Public insert supplier_product_associations" 
  ON public.supplier_product_associations FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update supplier_product_associations" 
  ON public.supplier_product_associations FOR UPDATE USING (true);
CREATE POLICY "Public delete supplier_product_associations" 
  ON public.supplier_product_associations FOR DELETE USING (true);

-- Índices para performance
CREATE INDEX idx_spa_supplier ON public.supplier_product_associations(supplier_id);
CREATE INDEX idx_spa_product ON public.supplier_product_associations(product_id);
CREATE INDEX idx_spa_quantidade ON public.supplier_product_associations(quantidade_compras DESC);

-- ==============================================
-- FUNÇÃO: Lazy Learning - Atualiza associação ao inserir item no pedido
-- ==============================================
CREATE OR REPLACE FUNCTION public.learn_supplier_product_association()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

-- Trigger para aprender associações
CREATE TRIGGER learn_association_on_item_insert
  AFTER INSERT ON public.purchase_order_items
  FOR EACH ROW EXECUTE FUNCTION public.learn_supplier_product_association();

-- ==============================================
-- FUNÇÃO: Calcular Custo Real com Rateio de Frete
-- ==============================================
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
SET search_path = 'public'
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

-- ==============================================
-- FUNÇÃO: Buscar produtos por fornecedor (com histórico)
-- ==============================================
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
SET search_path = 'public'
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

-- ==============================================
-- FUNÇÃO: Atualizar vasilhame na associação
-- ==============================================
CREATE OR REPLACE FUNCTION public.update_supplier_product_packaging(
  p_supplier_id UUID,
  p_product_id UUID,
  p_packaging_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

-- ==============================================
-- VIEW: Ranking de produtos por fornecedor
-- ==============================================
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
    PARTITION BY spa.supplier_id 
    ORDER BY spa.quantidade_compras DESC, spa.last_purchase_at DESC
  ) as rank
FROM supplier_product_associations spa
JOIN suppliers s ON s.id = spa.supplier_id
JOIN products p ON p.id = spa.product_id
LEFT JOIN packagings pkg ON pkg.id = spa.ultimo_vasilhame_id
ORDER BY spa.supplier_id, rank;