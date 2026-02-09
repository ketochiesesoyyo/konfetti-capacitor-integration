-- Change default email notification preferences to FALSE (opt-out by default)
ALTER TABLE public.profiles 
  ALTER COLUMN email_match_notifications SET DEFAULT false,
  ALTER COLUMN email_like_notifications SET DEFAULT false;

-- Update existing NULL values to false (new default)
UPDATE public.profiles 
SET email_match_notifications = false 
WHERE email_match_notifications IS NULL;

UPDATE public.profiles 
SET email_like_notifications = false 
WHERE email_like_notifications IS NULL;