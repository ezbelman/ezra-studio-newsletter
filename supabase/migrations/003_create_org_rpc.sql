-- Creates an organization and assigns the calling user as owner.
-- SECURITY DEFINER lets it bypass RLS on both tables without needing the service role key.
-- auth.uid() still reflects the authenticated user, so the membership is always self-assigned.
CREATE OR REPLACE FUNCTION public.create_organization_for_user(
  p_name TEXT,
  p_slug TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_org_id  UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  INSERT INTO public.organizations (name, slug)
  VALUES (p_name, p_slug)
  RETURNING id INTO v_org_id;

  INSERT INTO public.org_members (org_id, user_id, role)
  VALUES (v_org_id, v_user_id, 'owner');

  RETURN v_org_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_organization_for_user(TEXT, TEXT) TO authenticated;
