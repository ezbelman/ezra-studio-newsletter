-- ============================================================
-- Newsletter Studio — New feature tables
-- Migration: 20260506000001_new_features
-- ============================================================

-- ── Segments ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS segments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  newsletter_id UUID REFERENCES newsletters(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  type          TEXT NOT NULL CHECK (type IN ('static', 'dynamic')),
  rules         JSONB,
  created_by    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_can_read_segments"
  ON segments FOR SELECT
  USING (is_org_member(org_id));

CREATE POLICY "editors_can_manage_segments"
  ON segments FOR ALL
  USING (org_role(org_id) IN ('owner','admin','editor'));

-- ── Templates ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS templates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID REFERENCES organizations(id) ON DELETE CASCADE,  -- NULL = platform template
  name          TEXT NOT NULL,
  description   TEXT,
  structure     JSONB NOT NULL DEFAULT '{}',
  is_platform   BOOLEAN NOT NULL DEFAULT false,
  created_by    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_can_read_platform_templates"
  ON templates FOR SELECT
  USING (is_platform = true OR is_org_member(org_id));

CREATE POLICY "editors_can_manage_org_templates"
  ON templates FOR ALL
  USING (org_id IS NOT NULL AND org_role(org_id) IN ('owner','admin','editor'));

-- ── Automations ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS automations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  newsletter_id   UUID REFERENCES newsletters(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'paused' CHECK (status IN ('active','paused','archived')),
  trigger_type    TEXT NOT NULL CHECK (trigger_type IN ('new_subscriber','tag_added','no_open','date')),
  trigger_config  JSONB NOT NULL DEFAULT '{}',
  steps           JSONB NOT NULL DEFAULT '[]',
  created_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS automation_enrollments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id  UUID NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
  subscriber_id  UUID NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  current_step   INTEGER NOT NULL DEFAULT 0,
  status         TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','completed','exited')),
  enrolled_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at   TIMESTAMPTZ,
  UNIQUE (automation_id, subscriber_id)
);

ALTER TABLE automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_read_automations"
  ON automations FOR SELECT USING (is_org_member(org_id));

CREATE POLICY "admins_manage_automations"
  ON automations FOR ALL
  USING (org_role(org_id) IN ('owner','admin'));

CREATE POLICY "org_members_read_enrollments"
  ON automation_enrollments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM automations a
      WHERE a.id = automation_id AND is_org_member(a.org_id)
    )
  );

-- ── Connections (multi-channel) ───────────────────────────────
CREATE TABLE IF NOT EXISTS connections (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  channel        TEXT NOT NULL CHECK (channel IN ('email','whatsapp','telegram','instagram','linkedin','twitter','slack')),
  status         TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('active','disconnected','error')),
  credentials    JSONB NOT NULL DEFAULT '{}',  -- AES-256 encrypted blob
  config         JSONB DEFAULT '{}',           -- non-secret config
  connected_by   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  connected_at   TIMESTAMPTZ,
  last_used_at   TIMESTAMPTZ,
  UNIQUE (org_id, channel)
);

ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_read_connections"
  ON connections FOR SELECT USING (is_org_member(org_id));

CREATE POLICY "admins_manage_connections"
  ON connections FOR ALL
  USING (org_role(org_id) IN ('owner','admin'));

-- ── Channel sends ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS channel_sends (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id      UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  org_id        UUID NOT NULL REFERENCES organizations(id),
  channel       TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed')),
  sent_at       TIMESTAMPTZ,
  reach         INTEGER,
  external_id   TEXT,
  error_message TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE channel_sends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_read_channel_sends"
  ON channel_sends FOR SELECT USING (is_org_member(org_id));

-- ── Forms ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS forms (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  newsletter_id   UUID NOT NULL REFERENCES newsletters(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  fields          JSONB NOT NULL DEFAULT '[]',
  success_message TEXT,
  redirect_url    TEXT,
  views           INTEGER NOT NULL DEFAULT 0,
  submissions     INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_read_forms"
  ON forms FOR SELECT USING (is_org_member(org_id));

CREATE POLICY "editors_manage_forms"
  ON forms FOR ALL
  USING (org_role(org_id) IN ('owner','admin','editor'));

-- ── API keys ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS api_keys (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  key_hash     TEXT NOT NULL UNIQUE,   -- bcrypt of actual key
  key_prefix   TEXT NOT NULL,          -- first 8 chars for display
  created_by   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  last_used_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at   TIMESTAMPTZ
);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_manage_api_keys"
  ON api_keys FOR ALL
  USING (org_role(org_id) IN ('owner','admin'));

-- ── Webhooks ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS webhooks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  url          TEXT NOT NULL,
  events       TEXT[] NOT NULL DEFAULT '{}',
  secret_hash  TEXT NOT NULL,          -- HMAC key stored encrypted
  status       TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','disabled')),
  created_by   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id    UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  event         TEXT NOT NULL,
  payload       JSONB NOT NULL DEFAULT '{}',
  response_code INTEGER,
  response_body TEXT,
  latency_ms    INTEGER,
  attempt       INTEGER NOT NULL DEFAULT 1,
  delivered_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_manage_webhooks"
  ON webhooks FOR ALL
  USING (org_role(org_id) IN ('owner','admin'));

CREATE POLICY "admins_read_webhook_deliveries"
  ON webhook_deliveries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM webhooks w
      WHERE w.id = webhook_id AND org_role(w.org_id) IN ('owner','admin')
    )
  );

-- ── Subscriber tags ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriber_tags (
  subscriber_id UUID NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  tag           TEXT NOT NULL,
  added_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (subscriber_id, tag)
);

ALTER TABLE subscriber_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_read_subscriber_tags"
  ON subscriber_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM subscribers s
      WHERE s.id = subscriber_id AND is_org_member(s.org_id)
    )
  );

CREATE POLICY "editors_manage_subscriber_tags"
  ON subscriber_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM subscribers s
      WHERE s.id = subscriber_id AND org_role(s.org_id) IN ('owner','admin','editor')
    )
  );

-- ── Helper: increment email send metrics ─────────────────────
CREATE OR REPLACE FUNCTION increment_send_metric(
  p_resend_id TEXT,
  p_field     TEXT
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF p_field NOT IN ('delivered_count','opened_count','clicked_count') THEN
    RAISE EXCEPTION 'Invalid metric field: %', p_field;
  END IF;
  EXECUTE format(
    'UPDATE email_sends SET %I = COALESCE(%I, 0) + 1 WHERE resend_batch_id = $1',
    p_field, p_field
  ) USING p_resend_id;
END;
$$;

-- ── Indexes for performance ───────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_segments_org         ON segments(org_id);
CREATE INDEX IF NOT EXISTS idx_automations_org       ON automations(org_id);
CREATE INDEX IF NOT EXISTS idx_connections_org       ON connections(org_id);
CREATE INDEX IF NOT EXISTS idx_forms_org             ON forms(org_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_org          ON api_keys(org_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_org          ON webhooks(org_id);
CREATE INDEX IF NOT EXISTS idx_subscriber_tags_sub   ON subscriber_tags(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_email     ON subscribers(email);
CREATE INDEX IF NOT EXISTS idx_subscribers_status    ON subscribers(org_id, status);
CREATE INDEX IF NOT EXISTS idx_issues_scheduled      ON issues(org_id, scheduled_at) WHERE status = 'scheduled';
