-- Fix SECURITY DEFINER on views by recreating them with SECURITY INVOKER
DROP VIEW IF EXISTS product_main_supplier;
DROP VIEW IF EXISTS product_supplier_rankings;

CREATE VIEW product_supplier_rankings 
WITH (security_invoker = true) AS
SELECT 
  poi.product_id,
  po.supplier_id,
  s.name as supplier_name,
  COUNT(*) as order_count,
  SUM(poi.quantity) as total_quantity,
  MAX(po.created_at) as last_order,
  ROW_NUMBER() OVER (
    PARTITION BY poi.product_id 
    ORDER BY SUM(poi.quantity) DESC
  ) as rank
FROM purchase_order_items poi
JOIN purchase_orders po ON poi.order_id = po.id
JOIN suppliers s ON po.supplier_id = s.id
WHERE po.status IN ('enviado', 'recebido')
GROUP BY poi.product_id, po.supplier_id, s.name;

CREATE VIEW product_main_supplier 
WITH (security_invoker = true) AS
SELECT 
  product_id,
  supplier_id,
  supplier_name,
  total_quantity
FROM product_supplier_rankings
WHERE rank = 1;