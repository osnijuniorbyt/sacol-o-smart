-- Dropar tabelas anteriores
DROP TABLE IF EXISTS public.demand_request_items CASCADE;
DROP TABLE IF EXISTS public.demand_requests CASCADE;

-- Criar ENUMs
CREATE TYPE public.status_lote_demanda AS ENUM ('ABERTO', 'EM_COMPRA', 'RECEBIDO', 'FECHADO');
CREATE TYPE public.prioridade_demanda AS ENUM ('BAIXA', 'NORMAL', 'ALTA', 'URGENTE');
CREATE TYPE public.categoria_visual AS ENUM ('FRUTA', 'LEGUME', 'VERDURA', 'TEMPERO', 'OUTROS');

-- Tabela de Lotes de Demanda (O Pedido da Loja)
CREATE TABLE public.lotes_demanda (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo VARCHAR(100) NOT NULL, -- "Segunda-feira", "Reposição Urgente"
  data_necessidade DATE NOT NULL, -- Quando precisa estar na loja
  status status_lote_demanda NOT NULL DEFAULT 'ABERTO',
  prioridade prioridade_demanda NOT NULL DEFAULT 'NORMAL',
  observacoes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Itens de Demanda (Produtos do lote)
CREATE TABLE public.itens_demanda (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lote_id UUID NOT NULL REFERENCES public.lotes_demanda(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  qtd_sugerida NUMERIC(10,3) NOT NULL CHECK (qtd_sugerida > 0),
  prioridade prioridade_demanda NOT NULL DEFAULT 'NORMAL',
  categoria categoria_visual,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_lotes_demanda_status ON public.lotes_demanda(status);
CREATE INDEX idx_lotes_demanda_data ON public.lotes_demanda(data_necessidade);
CREATE INDEX idx_itens_demanda_lote ON public.itens_demanda(lote_id);
CREATE INDEX idx_itens_demanda_product ON public.itens_demanda(product_id);

-- Enable RLS
ALTER TABLE public.lotes_demanda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_demanda ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Authenticated users can manage lotes_demanda" 
  ON public.lotes_demanda FOR ALL 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage itens_demanda" 
  ON public.itens_demanda FOR ALL 
  USING (auth.role() = 'authenticated');

-- Trigger para updated_at
CREATE TRIGGER update_lotes_demanda_updated_at
  BEFORE UPDATE ON public.lotes_demanda
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();