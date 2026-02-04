-- Tabela de requisições de demanda (Loja → Compras)
CREATE TABLE public.demand_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requested_by UUID REFERENCES auth.users(id),
  status VARCHAR(20) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado', 'parcial')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES auth.users(id)
);

-- Itens da requisição de demanda
CREATE TABLE public.demand_request_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.demand_requests(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity_requested NUMERIC NOT NULL CHECK (quantity_requested > 0),
  quantity_approved NUMERIC,
  priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('baixa', 'normal', 'alta', 'urgente')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_demand_requests_status ON public.demand_requests(status);
CREATE INDEX idx_demand_requests_created_at ON public.demand_requests(created_at DESC);
CREATE INDEX idx_demand_request_items_request_id ON public.demand_request_items(request_id);
CREATE INDEX idx_demand_request_items_product_id ON public.demand_request_items(product_id);

-- Enable RLS
ALTER TABLE public.demand_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demand_request_items ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para demand_requests
CREATE POLICY "Public read demand_requests" ON public.demand_requests FOR SELECT USING (true);
CREATE POLICY "Public insert demand_requests" ON public.demand_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update demand_requests" ON public.demand_requests FOR UPDATE USING (true);
CREATE POLICY "Public delete demand_requests" ON public.demand_requests FOR DELETE USING (true);

-- Políticas RLS para demand_request_items
CREATE POLICY "Public read demand_request_items" ON public.demand_request_items FOR SELECT USING (true);
CREATE POLICY "Public insert demand_request_items" ON public.demand_request_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update demand_request_items" ON public.demand_request_items FOR UPDATE USING (true);
CREATE POLICY "Public delete demand_request_items" ON public.demand_request_items FOR DELETE USING (true);

-- Trigger para updated_at
CREATE TRIGGER update_demand_requests_updated_at
  BEFORE UPDATE ON public.demand_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();