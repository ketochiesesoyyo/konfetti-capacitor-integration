-- Make gender column nullable to allow profile creation during signup
-- Users will complete their profile including gender in the edit profile flow
ALTER TABLE public.profiles 
ALTER COLUMN gender DROP NOT NULL;