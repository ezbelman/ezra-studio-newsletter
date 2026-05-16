CREATE TABLE webhooks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  url         text NOT NULL,
  events      text[] NOT NULL DEFAULT '{}',
  secret      text NOT NULL,
  enabled     boolean NOT NULL DEFAULT true,
  created_by  uuid REFERENCES profiles(id),
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_webhooks_org ON webhooks(org_id) WHERE enabled = true;
