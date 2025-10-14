-- Add image_url column to events table
ALTER TABLE public.events
ADD COLUMN image_url text;

-- Create event-photos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-photos', 'event-photos', true);

-- Allow authenticated users to upload event photos
CREATE POLICY "Authenticated users can upload event photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'event-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public to view event photos
CREATE POLICY "Event photos are publicly accessible"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'event-photos');

-- Allow users to update their own event photos
CREATE POLICY "Users can update their own event photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'event-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own event photos
CREATE POLICY "Users can delete their own event photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'event-photos' AND auth.uid()::text = (storage.foldername(name))[1]);