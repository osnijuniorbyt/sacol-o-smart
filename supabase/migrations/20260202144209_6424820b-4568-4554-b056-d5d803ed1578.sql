-- Add image_url column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT NULL;

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy for public read access to product images
CREATE POLICY "Public read product images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'product-images');

-- Policy for public write access (for testing - can be restricted later)
CREATE POLICY "Public write product images" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'product-images');

-- Policy for public update access
CREATE POLICY "Public update product images" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'product-images');

-- Policy for public delete access
CREATE POLICY "Public delete product images" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'product-images');