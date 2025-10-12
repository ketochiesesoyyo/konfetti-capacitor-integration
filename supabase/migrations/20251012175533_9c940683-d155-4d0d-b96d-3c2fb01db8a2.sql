-- Add age preference columns to profiles table
ALTER TABLE profiles
ADD COLUMN age_min INTEGER DEFAULT 18,
ADD COLUMN age_max INTEGER DEFAULT 99;

-- Add check constraints to ensure valid ranges
ALTER TABLE profiles
ADD CONSTRAINT age_min_valid CHECK (age_min >= 18 AND age_min <= 99),
ADD CONSTRAINT age_max_valid CHECK (age_max >= 18 AND age_max <= 99),
ADD CONSTRAINT age_range_valid CHECK (age_min <= age_max);