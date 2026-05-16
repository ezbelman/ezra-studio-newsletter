-- Phase 7: Engagement Tracking & Referral Program

-- ─── Extend subscribers ───────────────────────────────────────────────────────
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS engagement_score  decimal(5,2) NOT NULL DEFAULT 0;
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS last_opened_at    timestamptz;
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS last_clicked_at   timestamptz;
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS total_opens       integer      NOT NULL DEFAULT 0;
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS total_clicks      integer      NOT NULL DEFAULT 0;
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS referral_code     text         UNIQUE;
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS referred_by_code  text;

-- Backfill referral codes for existing subscribers
UPDATE subscribers
SET referral_code = upper(substring(encode(gen_random_bytes(4), 'hex'), 1, 8))
WHERE referral_code IS NULL;

-- DB default for future inserts
CREATE OR REPLACE FUNCTION gen_referral_code() RETURNS text LANGUAGE sql AS $$
  SELECT upper(substring(encode(gen_random_bytes(4), 'hex'), 1, 8))
$$;
ALTER TABLE subscribers ALTER COLUMN referral_code SET DEFAULT gen_referral_code();

CREATE INDEX IF NOT EXISTS idx_subscribers_referral_code ON subscribers(referral_code)    WHERE referral_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subscribers_referred_by   ON subscribers(referred_by_code) WHERE referred_by_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subscribers_last_opened   ON subscribers(last_opened_at)   WHERE last_opened_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subscribers_engagement    ON subscribers(engagement_score);

-- ─── Subscriber events ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriber_events (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid        NOT NULL REFERENCES organizations(id)  ON DELETE CASCADE,
  newsletter_id uuid        NOT NULL REFERENCES newsletters(id)    ON DELETE CASCADE,
  subscriber_id uuid        NOT NULL REFERENCES subscribers(id)    ON DELETE CASCADE,
  issue_id      uuid        NOT NULL REFERENCES issues(id)         ON DELETE CASCADE,
  event_type    text        NOT NULL CHECK (event_type IN ('opened', 'clicked')),
  link_url      text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sub_events_subscriber ON subscriber_events(subscriber_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sub_events_issue      ON subscriber_events(issue_id, event_type);
CREATE INDEX IF NOT EXISTS idx_sub_events_org        ON subscriber_events(org_id, created_at DESC);

-- Prevents race-condition double-opens: only one 'opened' row per subscriber per issue
CREATE UNIQUE INDEX IF NOT EXISTS idx_sub_events_unique_open
  ON subscriber_events(subscriber_id, issue_id)
  WHERE event_type = 'opened';

-- ─── Atomic recording functions ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION record_subscriber_open(
  p_subscriber_id uuid,
  p_issue_id      uuid,
  p_org_id        uuid,
  p_newsletter_id uuid
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  rows_inserted integer;
BEGIN
  -- INSERT ... ON CONFLICT DO NOTHING exploits the unique partial index,
  -- making the dedup atomic without a separate EXISTS round-trip.
  INSERT INTO subscriber_events (org_id, newsletter_id, subscriber_id, issue_id, event_type)
  VALUES (p_org_id, p_newsletter_id, p_subscriber_id, p_issue_id, 'opened')
  ON CONFLICT (subscriber_id, issue_id) WHERE event_type = 'opened' DO NOTHING;

  GET DIAGNOSTICS rows_inserted = ROW_COUNT;
  IF rows_inserted = 0 THEN RETURN false; END IF;

  UPDATE subscribers SET
    total_opens      = total_opens + 1,
    last_opened_at   = now(),
    engagement_score = LEAST(100, (total_opens + 1) * 3 + total_clicks * 7)
  WHERE id = p_subscriber_id;

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION record_subscriber_click(
  p_subscriber_id uuid,
  p_issue_id      uuid,
  p_org_id        uuid,
  p_newsletter_id uuid,
  p_link_url      text DEFAULT NULL
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO subscriber_events (org_id, newsletter_id, subscriber_id, issue_id, event_type, link_url)
  VALUES (p_org_id, p_newsletter_id, p_subscriber_id, p_issue_id, 'clicked', p_link_url);

  UPDATE subscribers SET
    total_clicks     = total_clicks + 1,
    last_clicked_at  = now(),
    engagement_score = LEAST(100, total_opens * 3 + (total_clicks + 1) * 7)
  WHERE id = p_subscriber_id;

  RETURN true;
END;
$$;
