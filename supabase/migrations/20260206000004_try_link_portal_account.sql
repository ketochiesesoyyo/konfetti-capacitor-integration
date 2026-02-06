-- RPC function to link an existing auth user to an invited contact
-- Handles the case where someone already has an app account and gets invited to the portal
CREATE OR REPLACE FUNCTION public.try_link_portal_account()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _email text;
  _linked boolean := false;
BEGIN
  -- Get the current user's email
  SELECT email INTO _email FROM auth.users WHERE id = auth.uid();

  IF _email IS NULL THEN
    RETURN false;
  END IF;

  -- Try to link to an invited contact
  UPDATE public.contacts
  SET user_id = auth.uid()
  WHERE email = _email
    AND invited_at IS NOT NULL
    AND user_id IS NULL;

  IF FOUND THEN
    -- Assign client role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (auth.uid(), 'client')
    ON CONFLICT DO NOTHING;
    _linked := true;
  END IF;

  RETURN _linked;
END;
$$;
