-- Add tags array to subscribers
ALTER TABLE subscribers
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';

-- Index for tag-based segment filtering
CREATE INDEX IF NOT EXISTS idx_subscribers_tags ON subscribers USING GIN (tags);
