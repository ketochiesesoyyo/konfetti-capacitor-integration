-- Create intro_requests table
CREATE TABLE public.intro_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL,
  target_id UUID NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
  host_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraint: Only one request per requester/target/event combo
  UNIQUE(event_id, requester_id, target_id)
);

-- Enable RLS on intro_requests
ALTER TABLE public.intro_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for intro_requests
-- Requesters can see their own requests; hosts can see all requests for their events
CREATE POLICY "Users can view their own intro requests or hosts can view event requests"
ON public.intro_requests
FOR SELECT
USING (
  requester_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = intro_requests.event_id
    AND events.created_by = auth.uid()
  )
);

-- Guests can create requests
CREATE POLICY "Users can create intro requests"
ON public.intro_requests
FOR INSERT
WITH CHECK (
  requester_id = auth.uid() AND
  user_is_event_attendee(auth.uid(), event_id)
);

-- Only hosts can update status/host_note
CREATE POLICY "Event hosts can update intro requests"
ON public.intro_requests
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = intro_requests.event_id
    AND events.created_by = auth.uid()
  )
);

-- Requesters can delete pending requests only
CREATE POLICY "Users can delete their pending intro requests"
ON public.intro_requests
FOR DELETE
USING (
  requester_id = auth.uid() AND
  status = 'pending'
);

-- Add allow_intro_requests column to events table
ALTER TABLE public.events
ADD COLUMN allow_intro_requests BOOLEAN NOT NULL DEFAULT true;

-- Create function to check intro request eligibility
CREATE OR REPLACE FUNCTION public.check_intro_request_eligibility(
  _requester_id UUID,
  _target_id UUID,
  _event_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _event_allows_requests BOOLEAN;
  _has_right_swipe BOOLEAN;
  _swipe_is_old_enough BOOLEAN;
  _has_match BOOLEAN;
  _already_requested BOOLEAN;
  _request_count INTEGER;
BEGIN
  -- Check if event allows intro requests
  SELECT allow_intro_requests INTO _event_allows_requests
  FROM events
  WHERE id = _event_id;
  
  IF NOT _event_allows_requests THEN
    RETURN FALSE;
  END IF;
  
  -- Check if requester swiped right on target at least 24 hours ago
  SELECT 
    EXISTS(SELECT 1 FROM swipes WHERE user_id = _requester_id AND swiped_user_id = _target_id AND event_id = _event_id AND direction = 'right'),
    EXISTS(SELECT 1 FROM swipes WHERE user_id = _requester_id AND swiped_user_id = _target_id AND event_id = _event_id AND direction = 'right' AND created_at < now() - interval '24 hours')
  INTO _has_right_swipe, _swipe_is_old_enough;
  
  IF NOT _has_right_swipe OR NOT _swipe_is_old_enough THEN
    RETURN FALSE;
  END IF;
  
  -- Check if they already have a match
  SELECT EXISTS(
    SELECT 1 FROM matches
    WHERE event_id = _event_id
    AND ((user1_id = _requester_id AND user2_id = _target_id) OR (user1_id = _target_id AND user2_id = _requester_id))
  ) INTO _has_match;
  
  IF _has_match THEN
    RETURN FALSE;
  END IF;
  
  -- Check if already requested
  SELECT EXISTS(
    SELECT 1 FROM intro_requests
    WHERE requester_id = _requester_id
    AND target_id = _target_id
    AND event_id = _event_id
  ) INTO _already_requested;
  
  IF _already_requested THEN
    RETURN FALSE;
  END IF;
  
  -- Check if requester hasn't exceeded 1 request per event
  SELECT COUNT(*) INTO _request_count
  FROM intro_requests
  WHERE requester_id = _requester_id
  AND event_id = _event_id;
  
  IF _request_count >= 1 THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Create function to handle facilitated match creation
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

-- Add trigger to update updated_at on intro_requests
CREATE TRIGGER update_intro_requests_updated_at
BEFORE UPDATE ON public.intro_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for intro_requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.intro_requests;