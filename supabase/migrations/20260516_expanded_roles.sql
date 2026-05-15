-- Expand org_members role to support reviewer and contributor roles.
-- Supabase uses text columns with application-level enforcement for roles,
-- so we just update the check constraint if one exists.

-- Drop existing check constraint if present (may vary by DB)
DO $$
BEGIN
  ALTER TABLE org_members DROP CONSTRAINT IF EXISTS org_members_role_check;
EXCEPTION WHEN others THEN NULL;
END $$;

-- No enum change needed — role is a text column. The constraint is app-enforced.
-- Update the comment to document allowed values.
COMMENT ON COLUMN org_members.role IS
  'Allowed values: owner, admin, editor, reviewer, contributor, viewer';
