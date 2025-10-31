-- Ensure full row data is captured for realtime updates
ALTER TABLE public.messages REPLICA IDENTITY FULL;