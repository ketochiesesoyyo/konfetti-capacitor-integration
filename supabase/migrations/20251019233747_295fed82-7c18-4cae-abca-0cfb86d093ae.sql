-- Create unmatches table to track unmatch actions and prevent re-matching
CREATE TABLE IF NOT EXISTS public.unmatches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unmatcher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unmatched_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  match_id UUID REFERENCES public.matches(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_unmatch_per_event UNIQUE(unmatcher_id, unmatched_user_id, event_id)
);

-- Create audit_logs table for moderation
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL CHECK (action_type IN ('report', 'unmatch', 'block')),
  actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  match_id UUID REFERENCES public.matches(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on unmatches table
ALTER TABLE public.unmatches ENABLE ROW LEVEL SECURITY;

-- Users can create their own unmatches
CREATE POLICY "Users can create unmatches"
  ON public.unmatches
  FOR INSERT
  WITH CHECK (auth.uid() = unmatcher_id);

-- Users can view their own unmatches
CREATE POLICY "Users can view their own unmatches"
  ON public.unmatches
  FOR SELECT
  USING (auth.uid() = unmatcher_id);

-- Event hosts can view unmatches in their events
CREATE POLICY "Event hosts can view event unmatches"
  ON public.unmatches
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = unmatches.event_id
        AND events.created_by = auth.uid()
    )
  );

-- Enable RLS on audit_logs table
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own audit logs
CREATE POLICY "Users can view their own audit logs"
  ON public.audit_logs
  FOR SELECT
  USING (auth.uid() = actor_id OR auth.uid() = target_id);

-- Event hosts can view audit logs for their events
CREATE POLICY "Event hosts can view event audit logs"
  ON public.audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = audit_logs.event_id
        AND events.created_by = auth.uid()
    )
  );

-- System can insert audit logs (via authenticated users)
CREATE POLICY "Authenticated users can create audit logs"
  ON public.audit_logs
  FOR INSERT
  WITH CHECK (auth.uid() = actor_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_unmatches_unmatcher ON public.unmatches(unmatcher_id);
CREATE INDEX IF NOT EXISTS idx_unmatches_event ON public.unmatches(event_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event ON public.audit_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);