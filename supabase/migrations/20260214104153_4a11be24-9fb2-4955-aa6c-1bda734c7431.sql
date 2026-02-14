-- Fix: store cost_per_unit as cost PER KG (not per volume)
-- Formula: total_cost_of_volumes / net_weight_in_kg
CREATE OR REPLACE FUNCTION public.create_stock_batch_on_receiving()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_item RECORD;
  v_shelf_life INTEGER;
  v_tare NUMERIC;
  v_net_weight NUMERIC;
  v_num_volumes NUMERIC;
  v_total_cost NUMERIC;
  v_cost_per_kg NUMERIC;
BEGIN
  -- Só executa quando o pedido é marcado como recebido
  IF NEW.status = 'recebido' AND OLD.status != 'recebido' THEN
    FOR v_item IN 
      SELECT poi.*, p.shelf_life, pkg.tare_weight
      FROM purchase_order_items poi
      JOIN products p ON p.id = poi.product_id
      LEFT JOIN packagings pkg ON pkg.id = poi.packaging_id
      WHERE poi.order_id = NEW.id
    LOOP
      v_shelf_life := COALESCE(v_item.shelf_life, 7);
      v_num_volumes := COALESCE(v_item.quantity_received, v_item.quantity);
      
      -- Calcula tara total: quantidade de volumes * peso da tara unitária
      v_tare := v_num_volumes * COALESCE(v_item.tare_weight, 0);
      
      -- Peso líquido = peso bruto - tara total
      v_net_weight := (v_num_volumes * COALESCE(v_item.estimated_kg, 1)) - v_tare;
      
      -- Garante que peso líquido não seja negativo
      IF v_net_weight < 0 THEN
        v_net_weight := 0;
      END IF;
      
      -- Custo total = preço por volume * número de volumes
      v_total_cost := COALESCE(v_item.unit_cost_actual, v_item.unit_cost_estimated, 0) * v_num_volumes;
      
      -- Custo por kg = custo total / peso líquido
      -- Protege contra divisão por zero
      IF v_net_weight > 0 THEN
        v_cost_per_kg := v_total_cost / v_net_weight;
      ELSE
        v_cost_per_kg := 0;
      END IF;
      
      INSERT INTO stock_batches (
        product_id,
        quantity,
        cost_per_unit,
        received_at,
        expiry_date
      ) VALUES (
        v_item.product_id,
        v_net_weight,
        v_cost_per_kg,
        now(),
        CURRENT_DATE + v_shelf_life
      );
    END LOOP;
    
    -- Atualiza timestamp de recebimento
    NEW.received_at := now();
  END IF;
  
  RETURN NEW;
END;
$function$;