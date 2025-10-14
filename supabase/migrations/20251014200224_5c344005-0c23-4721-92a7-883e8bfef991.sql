-- Drop the broken policies
DROP POLICY IF EXISTS "Event creators can upload event photos" ON storage.objects;
DROP POLICY IF EXISTS "Event creators can update event photos" ON storage.objects;
DROP POLICY IF EXISTS "Event creators can delete event photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view event photos" ON storage.objects;

-- Recreate with correct UUID extraction (UUIDs are always 36 characters)
CREATE POLICY "Event creators can upload event photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-photos' 
  AND EXISTS (
    SELECT 1 FROM events
    WHERE id::text = substring(name, 1, 36)
    AND created_by = auth.uid()
  )
);

CREATE POLICY "Event creators can update event photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'event-photos'
  AND EXISTS (
    SELECT 1 FROM events
    WHERE id::text = substring(name, 1, 36)
    AND created_by = auth.uid()
  )
);

CREATE POLICY "Event creators can delete event photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'event-photos'
  AND EXISTS (
    SELECT 1 FROM events
    WHERE id::text = substring(name, 1, 36)
    AND created_by = auth.uid()
  )
);

CREATE POLICY "Anyone can view event photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'event-photos');