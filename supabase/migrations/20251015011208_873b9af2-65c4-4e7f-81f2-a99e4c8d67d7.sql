-- Fix storage RLS policies for event-photos bucket
-- This restricts photo access to event attendees and hosts only

-- Drop existing overly permissive policy
DROP POLICY IF EXISTS "Anyone can view event photos" ON storage.objects;

-- Create new restricted policy for SELECT (view photos)
-- Only authenticated users who are event attendees or hosts can view photos
CREATE POLICY "Event attendees and hosts can view event photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'event-photos'
  AND (
    -- Event host can view
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id::text = substring(name, 1, 36)
        AND e.created_by = auth.uid()
    )
    OR
    -- Event attendees can view
    EXISTS (
      SELECT 1 FROM events e
      JOIN event_attendees ea ON ea.event_id = e.id
      WHERE e.id::text = substring(name, 1, 36)
        AND ea.user_id = auth.uid()
    )
  )
);

-- Add file type validation to INSERT policy (update existing policy)
DROP POLICY IF EXISTS "Event hosts and users can upload event photos" ON storage.objects;

CREATE POLICY "Event hosts can upload event photos with validation"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-photos'
  -- Validate filename format: eventId-timestamp.extension
  AND name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-[0-9]+\.(jpg|jpeg|png|webp)$'
  AND (
    -- Event host can upload
    EXISTS (
      SELECT 1 FROM events
      WHERE id::text = substring(name, 1, 36)
        AND created_by = auth.uid()
    )
    OR
    -- User can upload to their own folder (for profile context)
    substring(name, 1, 36) = auth.uid()::text
  )
);

-- Update UPDATE policy with same validation
DROP POLICY IF EXISTS "Event hosts and users can update event photos" ON storage.objects;

CREATE POLICY "Event hosts can update event photos with validation"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'event-photos'
  AND (
    -- Event host can update
    EXISTS (
      SELECT 1 FROM events
      WHERE id::text = substring(name, 1, 36)
        AND created_by = auth.uid()
    )
    OR
    -- User can update their own folder photos
    substring(name, 1, 36) = auth.uid()::text
  )
);

-- Update DELETE policy with same validation
DROP POLICY IF EXISTS "Event hosts and users can delete event photos" ON storage.objects;

CREATE POLICY "Event hosts can delete event photos with validation"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'event-photos'
  AND (
    -- Event host can delete
    EXISTS (
      SELECT 1 FROM events
      WHERE id::text = substring(name, 1, 36)
        AND created_by = auth.uid()
    )
    OR
    -- User can delete their own folder photos
    substring(name, 1, 36) = auth.uid()::text
  )
);