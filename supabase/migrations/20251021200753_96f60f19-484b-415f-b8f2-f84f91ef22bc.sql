-- Make storage buckets private for security
UPDATE storage.buckets
SET public = false
WHERE id IN ('profile-photos', 'event-photos');

-- Drop existing profile-photos policies
DROP POLICY IF EXISTS "Users can upload own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view profile photos" ON storage.objects;

-- Drop existing event-photos policies to recreate with closed event logic
DROP POLICY IF EXISTS "Event attendees and hosts can view event photos" ON storage.objects;
DROP POLICY IF EXISTS "Event hosts can upload event photos with validation" ON storage.objects;
DROP POLICY IF EXISTS "Event hosts can update event photos with validation" ON storage.objects;
DROP POLICY IF EXISTS "Event hosts can delete event photos with validation" ON storage.objects;

-- PROFILE PHOTOS POLICIES
-- Users can only view profile photos if they share an active event OR have matched (even after event closes)
CREATE POLICY "Users can view profiles they share events with or matched"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'profile-photos'
  AND (
    -- Own photos
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    -- Share an active event with the profile owner
    users_share_active_event(auth.uid(), ((storage.foldername(name))[1])::uuid)
    OR
    -- Have matched with this user (even if event is closed)
    EXISTS (
      SELECT 1 FROM matches m
      WHERE (m.user1_id = auth.uid() AND m.user2_id = ((storage.foldername(name))[1])::uuid)
         OR (m.user2_id = auth.uid() AND m.user1_id = ((storage.foldername(name))[1])::uuid)
    )
  )
);

CREATE POLICY "Users can upload their own profile photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own profile photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own profile photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- EVENT PHOTOS POLICIES
-- Users can view event photos if:
-- 1. They are host or attendee while event is active
-- 2. They matched with someone from that event (even after event closes)
CREATE POLICY "Event photos visible to attendees and matched users"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'event-photos'
  AND (
    -- Event host can always view
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id::text = substring(name, 1, 36)
        AND e.created_by = auth.uid()
    )
    OR
    -- Event attendees can view while event is active
    EXISTS (
      SELECT 1 FROM events e
      JOIN event_attendees ea ON ea.event_id = e.id
      WHERE e.id::text = substring(name, 1, 36)
        AND ea.user_id = auth.uid()
        AND e.status = 'active'
        AND e.close_date >= CURRENT_DATE
    )
    OR
    -- Users who matched at this event can view even after it closes
    EXISTS (
      SELECT 1 FROM matches m
      WHERE m.event_id::text = substring(name, 1, 36)
        AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
  )
);

CREATE POLICY "Event hosts can upload event photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-photos'
  AND name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-[0-9]+\.(jpg|jpeg|png|webp)$'
  AND EXISTS (
    SELECT 1 FROM events
    WHERE id::text = substring(name, 1, 36)
      AND created_by = auth.uid()
  )
);

CREATE POLICY "Event hosts can update event photos"
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

CREATE POLICY "Event hosts can delete event photos"
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