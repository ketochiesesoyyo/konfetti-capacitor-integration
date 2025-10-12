-- Fix authorization vulnerability in create_facilitated_match function
-- Add check to ensure only event hosts can create facilitated matches

CREATE OR REPLACE FUNCTION public.create_facilitated_match(
  _intro_request_id UUID,
  _host_note TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _match_id UUID;
  _requester_id UUID;
  _target_id UUID;
  _event_id UUID;
  _host_id UUID;
  _requester_name TEXT;
  _target_name TEXT;
BEGIN
  -- Get intro request details
  SELECT requester_id, target_id, event_id
  INTO _requester_id, _target_id, _event_id
  FROM intro_requests
  WHERE id = _intro_request_id;
  
  -- Get host ID
  SELECT created_by INTO _host_id
  FROM events
  WHERE id = _event_id;
  
  -- CRITICAL SECURITY CHECK: Verify caller is the event host
  IF auth.uid() != _host_id THEN
    RAISE EXCEPTION 'Only the event host can create facilitated matches'
      USING ERRCODE = '42501'; -- insufficient_privilege
  END IF;
  
  -- Get user names
  SELECT name INTO _requester_name FROM profiles WHERE user_id = _requester_id;
  SELECT name INTO _target_name FROM profiles WHERE user_id = _target_id;
  
  -- Create match
  INSERT INTO matches (user1_id, user2_id, event_id)
  VALUES (_requester_id, _target_id, _event_id)
  RETURNING id INTO _match_id;
  
  -- Send introduction message from host
  INSERT INTO messages (match_id, sender_id, content)
  VALUES (
    _match_id,
    _host_id,
    'Hey ' || _requester_name || ' and ' || _target_name || '! ' || COALESCE(_host_note, 'I think you two should connect! Say hi! 👋')
  );
  
  -- Update intro request status
  UPDATE intro_requests
  SET status = 'approved', host_note = _host_note, updated_at = now()
  WHERE id = _intro_request_id;
  
  RETURN _match_id;
END;
$$;