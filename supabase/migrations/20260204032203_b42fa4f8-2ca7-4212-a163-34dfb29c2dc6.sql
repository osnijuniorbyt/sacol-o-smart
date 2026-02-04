-- Criar ENUM para unidade de venda (conversão)
CREATE TYPE public.unidade_venda AS ENUM ('PARA_UN', 'PARA_KG');

-- Remover coluna VARCHAR e adicionar com ENUM correto
ALTER TABLE public.products DROP COLUMN IF EXISTS unidade_venda;
ALTER TABLE public.products ADD COLUMN unidade_venda unidade_venda DEFAULT 'PARA_KG';

-- Adicionar categoria_visual para filtros visuais
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS categoria_visual categoria_visual;

-- Remover fator_conversao (não faz mais sentido com novo modelo)
ALTER TABLE public.products DROP COLUMN IF EXISTS fator_conversao;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_products_unidade_venda ON public.products(unidade_venda);
CREATE INDEX IF NOT EXISTS idx_products_plu ON public.products(plu);
CREATE INDEX IF NOT EXISTS idx_products_categoria_visual ON public.products(categoria_visual);

-- Comentários explicativos
COMMENT ON COLUMN public.products.unidade_venda IS 'PARA_UN = converte para unidades, PARA_KG = converte para quilos';
COMMENT ON COLUMN public.products.categoria_visual IS 'Categoria visual para filtros na tela (FRUTA, LEGUME, VERDURA, TEMPERO, OUTROS)';
COMMENT ON COLUMN public.products.peso_por_unidade IS 'Peso em kg por unidade de venda (usado quando unidade_venda = PARA_UN)';