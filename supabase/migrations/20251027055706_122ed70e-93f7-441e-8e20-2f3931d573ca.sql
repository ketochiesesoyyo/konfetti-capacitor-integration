-- Update the events table to ensure close_date defaults to 3 days after the event date
-- This migration ensures consistency: close_date is always wedding_date + 3 days

-- First, update existing events to have close_date = date + 3 days
-- Only update events where close_date is not already set correctly
UPDATE events
SET close_date = (date + INTERVAL '3 days')::date
WHERE date IS NOT NULL 
  AND (close_date IS NULL OR close_date != (date + INTERVAL '3 days')::date);

-- Update the default value for close_date
-- Note: We can't use a computed column directly referencing 'date' field in PostgreSQL
-- So we'll rely on application logic and triggers to maintain this rule
-- But we can update the default to be 3 days from CURRENT_DATE as a fallback
ALTER TABLE events 
  ALTER COLUMN close_date SET DEFAULT (CURRENT_DATE + INTERVAL '3 days')::date;

-- Add a trigger to automatically set close_date when date is set or updated
CREATE OR REPLACE FUNCTION set_event_close_date()
RETURNS TRIGGER AS $$
BEGIN
  -- If date is provided and close_date is not explicitly set, calculate it
  IF NEW.date IS NOT NULL THEN
    -- Always set close_date to be 3 days after the event date
    NEW.close_date := (NEW.date + INTERVAL '3 days')::date;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT
DROP TRIGGER IF EXISTS set_close_date_on_insert ON events;
CREATE TRIGGER set_close_date_on_insert
  BEFORE INSERT ON events
  FOR EACH ROW
  EXECUTE FUNCTION set_event_close_date();

-- Create trigger for UPDATE
DROP TRIGGER IF EXISTS set_close_date_on_update ON events;
CREATE TRIGGER set_close_date_on_update
  BEFORE UPDATE ON events
  FOR EACH ROW
  WHEN (NEW.date IS DISTINCT FROM OLD.date OR NEW.close_date IS DISTINCT FROM OLD.close_date)
  EXECUTE FUNCTION set_event_close_date();