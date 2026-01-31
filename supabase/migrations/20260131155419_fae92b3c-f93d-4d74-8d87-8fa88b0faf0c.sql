-- Create suppliers table
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18),
  phone VARCHAR(20),
  payment_terms INTEGER DEFAULT 0, -- days
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on suppliers
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for suppliers
CREATE POLICY "Authenticated users can view suppliers"
ON public.suppliers FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert suppliers"
ON public.suppliers FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated users can update suppliers"
ON public.suppliers FOR UPDATE
USING (true);

CREATE POLICY "Authenticated users can delete suppliers"
ON public.suppliers FOR DELETE
USING (true);

-- Add new columns to products table
ALTER TABLE public.products
ADD COLUMN codigo_balanca VARCHAR(20),
ADD COLUMN custo_compra NUMERIC DEFAULT 0,
ADD COLUMN supplier_id UUID REFERENCES public.suppliers(id),
ADD COLUMN shelf_life INTEGER DEFAULT 7, -- days
ADD COLUMN fator_conversao NUMERIC DEFAULT 1;

-- Create trigger for suppliers updated_at
CREATE TRIGGER update_suppliers_updated_at
BEFORE UPDATE ON public.suppliers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();