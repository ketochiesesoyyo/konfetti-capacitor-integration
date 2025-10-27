-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the matchmaking notifications to run every hour
SELECT cron.schedule(
  'matchmaking-notifications',
  '0 * * * *',
  $$SELECT net.http_post(
    url:='https://wyvaygkvuhayqyphngab.supabase.co/functions/v1/send-matchmaking-notifications',
    headers:='{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5dmF5Z2t2dWhheXF5cGhuZ2FiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4ODQ4OTUsImV4cCI6MjA3NjQ2MDg5NX0.RyLBtNSXo1KcQxhQtvrazCK8B8uxjUCzrcB755-xvNE"}'::jsonb
  );$$
);