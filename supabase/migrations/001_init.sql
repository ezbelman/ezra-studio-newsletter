-- ============================================================
-- Ezra Studio Newsletter — Multi-Tenant Schema
-- Run this once in your NEW Supabase project SQL editor
-- ============================================================

-- ── User profiles (extends auth.users) ──────────────────────
CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  avatar_url  TEXT,
  is_platform_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Organizations (tenants) ──────────────────────────────────
CREATE TABLE public.organizations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  slug             TEXT NOT NULL UNIQUE,
  logo_url         TEXT,
  plan             TEXT NOT NULL DEFAULT 'trial',
  -- Branding
  primary_color    TEXT NOT NULL DEFAULT '#001A5C',
  accent_color     TEXT NOT NULL DEFAULT '#00B5E2',
  -- AI
  anthropic_api_key TEXT,
  default_language TEXT NOT NULL DEFAULT 'en',
  -- Meta
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── Organization Members ────────────────────────────────────
CREATE TABLE public.org_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'editor',
  -- role values: owner | admin | editor | viewer | reader
  invited_by  UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, user_id)
);

-- ── Newsletters (one org can have multiple newsletters) ──────
CREATE TABLE public.newsletters (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  slug        TEXT NOT NULL,
  template    TEXT NOT NULL DEFAULT 'ai-delivery',
  status      TEXT NOT NULL DEFAULT 'active',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, slug)
);

-- ── Issues (drafts + published volumes) ─────────────────────
CREATE TABLE public.issues (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  newsletter_id  UUID NOT NULL REFERENCES public.newsletters(id) ON DELETE CASCADE,
  org_id         UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  vol            TEXT NOT NULL,
  title          TEXT,
  status         TEXT NOT NULL DEFAULT 'draft',
  -- status: draft | pending_approval | approved | scheduled | published
  issue_date     DATE,
  raw_notes      JSONB,
  polished_json  JSONB,
  html_web       TEXT,
  html_email     TEXT,
  scheduled_at   TIMESTAMPTZ,
  published_at   TIMESTAMPTZ,
  created_by     UUID REFERENCES auth.users(id),
  approved_by    UUID REFERENCES auth.users(id),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── Subscribers ─────────────────────────────────────────────
CREATE TABLE public.subscribers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  newsletter_id   UUID NOT NULL REFERENCES public.newsletters(id) ON DELETE CASCADE,
  org_id          UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  name            TEXT,
  status          TEXT NOT NULL DEFAULT 'active',
  -- status: active | unsubscribed | bounced
  subscribed_at   TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  UNIQUE(newsletter_id, email)
);

-- ── Email Sends ─────────────────────────────────────────────
CREATE TABLE public.email_sends (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id         UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  org_id           UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  resend_batch_id  TEXT,
  sent_at          TIMESTAMPTZ DEFAULT NOW(),
  recipient_count  INTEGER DEFAULT 0,
  delivered_count  INTEGER DEFAULT 0,
  opened_count     INTEGER DEFAULT 0,
  clicked_count    INTEGER DEFAULT 0
);

-- ── Activity Logs (audit trail — replaces impersonation) ────
CREATE TABLE public.activity_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action        TEXT NOT NULL,
  resource_type TEXT,
  resource_id   UUID,
  metadata      JSONB,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_org_members_user   ON public.org_members(user_id);
CREATE INDEX idx_org_members_org    ON public.org_members(org_id);
CREATE INDEX idx_newsletters_org    ON public.newsletters(org_id);
CREATE INDEX idx_issues_newsletter  ON public.issues(newsletter_id);
CREATE INDEX idx_issues_status      ON public.issues(status);
CREATE INDEX idx_subscribers_nl     ON public.subscribers(newsletter_id);
CREATE INDEX idx_activity_org       ON public.activity_logs(org_id);
CREATE INDEX idx_activity_user      ON public.activity_logs(user_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_members     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletters     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sends     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs   ENABLE ROW LEVEL SECURITY;

-- Helper: is the current user a member of org_id?
CREATE OR REPLACE FUNCTION public.is_org_member(org_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_members
    WHERE org_members.org_id = $1
      AND org_members.user_id = auth.uid()
  );
$$;

-- Helper: get current user's role in an org
CREATE OR REPLACE FUNCTION public.org_role(org_id UUID)
RETURNS TEXT LANGUAGE sql SECURITY DEFINER AS $$
  SELECT role FROM public.org_members
  WHERE org_members.org_id = $1
    AND org_members.user_id = auth.uid()
  LIMIT 1;
$$;

-- Helper: is current user a platform admin?
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT COALESCE(is_platform_admin, FALSE)
  FROM public.profiles
  WHERE id = auth.uid();
$$;

-- Profiles: users see/edit only their own
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_platform_admin" ON public.profiles FOR ALL USING (public.is_platform_admin());

-- Organizations: members can read; owner/admin can update; platform admin has full access
CREATE POLICY "orgs_member_select" ON public.organizations FOR SELECT USING (public.is_org_member(id));
CREATE POLICY "orgs_member_update" ON public.organizations FOR UPDATE USING (public.org_role(id) IN ('owner','admin'));
CREATE POLICY "orgs_insert"        ON public.organizations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "orgs_platform_admin" ON public.organizations FOR ALL USING (public.is_platform_admin());

-- Org members
CREATE POLICY "members_select" ON public.org_members FOR SELECT USING (public.is_org_member(org_id));
CREATE POLICY "members_insert" ON public.org_members FOR INSERT WITH CHECK (public.org_role(org_id) IN ('owner','admin') OR auth.uid() = user_id);
CREATE POLICY "members_delete" ON public.org_members FOR DELETE USING (public.org_role(org_id) IN ('owner','admin'));
CREATE POLICY "members_platform_admin" ON public.org_members FOR ALL USING (public.is_platform_admin());

-- Newsletters
CREATE POLICY "newsletters_select" ON public.newsletters FOR SELECT USING (public.is_org_member(org_id));
CREATE POLICY "newsletters_write"  ON public.newsletters FOR ALL   USING (public.org_role(org_id) IN ('owner','admin','editor'));
CREATE POLICY "newsletters_platform_admin" ON public.newsletters FOR ALL USING (public.is_platform_admin());

-- Issues
CREATE POLICY "issues_select" ON public.issues FOR SELECT USING (public.is_org_member(org_id));
CREATE POLICY "issues_write"  ON public.issues FOR ALL   USING (public.org_role(org_id) IN ('owner','admin','editor'));
CREATE POLICY "issues_platform_admin" ON public.issues FOR ALL USING (public.is_platform_admin());

-- Subscribers
CREATE POLICY "subscribers_member"         ON public.subscribers FOR ALL USING (public.is_org_member(org_id));
CREATE POLICY "subscribers_platform_admin" ON public.subscribers FOR ALL USING (public.is_platform_admin());

-- Email sends
CREATE POLICY "sends_member"         ON public.email_sends FOR ALL USING (public.is_org_member(org_id));
CREATE POLICY "sends_platform_admin" ON public.email_sends FOR ALL USING (public.is_platform_admin());

-- Activity logs — read-only for admins, write via service role only
CREATE POLICY "logs_admin_read"    ON public.activity_logs FOR SELECT USING (public.org_role(org_id) IN ('owner','admin'));
CREATE POLICY "logs_platform_read" ON public.activity_logs FOR SELECT USING (public.is_platform_admin());

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
