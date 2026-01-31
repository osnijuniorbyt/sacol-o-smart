
-- CRIAR ENUMS PARA AS NOVAS TABELAS
CREATE TYPE public.person_type AS ENUM ('funcionario', 'cliente', 'motorista');
CREATE TYPE public.packaging_material AS ENUM ('plastico', 'madeira', 'papelao', 'isopor');
CREATE TYPE public.location_type AS ENUM ('box_ceasa', 'camara_fria', 'pulmao', 'deposito', 'gondola');

-- 1. TABELA PEOPLE (Pessoas: funcionários, clientes, motoristas)
CREATE TABLE public.people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type person_type NOT NULL DEFAULT 'cliente',
  cpf_cnpj VARCHAR(20) UNIQUE,
  phone VARCHAR(20),
  email VARCHAR(255),
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. TABELA PACKAGINGS (Embalagens com peso tara)
CREATE TABLE public.packagings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  tare_weight NUMERIC(10,3) NOT NULL DEFAULT 0,
  material packaging_material NOT NULL DEFAULT 'plastico',
  is_returnable BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. TABELA LOCATIONS (Locais de armazenamento)
CREATE TABLE public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  type location_type NOT NULL DEFAULT 'deposito',
  max_capacity NUMERIC(10,2),
  temperature_min NUMERIC(5,2),
  temperature_max NUMERIC(5,2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- HABILITAR RLS
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packagings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS RLS - PEOPLE
CREATE POLICY "Authenticated users can view people"
  ON public.people FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert people"
  ON public.people FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update people"
  ON public.people FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete people"
  ON public.people FOR DELETE TO authenticated USING (true);

-- POLÍTICAS RLS - PACKAGINGS
CREATE POLICY "Authenticated users can view packagings"
  ON public.packagings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert packagings"
  ON public.packagings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update packagings"
  ON public.packagings FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete packagings"
  ON public.packagings FOR DELETE TO authenticated USING (true);

-- POLÍTICAS RLS - LOCATIONS
CREATE POLICY "Authenticated users can view locations"
  ON public.locations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert locations"
  ON public.locations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update locations"
  ON public.locations FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete locations"
  ON public.locations FOR DELETE TO authenticated USING (true);

-- ÍNDICES PARA BUSCA
CREATE INDEX idx_people_name ON people(name);
CREATE INDEX idx_people_type ON people(type);
CREATE INDEX idx_people_cpf_cnpj ON people(cpf_cnpj);
CREATE INDEX idx_packagings_name ON packagings(name);
CREATE INDEX idx_locations_name ON locations(name);
CREATE INDEX idx_locations_type ON locations(type);

-- TRIGGERS PARA UPDATED_AT
CREATE TRIGGER update_people_updated_at
  BEFORE UPDATE ON people FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_packagings_updated_at
  BEFORE UPDATE ON packagings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_locations_updated_at
  BEFORE UPDATE ON locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ADICIONAR COLUNA location_id EM stock_batches
ALTER TABLE public.stock_batches ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_stock_batches_location ON stock_batches(location_id);

-- SEED DATA - LOCAIS
INSERT INTO public.locations (name, type, max_capacity, temperature_min, temperature_max) VALUES
  ('Câmara Fria 1', 'camara_fria', 500, 2, 8),
  ('Câmara Fria 2', 'camara_fria', 300, 0, 4),
  ('Depósito Principal', 'deposito', 1000, NULL, NULL),
  ('Gôndola Frutas', 'gondola', 50, NULL, NULL),
  ('Pulmão Recebimento', 'pulmao', 200, NULL, NULL);

-- SEED DATA - EMBALAGENS
INSERT INTO public.packagings (name, tare_weight, material, is_returnable) VALUES
  ('Caixa Plástica 20kg', 1.200, 'plastico', true),
  ('Caixa Madeira CEASA', 2.500, 'madeira', true),
  ('Bandeja Isopor', 0.050, 'isopor', false),
  ('Caixa Papelão', 0.300, 'papelao', false),
  ('Engradado Plástico', 1.800, 'plastico', true);

-- SEED DATA - PESSOAS
INSERT INTO public.people (name, type, cpf_cnpj, phone) VALUES
  ('João Silva', 'funcionario', '123.456.789-00', '(19) 99999-0001'),
  ('Maria Santos', 'funcionario', '234.567.890-11', '(19) 99999-0002'),
  ('Carlos Oliveira', 'motorista', '345.678.901-22', '(19) 99999-0003'),
  ('Mercado Central', 'cliente', '12.345.678/0001-90', '(19) 3333-1111'),
  ('Restaurante Sabor', 'cliente', '23.456.789/0001-01', '(19) 3333-2222');
