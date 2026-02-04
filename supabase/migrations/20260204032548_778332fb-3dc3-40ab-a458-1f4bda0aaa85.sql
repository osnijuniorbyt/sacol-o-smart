-- HOTFIX SEGURANÇA: Bloquear DELETE em tabelas financeiras (histórico imutável)

-- ===== SALES - Remover política de delete e criar bloqueio =====
DROP POLICY IF EXISTS "Authenticated users can delete sales" ON public.sales;
CREATE POLICY "Block delete sales (immutable)" ON public.sales FOR DELETE USING (false);

-- ===== BREAKAGES - Remover política de delete e criar bloqueio =====
DROP POLICY IF EXISTS "Authenticated users can delete breakages" ON public.breakages;
CREATE POLICY "Block delete breakages (immutable)" ON public.breakages FOR DELETE USING (false);

-- ===== SALE_ITEMS - Também imutável =====
DROP POLICY IF EXISTS "Authenticated users can delete sale_items" ON public.sale_items;
CREATE POLICY "Block delete sale_items (immutable)" ON public.sale_items FOR DELETE USING (false);