-- Remove the events_secure view since it's causing confusion with security scanners
-- We'll handle invite code masking in the application layer instead
DROP VIEW IF EXISTS public.events_secure;