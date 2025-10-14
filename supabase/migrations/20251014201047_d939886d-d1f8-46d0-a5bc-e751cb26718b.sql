-- Drop broken policies
DROP POLICY IF EXISTS "Event creators can upload event photos" ON storage.objects;
DROP POLICY IF EXISTS "Event creators can update event photos" ON storage.objects;
DROP POLICY IF EXISTS "Event creators can delete event photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view event photos" ON storage.objects;

-- Recreate with correct variable reference (storage.objects.name, not events.name)
CREATE POLICY "Event creators can upload event photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-photos' 
  AND (
    -- Allow upload to user's own folder
    (storage.foldername(storage.objects.name))[1] = auth.uid()::text
    OR
    -- Allow upload with event ID prefix if user created that event
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id::text = substring(storage.objects.name, 1, 36)
      AND events.created_by = auth.uid()
    )
  )
);

CREATE POLICY "Event creators can update event photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'event-photos'
  AND (
    (storage.foldername(storage.objects.name))[1] = auth.uid()::text
    OR
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id::text = substring(storage.objects.name, 1, 36)
      AND events.created_by = auth.uid()
    )
  )
);

CREATE POLICY "Event creators can delete event photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'event-photos'
  AND (
    (storage.foldername(storage.objects.name))[1] = auth.uid()::text
    OR
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id::text = substring(storage.objects.name, 1, 36)
      AND events.created_by = auth.uid()
    )
  )
);

CREATE POLICY "Anyone can view event photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'event-photos');