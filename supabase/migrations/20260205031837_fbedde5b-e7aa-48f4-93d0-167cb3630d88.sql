-- Make receiving-photos bucket private (product-images stays public per user decision)
UPDATE storage.buckets 
SET public = false 
WHERE id = 'receiving-photos';

-- Remove public read policy for receiving-photos
DROP POLICY IF EXISTS "Public read receiving photos" ON storage.objects;

-- Create manager-only read policy for receiving-photos
CREATE POLICY "Managers can read receiving photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'receiving-photos'
  AND public.is_manager(auth.uid())
);