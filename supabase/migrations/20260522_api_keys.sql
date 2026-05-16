CREATE TABLE api_keys (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES profiles(id)      ON DELETE CASCADE,
  name          text NOT NULL,
  key_hash      text NOT NULL UNIQUE,
  key_prefix    text NOT NULL,
  last_used_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  revoked_at    timestamptz
);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash) WHERE revoked_at IS NULL;
CREATE INDEX idx_api_keys_org  ON api_keys(org_id)   WHERE revoked_at IS NULL;
