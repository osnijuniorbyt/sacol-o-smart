-- Recriar views com security_invoker=true para aplicar RLS corretamente

-- Drop views na ordem correta (product_main_supplier depende de product_supplier_rankings)
DROP VIEW IF EXISTS public.product_main_supplier;
DROP VIEW IF EXISTS public.product_supplier_rankings;
DROP VIEW IF EXISTS public.supplier_product_ranking;

-- Recriar product_supplier_rankings com security_invoker
CREATE VIEW public.product_supplier_rankings
WITH (security_invoker = on)
AS
SELECT 
  poi.product_id,
  po.supplier_id,
  s.name AS supplier_name,
  count(*) AS order_count,
  sum(poi.quantity) AS total_quantity,
  max(po.created_at) AS last_order,
  row_number() OVER (PARTITION BY poi.product_id ORDER BY (sum(poi.quantity)) DESC) AS rank
FROM purchase_order_items poi
JOIN purchase_orders po ON poi.order_id = po.id
JOIN suppliers s ON po.supplier_id = s.id
WHERE po.status = ANY (ARRAY['enviado'::purchase_order_status, 'recebido'::purchase_order_status])
GROUP BY poi.product_id, po.supplier_id, s.name;

-- Recriar product_main_supplier com security_invoker
CREATE VIEW public.product_main_supplier
WITH (security_invoker = on)
AS
SELECT 
  product_id,
  supplier_id,
  supplier_name,
  total_quantity
FROM product_supplier_rankings
WHERE rank = 1;

-- Recriar supplier_product_ranking com security_invoker
CREATE VIEW public.supplier_product_ranking
WITH (security_invoker = on)
AS
SELECT 
  spa.supplier_id,
  s.name AS supplier_name,
  spa.product_id,
  p.name AS product_name,
  p.category,
  spa.quantidade_compras,
  spa.ultimo_preco,
  spa.preco_medio,
  spa.total_kg_comprado,
  spa.ultimo_vasilhame_id,
  pkg.name AS vasilhame_nome,
  spa.last_purchase_at,
  row_number() OVER (PARTITION BY spa.product_id ORDER BY spa.quantidade_compras DESC, spa.last_purchase_at DESC) AS rank
FROM supplier_product_associations spa
JOIN suppliers s ON s.id = spa.supplier_id
JOIN products p ON p.id = spa.product_id
LEFT JOIN packagings pkg ON pkg.id = spa.ultimo_vasilhame_id
WHERE s.is_active = true AND p.is_active = true;