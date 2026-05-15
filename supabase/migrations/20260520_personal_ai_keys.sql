-- Personal AI keys on profiles (owner-level, independent from org keys)
-- Stored AES-256-GCM encrypted, same format as org AI keys.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS personal_ai_provider       text    NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS personal_anthropic_api_key text,
  ADD COLUMN IF NOT EXISTS personal_openai_api_key    text,
  ADD COLUMN IF NOT EXISTS personal_gemini_api_key    text;

-- Users can read/update their own profile fields (RLS already allows this on profiles)
-- No new policy needed — profiles RLS covers self-update.
