-- Adiciona coluna para rastrear se o pedido foi editado
ALTER TABLE public.purchase_orders 
ADD COLUMN edited_at timestamp with time zone DEFAULT NULL;

-- Comentário para documentação
COMMENT ON COLUMN public.purchase_orders.edited_at IS 'Data/hora da última edição do pedido após envio';