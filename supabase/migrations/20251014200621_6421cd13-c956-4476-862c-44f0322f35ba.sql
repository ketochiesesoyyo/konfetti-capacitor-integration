-- Drop existing policies
DROP POLICY IF EXISTS "Event creators can upload event photos" ON storage.objects;
DROP POLICY IF EXISTS "Event creators can update event photos" ON storage.objects;
DROP POLICY IF EXISTS "Event creators can delete event photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view event photos" ON storage.objects;

-- Recreate with support for BOTH patterns:
-- 1. userId/filename.ext (for new events in CreateEvent)
-- 2. eventId-timestamp.ext (for existing events in EventDashboard)

CREATE POLICY "Event creators can upload event photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-photos' 
  AND (
    -- Allow upload to user's own folder
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    -- Allow upload with event ID prefix if user created that event
    EXISTS (
      SELECT 1 FROM events
      WHERE id::text = substring(name, 1, 36)
      AND created_by = auth.uid()
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
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    EXISTS (
      SELECT 1 FROM events
      WHERE id::text = substring(name, 1, 36)
      AND created_by = auth.uid()
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
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    EXISTS (
      SELECT 1 FROM events
      WHERE id::text = substring(name, 1, 36)
      AND created_by = auth.uid()
    )
  )
);

CREATE POLICY "Anyone can view event photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'event-photos');