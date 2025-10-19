-- Update validate_invite_code to include event image_url
DROP FUNCTION IF EXISTS public.validate_invite_code(text);

CREATE OR REPLACE FUNCTION public.validate_invite_code(code TEXT)
RETURNS TABLE(
  event_id uuid,
  event_name text,
  event_date date,
  event_description text,
  event_status text,
  event_theme text,
  guest_count bigint,
  image_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.name,
    e.date,
    e.description,
    e.status,
    COALESCE(e.description, 'sunset') as theme,
    COUNT(ea.user_id) as guest_count,
    e.image_url
  FROM events e
  LEFT JOIN event_attendees ea ON ea.event_id = e.id
  WHERE e.invite_code = code
    AND e.status = 'active'
  GROUP BY e.id, e.name, e.date, e.description, e.status, e.image_url
  LIMIT 1;
END;
$$;