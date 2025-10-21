-- Add UUID format validation and text sanitization to RPC functions

CREATE OR REPLACE FUNCTION public.report_user_transaction(
  _reporter_id uuid, 
  _reported_user_id uuid, 
  _event_id uuid, 
  _match_id uuid, 
  _reason text, 
  _custom_reason text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate UUID format for all UUID parameters
  IF _reporter_id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RAISE EXCEPTION 'Invalid UUID format for reporter_id';
  END IF;
  
  IF _reported_user_id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RAISE EXCEPTION 'Invalid UUID format for reported_user_id';
  END IF;
  
  IF _event_id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RAISE EXCEPTION 'Invalid UUID format for event_id';
  END IF;
  
  IF _match_id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RAISE EXCEPTION 'Invalid UUID format for match_id';
  END IF;
  
  -- Sanitize text inputs (trim whitespace)
  _reason := trim(_reason);
  _custom_reason := trim(_custom_reason);
  
  -- Validate both users are event attendees FIRST
  IF NOT EXISTS (
    SELECT 1 FROM event_attendees 
    WHERE user_id = _reporter_id AND event_id = _event_id
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Reporter is not an event attendee';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM event_attendees 
    WHERE user_id = _reported_user_id AND event_id = _event_id
  ) THEN
    RAISE EXCEPTION 'Invalid: Reported user is not an event attendee';
  END IF;
  
  -- Verify caller is authorized (is one of the match participants)
  IF NOT EXISTS (
    SELECT 1 FROM matches
    WHERE id = _match_id
      AND (_reporter_id = user1_id OR _reporter_id = user2_id)
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Not a participant in this match';
  END IF;
  
  -- Validate input lengths
  IF char_length(_reason) = 0 OR char_length(_reason) > 100 THEN
    RAISE EXCEPTION 'Invalid reason length';
  END IF;
  
  IF _custom_reason IS NOT NULL AND char_length(_custom_reason) > 500 THEN
    RAISE EXCEPTION 'Custom reason too long';
  END IF;
  
  -- Insert report record
  INSERT INTO reports (
    reporter_id, reported_user_id, event_id, match_id, reason, custom_reason
  )
  VALUES (
    _reporter_id, _reported_user_id, _event_id, _match_id, _reason, _custom_reason
  );
  
  -- Insert unmatch record
  INSERT INTO unmatches (
    unmatcher_id, unmatched_user_id, event_id, match_id, reason, description
  )
  VALUES (
    _reporter_id, _reported_user_id, _event_id, _match_id, _reason, _custom_reason
  )
  ON CONFLICT (unmatcher_id, unmatched_user_id, event_id) DO NOTHING;
  
  -- Insert audit log
  INSERT INTO audit_logs (
    action_type, actor_id, target_id, event_id, match_id, reason, description
  )
  VALUES (
    'report', _reporter_id, _reported_user_id, _event_id, _match_id, _reason, _custom_reason
  );
  
  -- Delete swipe
  DELETE FROM swipes
  WHERE user_id = _reporter_id
    AND swiped_user_id = _reported_user_id
    AND event_id = _event_id;
  
  -- Delete messages
  DELETE FROM messages WHERE match_id = _match_id;
  
  -- Delete match
  DELETE FROM matches WHERE id = _match_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.unmatch_user_transaction(
  _unmatcher_id uuid, 
  _unmatched_user_id uuid, 
  _event_id uuid, 
  _match_id uuid, 
  _reason text, 
  _description text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate UUID format for all UUID parameters
  IF _unmatcher_id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RAISE EXCEPTION 'Invalid UUID format for unmatcher_id';
  END IF;
  
  IF _unmatched_user_id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RAISE EXCEPTION 'Invalid UUID format for unmatched_user_id';
  END IF;
  
  IF _event_id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RAISE EXCEPTION 'Invalid UUID format for event_id';
  END IF;
  
  IF _match_id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RAISE EXCEPTION 'Invalid UUID format for match_id';
  END IF;
  
  -- Sanitize text inputs (trim whitespace)
  _reason := trim(_reason);
  _description := trim(_description);
  
  -- Validate both users are event attendees FIRST
  IF NOT EXISTS (
    SELECT 1 FROM event_attendees 
    WHERE user_id = _unmatcher_id AND event_id = _event_id
  ) THEN
    RAISE EXCEPTION 'Unauthorized: You are not an event attendee';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM event_attendees 
    WHERE user_id = _unmatched_user_id AND event_id = _event_id
  ) THEN
    RAISE EXCEPTION 'Invalid: Other user is not an event attendee';
  END IF;
  
  -- Verify caller is authorized (is one of the match participants)
  IF NOT EXISTS (
    SELECT 1 FROM matches
    WHERE id = _match_id
      AND (_unmatcher_id = user1_id OR _unmatcher_id = user2_id)
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Not a participant in this match';
  END IF;
  
  -- Validate input lengths
  IF char_length(_reason) = 0 OR char_length(_reason) > 100 THEN
    RAISE EXCEPTION 'Invalid reason length';
  END IF;
  
  IF _description IS NOT NULL AND char_length(_description) > 500 THEN
    RAISE EXCEPTION 'Description too long';
  END IF;
  
  -- Insert unmatch record (idempotent due to unique constraint)
  INSERT INTO unmatches (
    unmatcher_id, unmatched_user_id, event_id, match_id, reason, description
  )
  VALUES (
    _unmatcher_id, _unmatched_user_id, _event_id, _match_id, _reason, _description
  )
  ON CONFLICT (unmatcher_id, unmatched_user_id, event_id) DO NOTHING;
  
  -- Insert audit log
  INSERT INTO audit_logs (
    action_type, actor_id, target_id, event_id, match_id, reason, description
  )
  VALUES (
    'unmatch', _unmatcher_id, _unmatched_user_id, _event_id, _match_id, _reason, _description
  );
  
  -- Delete swipe (allow profile to reappear)
  DELETE FROM swipes
  WHERE user_id = _unmatcher_id
    AND swiped_user_id = _unmatched_user_id
    AND event_id = _event_id;
  
  -- Delete messages
  DELETE FROM messages WHERE match_id = _match_id;
  
  -- Delete match
  DELETE FROM matches WHERE id = _match_id;
END;
$$;