-- Fix security issue: Set search_path for the set_event_close_date function
-- This ensures the function runs with a predictable search path

CREATE OR REPLACE FUNCTION set_event_close_date()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- If date is provided, always set close_date to be 3 days after the event date
  IF NEW.date IS NOT NULL THEN
    NEW.close_date := (NEW.date + INTERVAL '3 days')::date;
  END IF;
  RETURN NEW;
END;
$$;