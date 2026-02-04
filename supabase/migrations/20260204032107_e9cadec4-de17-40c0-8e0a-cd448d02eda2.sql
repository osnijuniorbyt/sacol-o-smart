-- Expandir enum unit_type com mais opções
ALTER TYPE public.unit_type ADD VALUE IF NOT EXISTS 'caixa';
ALTER TYPE public.unit_type ADD VALUE IF NOT EXISTS 'engradado';
ALTER TYPE public.unit_type ADD VALUE IF NOT EXISTS 'saco';
ALTER TYPE public.unit_type ADD VALUE IF NOT EXISTS 'penca';

-- Adicionar campos na tabela products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS unidade_venda VARCHAR(20) DEFAULT 'kg',
  ADD COLUMN IF NOT EXISTS peso_por_unidade NUMERIC(10,3) DEFAULT 1.0;

-- Comentários explicativos
COMMENT ON COLUMN public.products.unidade_venda IS 'Unidade de venda no PDV (ex: un, bandeja, kg)';
COMMENT ON COLUMN public.products.peso_por_unidade IS 'Peso em kg por unidade de venda (ex: 1 bandeja = 0.300kg)';