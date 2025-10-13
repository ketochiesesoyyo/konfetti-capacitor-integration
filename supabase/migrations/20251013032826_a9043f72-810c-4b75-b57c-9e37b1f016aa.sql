-- Add theme preference to profiles table
ALTER TABLE public.profiles 
ADD COLUMN theme_preference TEXT DEFAULT 'sunset';