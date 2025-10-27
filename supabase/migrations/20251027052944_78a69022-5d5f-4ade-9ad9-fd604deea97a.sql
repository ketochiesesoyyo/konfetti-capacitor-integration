-- Update cron job to include CRON_SECRET for authentication
-- First, unschedule the existing job
SELECT cron.unschedule('matchmaking-notifications');

-- Create the updated job with the secret header
-- Note: The CRON_SECRET must be set in Supabase secrets (already done)
-- We'll pass it through as a parameter using pg_cron's job_data feature
SELECT cron.schedule(
  'matchmaking-notifications',
  '0 * * * *',  -- Every hour at the top of the hour
  $$
  SELECT net.http_post(
    url := 'https://wyvaygkvuhayqyphngab.supabase.co/functions/v1/send-matchmaking-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', current_setting('vault.secrets', true)::jsonb->>'CRON_SECRET'
    )
  );
  $$
);