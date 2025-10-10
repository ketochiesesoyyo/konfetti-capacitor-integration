-- Add close_date column to events table
ALTER TABLE public.events 
ADD COLUMN close_date date NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '3 days');