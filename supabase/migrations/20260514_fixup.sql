-- ============================================================
-- Newsletter Studio — Schema Fixup
-- Migration: 20260514_fixup
-- Fixes schema gaps caused by CREATE TABLE IF NOT EXISTS no-ops
-- when new_features ran on a DB that already had phase22 tables,
-- and removes stale RLS policies created by new_features.sql.
-- Safe to re-run (all statements are idempotent).
-- ============================================================

-- ── automation_enrollments: add next_step_at if missing ──────
ALTER TABLE automation_enrollments
  ADD COLUMN IF NOT EXISTS next_step_at TIMESTAMPTZ;

-- ── automations: add counters if missing ─────────────────────
ALTER TABLE automations
  ADD COLUMN IF NOT EXISTS enrolled_count  INTEGER NOT NULL DEFAULT 0;
ALTER TABLE automations
  ADD COLUMN IF NOT EXISTS completed_count INTEGER NOT NULL DEFAULT 0;

-- ── segments: add description if missing ─────────────────────
ALTER TABLE segments
  ADD COLUMN IF NOT EXISTS description TEXT;

-- ── segments: drop stale policies from new_features.sql ──────
DROP POLICY IF EXISTS "org_members_can_read_segments" ON segments;
DROP POLICY IF EXISTS "editors_can_manage_segments"   ON segments;

-- ── templates: drop stale policies from new_features.sql ─────
DROP POLICY IF EXISTS "anyone_can_read_platform_templates" ON templates;
DROP POLICY IF EXISTS "editors_can_manage_org_templates"   ON templates;

-- ── Ensure correct policies exist (idempotent via DO block) ──
DO $$
BEGIN
  -- segments read
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'segments' AND policyname = 'org_members_read_segments'
  ) THEN
    CREATE POLICY "org_members_read_segments"
      ON segments FOR SELECT USING (is_org_member(org_id));
  END IF;

  -- segments manage
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'segments' AND policyname = 'editors_manage_segments'
  ) THEN
    CREATE POLICY "editors_manage_segments"
      ON segments FOR ALL
      USING (org_role(org_id) IN ('owner', 'admin', 'editor'))
      WITH CHECK (org_role(org_id) IN ('owner', 'admin', 'editor'));
  END IF;

  -- templates: platform read
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'templates' AND policyname = 'everyone_reads_platform_templates'
  ) THEN
    CREATE POLICY "everyone_reads_platform_templates"
      ON templates FOR SELECT USING (is_platform = true);
  END IF;

  -- templates: org read
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'templates' AND policyname = 'org_members_read_own_templates'
  ) THEN
    CREATE POLICY "org_members_read_own_templates"
      ON templates FOR SELECT USING (org_id IS NOT NULL AND is_org_member(org_id));
  END IF;

  -- templates: create
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'templates' AND policyname = 'editors_create_templates'
  ) THEN
    CREATE POLICY "editors_create_templates"
      ON templates FOR INSERT
      WITH CHECK (org_id IS NOT NULL AND org_role(org_id) IN ('owner', 'admin', 'editor'));
  END IF;

  -- templates: delete
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'templates' AND policyname = 'editors_delete_templates'
  ) THEN
    CREATE POLICY "editors_delete_templates"
      ON templates FOR DELETE
      USING (org_id IS NOT NULL AND org_role(org_id) IN ('owner', 'admin', 'editor'));
  END IF;
END
$$;

-- ── Index for cron query ──────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_enrollments_due
  ON automation_enrollments(next_step_at)
  WHERE status = 'in_progress';
