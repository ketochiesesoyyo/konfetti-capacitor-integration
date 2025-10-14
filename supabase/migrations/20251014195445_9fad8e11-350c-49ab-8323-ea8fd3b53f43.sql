-- Storage policies for event-photos bucket

-- Allow event creators to upload photos for their events
CREATE POLICY "Event creators can upload event photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
  OR EXISTS (
    SELECT 1 FROM events
    WHERE id::text = split_part(name, '-', 1)
    AND created_by = auth.uid()
  )
);

-- Allow event creators to update their event photos
CREATE POLICY "Event creators can update event photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'event-photos'
  AND EXISTS (
    SELECT 1 FROM events
    WHERE id::text = split_part(name, '-', 1)
    AND created_by = auth.uid()
  )
);

-- Allow event creators to delete their event photos
CREATE POLICY "Event creators can delete event photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'event-photos'
  AND EXISTS (
    SELECT 1 FROM events
    WHERE id::text = split_part(name, '-', 1)
    AND created_by = auth.uid()
  )
);

-- Allow public access to view event photos (bucket is already public)
CREATE POLICY "Anyone can view event photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'event-photos');