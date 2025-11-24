-- Add notification preferences to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_match_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS email_like_notifications BOOLEAN DEFAULT true;