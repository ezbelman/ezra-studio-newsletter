-- Enable pg_trgm extension for trigram-based ILIKE acceleration
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Issues: search by title
CREATE INDEX IF NOT EXISTS idx_issues_title_trgm
  ON issues USING GIN (title gin_trgm_ops);

-- Subscribers: search by email and name
CREATE INDEX IF NOT EXISTS idx_subscribers_email_trgm
  ON subscribers USING GIN (email gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_subscribers_name_trgm
  ON subscribers USING GIN (name gin_trgm_ops);

-- Newsletters: search by name
CREATE INDEX IF NOT EXISTS idx_newsletters_name_trgm
  ON newsletters USING GIN (name gin_trgm_ops);
