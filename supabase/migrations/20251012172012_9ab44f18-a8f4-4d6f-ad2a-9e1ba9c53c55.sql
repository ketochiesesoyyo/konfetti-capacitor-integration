-- Make interested_in column nullable to allow profile creation during signup
-- Users will complete their preferences in the edit profile flow
ALTER TABLE public.profiles 
ALTER COLUMN interested_in DROP NOT NULL;