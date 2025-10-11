-- Create a secure function to validate invite codes
-- This bypasses RLS to allow users to lookup events by invite code
CREATE OR REPLACE FUNCTION public.validate_invite_code(code TEXT)
RETURNS TABLE(event_id uuid, event_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT id, name
  FROM events
  WHERE invite_code = code
    AND status = 'active'
  LIMIT 1;
END;
$$;