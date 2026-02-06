-- Remove a policy de bloqueio de delete temporariamente para limpeza
DROP POLICY IF EXISTS "Block delete breakages (immutable)" ON public.breakages;

-- Cria nova policy permitindo managers deletarem (consistente com outras tabelas)
CREATE POLICY "Managers can delete breakages"
ON public.breakages
FOR DELETE
USING (is_manager(auth.uid()));