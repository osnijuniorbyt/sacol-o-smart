-- Drop the old trigger that causes double stock deduction
-- The process_sale RPC now handles FIFO deduction atomically
DROP TRIGGER IF EXISTS trigger_deduct_stock_sale ON public.sale_items;