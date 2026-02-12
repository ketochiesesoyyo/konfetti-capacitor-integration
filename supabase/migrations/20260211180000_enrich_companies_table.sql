-- Enrich companies table with business profile, social links, and wedding planner-specific fields

-- Social & web
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS instagram text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS linkedin text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS facebook text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS pinterest text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS tiktok text;

-- Location
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS regions_covered text[] DEFAULT '{}';

-- Business profile
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS employee_count integer;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS year_founded integer;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS tax_id text;

-- Wedding planner-specific
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS price_tier text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS avg_weddings_per_year integer;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS avg_guest_count integer;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS specialties text[] DEFAULT '{}';

-- Relationship management
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS partnership_tier text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS referral_source text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS commission_rate numeric;
