-- Disable RLS on storage.objects
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Create policies for the 'files' bucket
CREATE POLICY "Allow authenticated users to upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'files' AND
  (storage.foldername(name))[1] = 'files' AND
  (storage.foldername(name))[2] IN (
    SELECT id FROM workflows WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Allow authenticated users to read their own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'files' AND
  (storage.foldername(name))[1] = 'files' AND
  (storage.foldername(name))[2] IN (
    SELECT id FROM workflows WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Allow authenticated users to update their own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'files' AND
  (storage.foldername(name))[1] = 'files' AND
  (storage.foldername(name))[2] IN (
    SELECT id FROM workflows WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'files' AND
  (storage.foldername(name))[1] = 'files' AND
  (storage.foldername(name))[2] IN (
    SELECT id FROM workflows WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Allow authenticated users to delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'files' AND
  (storage.foldername(name))[1] = 'files' AND
  (storage.foldername(name))[2] IN (
    SELECT id FROM workflows WHERE user_id = auth.uid()
  )
); 