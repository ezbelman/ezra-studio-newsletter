-- ============================================================
-- Newsletter Studio — Phase 2.2: Segments, Templates, Automations
-- Migration: 20250507_phase22 (idempotent — safe to re-run)
-- ============================================================

-- ── Segments ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS segments (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  newsletter_id UUID        REFERENCES newsletters(id) ON DELETE SET NULL,
  name          TEXT        NOT NULL,
  description   TEXT,
  rules         JSONB       NOT NULL DEFAULT '[]',
  created_by    UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE segments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_members_read_segments" ON segments;
CREATE POLICY "org_members_read_segments"
  ON segments FOR SELECT USING (is_org_member(org_id));

DROP POLICY IF EXISTS "editors_manage_segments" ON segments;
CREATE POLICY "editors_manage_segments"
  ON segments FOR ALL USING (org_role(org_id) IN ('owner', 'admin', 'editor'))
  WITH CHECK (org_role(org_id) IN ('owner', 'admin', 'editor'));

-- ── Templates ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS templates (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID        REFERENCES organizations(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  description TEXT,
  structure   JSONB       NOT NULL DEFAULT '{}',
  is_platform BOOLEAN     NOT NULL DEFAULT false,
  created_by  UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "everyone_reads_platform_templates" ON templates;
CREATE POLICY "everyone_reads_platform_templates"
  ON templates FOR SELECT USING (is_platform = true);

DROP POLICY IF EXISTS "org_members_read_own_templates" ON templates;
CREATE POLICY "org_members_read_own_templates"
  ON templates FOR SELECT USING (org_id IS NOT NULL AND is_org_member(org_id));

DROP POLICY IF EXISTS "editors_create_templates" ON templates;
CREATE POLICY "editors_create_templates"
  ON templates FOR INSERT
  WITH CHECK (org_id IS NOT NULL AND org_role(org_id) IN ('owner', 'admin', 'editor'));

DROP POLICY IF EXISTS "editors_delete_templates" ON templates;
CREATE POLICY "editors_delete_templates"
  ON templates FOR DELETE
  USING (org_id IS NOT NULL AND org_role(org_id) IN ('owner', 'admin', 'editor'));

-- Seed platform templates (skip if already present)
INSERT INTO templates (name, description, structure, is_platform)
SELECT name, description, structure::jsonb, true FROM (VALUES
  (
    'Weekly Digest',
    'A roundup of key stories with bullets and a hot take',
    '{"title":"[Newsletter] Week in Review","stories":[{"headline":"Headline 1","bullets":["Key point A","Key point B","Key point C"],"takeaway":"Why this matters for your audience"},{"headline":"Headline 2","bullets":["Key point A","Key point B"],"takeaway":"The big picture"}],"prompts":["What do you think about this trend?","Have you tried this yet?"],"hot_take":"Your bold contrarian take here."}'
  ),
  (
    'Product Update',
    'Announce new features or improvements',
    '{"title":"What''s New in [Product]","stories":[{"headline":"New Feature","bullets":["What it does","How to access it","Who benefits most"],"takeaway":"Why we built this and what comes next"}],"prompts":["Try it and let us know what you think."],"hot_take":""}'
  ),
  (
    'Industry Roundup',
    'Curate the most important news from your niche',
    '{"title":"[Industry] Roundup","stories":[{"headline":"Story 1","bullets":["What happened","Who is involved","What changes"],"takeaway":"The strategic implication"},{"headline":"Story 2","bullets":["The key development","Numbers that matter"],"takeaway":"What to watch for"}],"prompts":["What story are you following closely?"],"hot_take":"The trend everyone is talking about but nobody is acting on yet."}'
  ),
  (
    'Deep Dive',
    'A focused, long-form exploration of one topic',
    '{"title":"Deep Dive: [Topic]","stories":[{"headline":"The Problem","bullets":["Why this matters now","The common misconceptions","The real challenge"],"takeaway":""},{"headline":"The Evidence","bullets":["Data point 1","Data point 2","Expert opinion"],"takeaway":"What the data actually says"},{"headline":"The Solution","bullets":["Approach 1","Approach 2","What to do next"],"takeaway":"The actionable conclusion"}],"prompts":["Have you experienced this problem?","What approach do you use?"],"hot_take":""}'
  ),
  (
    'Minimal',
    'Clean, text-forward — no noise',
    '{"title":"","stories":[{"headline":"","bullets":["","",""],"takeaway":""}],"prompts":[],"hot_take":""}'
  )
) AS t(name, description, structure)
WHERE NOT EXISTS (
  SELECT 1 FROM templates WHERE is_platform = true AND templates.name = t.name
);

-- ── Automations ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS automations (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  newsletter_id   UUID        NOT NULL REFERENCES newsletters(id) ON DELETE CASCADE,
  name            TEXT        NOT NULL,
  status          TEXT        NOT NULL DEFAULT 'paused'
    CHECK (status IN ('active', 'paused', 'archived')),
  trigger_type    TEXT        NOT NULL DEFAULT 'new_subscriber'
    CHECK (trigger_type IN ('new_subscriber', 'tag_added', 'no_open', 'date')),
  trigger_config  JSONB       NOT NULL DEFAULT '{}',
  steps           JSONB       NOT NULL DEFAULT '[]',
  enrolled_count  INTEGER     NOT NULL DEFAULT 0,
  completed_count INTEGER     NOT NULL DEFAULT 0,
  created_by      UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE automations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_members_read_automations" ON automations;
CREATE POLICY "org_members_read_automations"
  ON automations FOR SELECT USING (is_org_member(org_id));

DROP POLICY IF EXISTS "admins_manage_automations" ON automations;
CREATE POLICY "admins_manage_automations"
  ON automations FOR ALL USING (org_role(org_id) IN ('owner', 'admin'))
  WITH CHECK (org_role(org_id) IN ('owner', 'admin'));

CREATE TABLE IF NOT EXISTS automation_enrollments (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID        NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
  subscriber_id UUID        NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  current_step  INTEGER     NOT NULL DEFAULT 0,
  status        TEXT        NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'completed', 'exited')),
  next_step_at  TIMESTAMPTZ,
  enrolled_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at  TIMESTAMPTZ,
  UNIQUE (automation_id, subscriber_id)
);

ALTER TABLE automation_enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_members_read_enrollments" ON automation_enrollments;
CREATE POLICY "org_members_read_enrollments"
  ON automation_enrollments FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM automations a
      WHERE a.id = automation_id AND is_org_member(a.org_id)
    )
  );

-- ── Indexes ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_segments_org         ON segments(org_id);
CREATE INDEX IF NOT EXISTS idx_templates_platform   ON templates(is_platform) WHERE is_platform = true;
CREATE INDEX IF NOT EXISTS idx_templates_org        ON templates(org_id) WHERE org_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_automations_nl       ON automations(newsletter_id, status);
CREATE INDEX IF NOT EXISTS idx_enrollments_due      ON automation_enrollments(next_step_at) WHERE status = 'in_progress';
CREATE INDEX IF NOT EXISTS idx_enrollments_auto     ON automation_enrollments(automation_id, status);
