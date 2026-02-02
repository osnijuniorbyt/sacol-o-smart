-- Create storage bucket for receiving photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('receiving-photos', 'receiving-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access for receiving photos
CREATE POLICY "Public read receiving photos" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'receiving-photos');

-- Public write access for receiving photos
CREATE POLICY "Public write receiving photos" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'receiving-photos');

-- Public update access
CREATE POLICY "Public update receiving photos" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'receiving-photos');

-- Public delete access
CREATE POLICY "Public delete receiving photos" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'receiving-photos');

-- Create table to store photo references
CREATE TABLE public.receiving_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  captured_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.receiving_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for receiving_photos
CREATE POLICY "Public read receiving_photos" 
ON public.receiving_photos FOR SELECT 
USING (true);

CREATE POLICY "Public insert receiving_photos" 
ON public.receiving_photos FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Public update receiving_photos" 
ON public.receiving_photos FOR UPDATE 
USING (true);

CREATE POLICY "Public delete receiving_photos" 
ON public.receiving_photos FOR DELETE 
USING (true);

-- Index for faster lookups by order
CREATE INDEX idx_receiving_photos_order_id ON public.receiving_photos(order_id);