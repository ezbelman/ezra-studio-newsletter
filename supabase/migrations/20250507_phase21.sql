-- ============================================================
-- Newsletter Studio — Phase 2.1: Analytics, A/B Testing, Version History
-- Migration: 20250507_phase21
-- ============================================================

-- ── A/B subject line testing columns on issues ────────────────
ALTER TABLE issues
  ADD COLUMN IF NOT EXISTS ab_subject_b TEXT,
  ADD COLUMN IF NOT EXISTS ab_winner    TEXT,
  ADD COLUMN IF NOT EXISTS ab_status    TEXT NOT NULL DEFAULT 'none'
    CHECK (ab_status IN ('none', 'running', 'complete'));

-- ── A/B variant tracking on email_sends ──────────────────────
ALTER TABLE email_sends
  ADD COLUMN IF NOT EXISTS ab_variant TEXT
    CHECK (ab_variant IN ('a', 'b'));

-- ── Issue version history ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS issue_versions (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id       UUID        NOT NULL REFERENCES issues(id)        ON DELETE CASCADE,
  org_id         UUID        NOT NULL REFERENCES organizations(id)  ON DELETE CASCADE,
  version_number INTEGER     NOT NULL DEFAULT 1,
  title          TEXT,
  raw_notes      JSONB,
  polished_json  JSONB,
  created_by     UUID        REFERENCES profiles(id)               ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE issue_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_read_versions"
  ON issue_versions FOR SELECT
  USING (is_org_member(org_id));

CREATE POLICY "editors_create_versions"
  ON issue_versions FOR INSERT
  WITH CHECK (org_role(org_id) IN ('owner', 'admin', 'editor'));

-- ── Indexes ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_issue_versions_issue ON issue_versions(issue_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_issue_versions_org   ON issue_versions(org_id);
CREATE INDEX IF NOT EXISTS idx_email_sends_sent_at  ON email_sends(org_id, sent_at DESC);
