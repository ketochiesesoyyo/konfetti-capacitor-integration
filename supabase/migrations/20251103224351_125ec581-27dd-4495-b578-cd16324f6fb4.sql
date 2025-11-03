-- Add conversation_id column to notification_logs for rate limiting new message emails
ALTER TABLE notification_logs
ADD COLUMN IF NOT EXISTS conversation_id uuid;

-- Ensure created_at exists with default (it should already exist)
-- This is just for safety in case it doesn't
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notification_logs' 
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE notification_logs
    ADD COLUMN created_at timestamptz NOT NULL DEFAULT now();
  END IF;
END $$;