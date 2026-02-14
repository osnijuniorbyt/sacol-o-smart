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
    COALESCE(spa.ultimo_preco, 0) as ultimo_preco,
    spa.ultimo_vasilhame_id,
    pkg.name as vasilhame_nome,
    COALESCE(spa.quantidade_compras, 0) as quantidade_compras,
    COALESCE(spa.preco_medio, 0) as preco_medio,
    spa.last_purchase_at
  FROM supplier_product_associations spa
  INNER JOIN products p ON p.id = spa.product_id AND p.is_active = true
  LEFT JOIN packagings pkg ON pkg.id = spa.ultimo_vasilhame_id
  WHERE spa.supplier_id = p_supplier_id
  ORDER BY 
    spa.quantidade_compras DESC NULLS LAST,
    spa.last_purchase_at DESC NULLS LAST,
    p.name ASC
$$;