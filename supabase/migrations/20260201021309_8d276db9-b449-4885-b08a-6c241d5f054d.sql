-- Add last purchase price per box to products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS ultimo_preco_caixa numeric DEFAULT 0;

COMMENT ON COLUMN public.products.ultimo_preco_caixa IS 'Último preço pago por caixa deste produto';