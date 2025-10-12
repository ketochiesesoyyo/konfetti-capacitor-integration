-- First, convert empty strings to NULL for gender
UPDATE public.profiles 
SET gender = NULL 
WHERE gender = '';

-- Add interested_in column
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS interested_in TEXT;

-- Set default values for existing users
UPDATE public.profiles 
SET gender = 'man' 
WHERE gender IS NULL;

UPDATE public.profiles 
SET interested_in = 'both' 
WHERE interested_in IS NULL OR interested_in = '';

-- Make both columns required
ALTER TABLE public.profiles 
ALTER COLUMN gender SET NOT NULL,
ALTER COLUMN interested_in SET NOT NULL;

-- Add check constraints for valid values
ALTER TABLE public.profiles 
ADD CONSTRAINT gender_check CHECK (gender IN ('man', 'woman'));

ALTER TABLE public.profiles 
ADD CONSTRAINT interested_in_check CHECK (interested_in IN ('men', 'women', 'both'));