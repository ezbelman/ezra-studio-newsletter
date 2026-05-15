-- Add email_template column to newsletters (default: 'dark')
ALTER TABLE newsletters
  ADD COLUMN IF NOT EXISTS email_template text NOT NULL DEFAULT 'dark';

-- Constraint: only allow known template IDs
ALTER TABLE newsletters
  DROP CONSTRAINT IF EXISTS newsletters_email_template_check;

ALTER TABLE newsletters
  ADD CONSTRAINT newsletters_email_template_check
  CHECK (email_template IN ('dark', 'light', 'minimal'));
