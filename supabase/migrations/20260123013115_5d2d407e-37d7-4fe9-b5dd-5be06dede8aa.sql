-- Create a function to delete all user data and the user account
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
BEGIN
  -- Verify user is authenticated
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to delete account';
  END IF;

  -- Delete messages where user is sender
  DELETE FROM public.messages WHERE sender_id = _user_id;
  
  -- Delete messages where user is recipient
  DELETE FROM public.messages WHERE recipient_id = _user_id;

  -- Delete matches where user is involved
  DELETE FROM public.matches WHERE user1_id = _user_id OR user2_id = _user_id;

  -- Delete swipes by user
  DELETE FROM public.swipes WHERE user_id = _user_id;
  
  -- Delete swipes on user
  DELETE FROM public.swipes WHERE swiped_user_id = _user_id;

  -- Delete unmatches
  DELETE FROM public.unmatches WHERE unmatcher_id = _user_id OR unmatched_user_id = _user_id;

  -- Delete reports by user
  DELETE FROM public.reports WHERE reporter_id = _user_id;

  -- Delete device tokens
  DELETE FROM public.device_tokens WHERE user_id = _user_id;

  -- Delete event attendee records
  DELETE FROM public.event_attendees WHERE user_id = _user_id;
  
  -- Delete event departures
  DELETE FROM public.event_departures WHERE user_id = _user_id;

  -- Delete hidden events
  DELETE FROM public.hidden_events WHERE user_id = _user_id;

  -- Delete user roles
  DELETE FROM public.user_roles WHERE user_id = _user_id;

  -- Delete subscriptions
  DELETE FROM public.subscriptions WHERE user_id = _user_id;

  -- Get profile photos to delete from storage
  DECLARE
    _photos text[];
  BEGIN
    SELECT photos INTO _photos FROM public.profiles WHERE user_id = _user_id;
    -- Note: Storage cleanup would need to be done via edge function or trigger
  END;

  -- Delete profile
  DELETE FROM public.profiles WHERE user_id = _user_id;

  -- Delete the auth user (this will cascade to other auth-related tables)
  DELETE FROM auth.users WHERE id = _user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;