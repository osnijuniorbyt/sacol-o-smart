-- Enum para categorias de produtos
CREATE TYPE public.product_category AS ENUM ('frutas', 'verduras', 'legumes', 'temperos', 'outros');

-- Enum para unidades de medida
CREATE TYPE public.unit_type AS ENUM ('kg', 'un', 'maco', 'bandeja');

-- Enum para motivos de quebra
CREATE TYPE public.breakage_reason AS ENUM ('vencido', 'danificado', 'furto', 'erro_operacional', 'outro');

-- Tabela de produtos
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plu VARCHAR(5) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  category product_category NOT NULL DEFAULT 'outros',
  unit unit_type NOT NULL DEFAULT 'kg',
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  min_stock DECIMAL(10,3) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de lotes de estoque
CREATE TABLE public.stock_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity DECIMAL(10,3) NOT NULL DEFAULT 0,
  cost_per_unit DECIMAL(10,2) NOT NULL DEFAULT 0,
  expiry_date DATE,
  received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de vendas
CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  items_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de itens de venda
CREATE TABLE public.sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  batch_id UUID REFERENCES public.stock_batches(id),
  quantity DECIMAL(10,3) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de quebras
CREATE TABLE public.breakages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id),
  batch_id UUID REFERENCES public.stock_batches(id),
  quantity DECIMAL(10,3) NOT NULL,
  cost_per_unit DECIMAL(10,2) NOT NULL,
  total_loss DECIMAL(10,2) NOT NULL,
  reason breakage_reason NOT NULL DEFAULT 'outro',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_stock_batches_product ON public.stock_batches(product_id);
CREATE INDEX idx_stock_batches_expiry ON public.stock_batches(expiry_date);
CREATE INDEX idx_sale_items_sale ON public.sale_items(sale_id);
CREATE INDEX idx_breakages_product ON public.breakages(product_id);
CREATE INDEX idx_products_plu ON public.products(plu);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breakages ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para usuários autenticados
CREATE POLICY "Authenticated users can view products" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert products" ON public.products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update products" ON public.products FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete products" ON public.products FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view stock_batches" ON public.stock_batches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert stock_batches" ON public.stock_batches FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update stock_batches" ON public.stock_batches FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete stock_batches" ON public.stock_batches FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view sales" ON public.sales FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert sales" ON public.sales FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update sales" ON public.sales FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete sales" ON public.sales FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view sale_items" ON public.sale_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert sale_items" ON public.sale_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update sale_items" ON public.sale_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete sale_items" ON public.sale_items FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view breakages" ON public.breakages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert breakages" ON public.breakages FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update breakages" ON public.breakages FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete breakages" ON public.breakages FOR DELETE TO authenticated USING (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();