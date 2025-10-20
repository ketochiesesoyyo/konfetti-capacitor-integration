-- Fix 1: Restrict profile visibility to active events only

-- Create new function that checks for active events and respects event departures
CREATE OR REPLACE FUNCTION public.users_share_active_event(user_a uuid, user_b uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.event_attendees ea1
    INNER JOIN public.event_attendees ea2 ON ea1.event_id = ea2.event_id
    INNER JOIN public.events e ON e.id = ea1.event_id
    WHERE ea1.user_id = user_a
      AND ea2.user_id = user_b
      AND e.status = 'active'
      AND e.close_date >= CURRENT_DATE
      -- Check neither user has left the event
      AND NOT EXISTS (
        SELECT 1 FROM event_departures ed
        WHERE ed.event_id = e.id
          AND ed.user_id IN (user_a, user_b)
      )
  );
$$;

-- Drop old policy
DROP POLICY IF EXISTS "Authenticated users can view profiles in shared events" ON profiles;

-- Create new policy using the active event check
CREATE POLICY "Users can view profiles in active shared events"
ON profiles FOR SELECT TO authenticated
USING (
  (user_id = auth.uid()) 
  OR users_share_active_event(auth.uid(), user_id)
);

-- Fix 2: Create transactional unmatch function

-- Create SQL function to handle unmatch operations atomically
CREATE OR REPLACE FUNCTION public.unmatch_user_transaction(
  _unmatcher_id UUID,
  _unmatched_user_id UUID,
  _event_id UUID,
  _match_id UUID,
  _reason TEXT,
  _description TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is authorized (is one of the match participants)
  IF NOT EXISTS (
    SELECT 1 FROM matches
    WHERE id = _match_id
      AND (_unmatcher_id = user1_id OR _unmatcher_id = user2_id)
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Not a participant in this match';
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
  
  -- All operations succeed or fail together (transaction)
END;
$$;

-- Create SQL function to handle report operations atomically
CREATE OR REPLACE FUNCTION public.report_user_transaction(
  _reporter_id UUID,
  _reported_user_id UUID,
  _event_id UUID,
  _match_id UUID,
  _reason TEXT,
  _custom_reason TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is authorized (is one of the match participants)
  IF NOT EXISTS (
    SELECT 1 FROM matches
    WHERE id = _match_id
      AND (_reporter_id = user1_id OR _reporter_id = user2_id)
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Not a participant in this match';
  END IF;
  
  -- Insert report record (idempotent due to unique constraint if exists)
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