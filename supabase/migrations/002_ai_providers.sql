-- ============================================================
-- Migration 002 — Multi-provider AI + persistent rate limits
-- Run in Supabase SQL editor
-- ============================================================

-- ── AI provider columns on organizations ────────────────────
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS ai_provider   TEXT NOT NULL DEFAULT 'platform',
  -- 'platform' | 'own_anthropic' | 'own_openai' | 'own_gemini'
  ADD COLUMN IF NOT EXISTS openai_api_key  TEXT,
  ADD COLUMN IF NOT EXISTS gemini_api_key  TEXT;

-- ── Org invitations ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.org_invitations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'editor',
  token       TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by  UUID REFERENCES auth.users(id),
  accepted_at TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, email)
);

ALTER TABLE public.org_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invitations_select" ON public.org_invitations
  FOR SELECT USING (public.org_role(org_id) IN ('owner','admin'));

CREATE POLICY "invitations_insert" ON public.org_invitations
  FOR INSERT WITH CHECK (public.org_role(org_id) IN ('owner','admin'));

CREATE POLICY "invitations_delete" ON public.org_invitations
  FOR DELETE USING (public.org_role(org_id) IN ('owner','admin'));

-- ── Persistent rate limits (serverless-safe) ────────────────
CREATE TABLE IF NOT EXISTS public.rate_limits (
  key       TEXT PRIMARY KEY,
  count     INTEGER NOT NULL DEFAULT 1,
  reset_at  TIMESTAMPTZ NOT NULL
);

-- Rate limits only touched by server-side admin client
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
-- No user-level policies: service role only via admin client

-- Atomic check-and-increment function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key            TEXT,
  p_max_requests   INT,
  p_window_seconds INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now      TIMESTAMPTZ := NOW();
  v_reset_at TIMESTAMPTZ;
  v_count    INT;
BEGIN
  INSERT INTO public.rate_limits (key, count, reset_at)
  VALUES (p_key, 1, v_now + (p_window_seconds || ' seconds')::INTERVAL)
  ON CONFLICT (key) DO UPDATE
    SET
      count    = CASE
                   WHEN rate_limits.reset_at <= v_now THEN 1
                   ELSE rate_limits.count + 1
                 END,
      reset_at = CASE
                   WHEN rate_limits.reset_at <= v_now
                     THEN v_now + (p_window_seconds || ' seconds')::INTERVAL
                   ELSE rate_limits.reset_at
                 END
  RETURNING count, reset_at INTO v_count, v_reset_at;

  IF v_count > p_max_requests THEN
    RETURN jsonb_build_object(
      'allowed',     false,
      'count',       v_count,
      'retry_after', GREATEST(0, EXTRACT(EPOCH FROM (v_reset_at - v_now))::INT)
    );
  END IF;

  RETURN jsonb_build_object('allowed', true, 'count', v_count);
END;
$$;

-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_rate_limits_reset ON public.rate_limits(reset_at);
