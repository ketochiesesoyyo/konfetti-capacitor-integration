-- Make profile-photos bucket public for better mobile compatibility
-- RLS policies still control access security
UPDATE storage.buckets
SET public = true
WHERE id = 'profile-photos';