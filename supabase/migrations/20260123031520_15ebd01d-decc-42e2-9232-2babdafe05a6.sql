-- Remove Stripe/payment related structures

-- 1. Drop the has_active_premium function if it exists
DROP FUNCTION IF EXISTS has_active_premium(uuid);

-- 2. Drop the subscriptions table
DROP TABLE IF EXISTS public.subscriptions;

-- 3. Drop the subscription-related enums (only if not used elsewhere)
DROP TYPE IF EXISTS subscription_status;
DROP TYPE IF EXISTS subscription_platform;

-- 4. Remove the plan column from events table
ALTER TABLE public.events DROP COLUMN IF EXISTS plan;