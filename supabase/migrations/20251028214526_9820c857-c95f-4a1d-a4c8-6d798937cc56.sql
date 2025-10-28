-- Make event-photos bucket public so images are always visible
UPDATE storage.buckets 
SET public = true 
WHERE id = 'event-photos';