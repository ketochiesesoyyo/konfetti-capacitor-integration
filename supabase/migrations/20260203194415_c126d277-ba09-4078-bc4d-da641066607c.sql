-- RLS Policies for blocked_users (skip if exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own blocks' AND tablename = 'blocked_users') THEN
    EXECUTE 'CREATE POLICY "Users can view their own blocks" ON public.blocked_users FOR SELECT USING (auth.uid() = blocker_id)';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can create blocks' AND tablename = 'blocked_users') THEN
    EXECUTE 'CREATE POLICY "Users can create blocks" ON public.blocked_users FOR INSERT WITH CHECK (auth.uid() = blocker_id)';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own blocks' AND tablename = 'blocked_users') THEN
    EXECUTE 'CREATE POLICY "Users can delete their own blocks" ON public.blocked_users FOR DELETE USING (auth.uid() = blocker_id)';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all blocks' AND tablename = 'blocked_users') THEN
    EXECUTE 'CREATE POLICY "Admins can view all blocks" ON public.blocked_users FOR SELECT USING (has_role(auth.uid(), ''admin''::app_role))';
  END IF;
END $$;

-- Create the block_user_transaction function
CREATE OR REPLACE FUNCTION public.block_user_transaction(
  _blocker_id UUID,
  _blocked_id UUID,
  _event_id UUID,
  _match_id UUID,
  _reason TEXT
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate UUID format for all UUID parameters
  IF _blocker_id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RAISE EXCEPTION 'Invalid UUID format for blocker_id';
  END IF;
  
  IF _blocked_id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RAISE EXCEPTION 'Invalid UUID format for blocked_id';
  END IF;
  
  -- Sanitize text input
  _reason := trim(_reason);
  
  -- Validate reason length if provided
  IF _reason IS NOT NULL AND char_length(_reason) > 500 THEN
    RAISE EXCEPTION 'Reason too long';
  END IF;
  
  -- Verify the caller is the blocker
  IF auth.uid() != _blocker_id THEN
    RAISE EXCEPTION 'Unauthorized: Can only block as yourself';
  END IF;

  -- Insert block record (idempotent due to unique constraint)
  INSERT INTO blocked_users (blocker_id, blocked_id, event_id, reason)
  VALUES (_blocker_id, _blocked_id, _event_id, _reason)
  ON CONFLICT (blocker_id, blocked_id) DO NOTHING;
  
  -- Create report for admin visibility (notifies developer of the block)
  INSERT INTO reports (reporter_id, reported_user_id, event_id, match_id, reason)
  VALUES (
    _blocker_id, 
    _blocked_id, 
    _event_id, 
    COALESCE(_match_id, gen_random_uuid()), 
    'User blocked: ' || COALESCE(_reason, 'No reason provided')
  );
  
  -- Log to audit
  INSERT INTO audit_logs (action_type, actor_id, target_id, event_id, match_id, reason)
  VALUES ('block', _blocker_id, _blocked_id, _event_id, _match_id, COALESCE(_reason, 'No reason provided'));
  
  -- Delete messages if match exists
  IF _match_id IS NOT NULL THEN
    DELETE FROM messages WHERE match_id = _match_id;
  END IF;
  
  -- Delete swipes between users (bidirectional)
  DELETE FROM swipes 
  WHERE (user_id = _blocker_id AND swiped_user_id = _blocked_id)
     OR (user_id = _blocked_id AND swiped_user_id = _blocker_id);
  
  -- Delete match if exists
  IF _match_id IS NOT NULL THEN
    DELETE FROM matches WHERE id = _match_id;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.block_user_transaction(UUID, UUID, UUID, UUID, TEXT) TO authenticated;