-- ============================================================
-- Create EBELMAN platform owner account
-- Run this in: Supabase → SQL Editor → New query → Run
-- ============================================================
--
-- Credentials created:
--   Email:    ebelman@admin.com
--   Password: EBELMAN7
--   Role:     Platform admin (full access)
--
-- After running, log in at your app's /login page with these credentials.
-- ============================================================

DO $$
DECLARE
  v_user_id UUID := gen_random_uuid();
  v_existing_id UUID;
BEGIN

  -- Check if user already exists
  SELECT id INTO v_existing_id
  FROM auth.users
  WHERE email = 'ebelman@admin.com';

  IF v_existing_id IS NOT NULL THEN
    RAISE NOTICE 'User ebelman@admin.com already exists (id: %). Updating profile to platform admin.', v_existing_id;

    -- Make sure profile has admin flag
    INSERT INTO public.profiles (id, full_name, is_platform_admin)
    VALUES (v_existing_id, 'EBELMAN', true)
    ON CONFLICT (id) DO UPDATE SET
      full_name         = 'EBELMAN',
      is_platform_admin = true;

    RETURN;
  END IF;

  -- Create the auth user
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    raw_app_meta_data,
    aud,
    role,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  ) VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    'ebelman@admin.com',
    crypt('EBELMAN7', gen_salt('bf')),
    now(),
    '{"full_name": "EBELMAN"}'::jsonb,
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  -- Create the auth identity (required for email login)
  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    v_user_id,
    'ebelman@admin.com',
    jsonb_build_object(
      'sub',   v_user_id::text,
      'email', 'ebelman@admin.com',
      'email_verified', true
    ),
    'email',
    now(),
    now(),
    now()
  );

  -- Create the profile with platform admin flag
  INSERT INTO public.profiles (id, full_name, is_platform_admin)
  VALUES (v_user_id, 'EBELMAN', true)
  ON CONFLICT (id) DO UPDATE SET
    full_name         = 'EBELMAN',
    is_platform_admin = true;

  RAISE NOTICE 'EBELMAN admin created successfully (id: %)', v_user_id;

END $$;
