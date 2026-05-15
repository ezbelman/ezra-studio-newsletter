-- Add custom sending domain per newsletter
-- Used as the @domain for the from address when Resend has verified it
ALTER TABLE newsletters
  ADD COLUMN IF NOT EXISTS custom_sending_domain text;
