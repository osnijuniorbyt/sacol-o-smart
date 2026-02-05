-- Secure product-images bucket: Remove public write policies and restrict to managers
DROP POLICY IF EXISTS "Public write product images" ON storage.objects;
DROP POLICY IF EXISTS "Public update product images" ON storage.objects;
DROP POLICY IF EXISTS "Public delete product images" ON storage.objects;

-- Secure receiving-photos bucket: Remove public write policies and restrict to managers
DROP POLICY IF EXISTS "Public write receiving photos" ON storage.objects;
DROP POLICY IF EXISTS "Public update receiving photos" ON storage.objects;
DROP POLICY IF EXISTS "Public delete receiving photos" ON storage.objects;

-- Create manager-only policies for product-images bucket
CREATE POLICY "Managers can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND public.is_manager(auth.uid())
);

CREATE POLICY "Managers can update product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND public.is_manager(auth.uid())
);

CREATE POLICY "Managers can delete product images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND public.is_manager(auth.uid())
);

-- Create manager-only policies for receiving-photos bucket
CREATE POLICY "Managers can upload receiving photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'receiving-photos'
  AND public.is_manager(auth.uid())
);

CREATE POLICY "Managers can update receiving photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'receiving-photos'
  AND public.is_manager(auth.uid())
);

CREATE POLICY "Managers can delete receiving photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'receiving-photos'
  AND public.is_manager(auth.uid())
);