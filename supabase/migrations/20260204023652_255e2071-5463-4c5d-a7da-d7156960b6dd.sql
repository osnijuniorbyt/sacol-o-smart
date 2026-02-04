-- Adicionar campo packaging_id na tabela purchase_order_items
ALTER TABLE public.purchase_order_items
ADD COLUMN packaging_id uuid REFERENCES public.packagings(id);

-- Adicionar campo tare_total para armazenar a tara total (qtd * tara_unitaria)
ALTER TABLE public.purchase_order_items
ADD COLUMN tare_total numeric DEFAULT 0;

-- Criar índice para performance
CREATE INDEX idx_purchase_order_items_packaging ON public.purchase_order_items(packaging_id);

-- Atualizar a função create_stock_batch_on_receiving para descontar a tara
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
      
      -- Calcula tara total: quantidade de volumes * peso da tara unitária
      v_tare := COALESCE(v_item.quantity_received, v_item.quantity) * COALESCE(v_item.tare_weight, 0);
      
      -- Peso líquido = peso bruto - tara total
      v_net_weight := (COALESCE(v_item.quantity_received, v_item.quantity) * COALESCE(v_item.estimated_kg, 1)) - v_tare;
      
      -- Garante que peso líquido não seja negativo
      IF v_net_weight < 0 THEN
        v_net_weight := 0;
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
$function$;