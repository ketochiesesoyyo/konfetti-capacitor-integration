-- Create storage bucket for landing page assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'landing-assets', 
  'landing-assets', 
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to landing assets
CREATE POLICY "Public can view landing assets" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'landing-assets');