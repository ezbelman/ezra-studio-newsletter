-- Platform Settings — key/value store for platform-level configuration
-- Only platform admins can read or write. Env vars always take precedence at runtime.

CREATE TABLE IF NOT EXISTS platform_settings (
  key        TEXT        PRIMARY KEY,
  value      TEXT        NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID        REFERENCES profiles(id) ON DELETE SET NULL
);

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "platform_admins_manage_settings" ON platform_settings;
CREATE POLICY "platform_admins_manage_settings"
  ON platform_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_platform_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_platform_admin = true
    )
  );
