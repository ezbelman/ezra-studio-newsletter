# Newsletter Studio — Roadmap

## Group A — Foundation & Stability ✅ Complete

Core infrastructure, auth, data model, and the primary product loop.

| # | Task | Status |
|---|------|--------|
| A1 | Supabase schema — organizations, newsletters, issues, subscribers, segments, automations, activity_logs, email_sends | ✅ |
| A2 | Auth (Supabase + Next.js App Router) — login, register, session | ✅ |
| A3 | Org onboarding flow (name → slug → first newsletter) | ✅ |
| A4 | Issue editor (TipTap / rich text, notes panel, AI polish via Anthropic) | ✅ |
| A5 | Send flow — Resend integration, per-subscriber personalization, delivered_count tracking | ✅ |
| A6 | A/B send variant support | ✅ |
| A7 | Subscriber management (add, import, status toggle) | ✅ |
| A8 | Segments (rules-based, JSONB, list filter preview) | ✅ |
| A9 | Templates (create, apply to issue) | ✅ |
| A10 | Automations (define steps, manual enroll) | ✅ |
| A11 | Public issue viewer (`/s/[slug]/[issueId]`) | ✅ |
| A12 | Resend webhook — bounce / complaint handling, cross-org scoped | ✅ |
| A13 | Type-safety audit — eliminate all unsafe `as X` casts (use `as unknown as X`) | ✅ |
| A14 | Fix upsert + ignoreDuplicates + .single() → PGRST116 crash | ✅ |

---

## Group B — Platform Owner Admin Panel ✅ Complete

Full-featured admin shell visible only to `is_platform_admin = true` users.

| # | Task | Status |
|---|------|--------|
| B1 | `platform_settings` DB table + RLS (only platform admins) | ✅ |
| B2 | `getPlatformSetting(key)` helper — env first, DB fallback | ✅ |
| B3 | Route send + AI through `getPlatformSetting` (no hardcoded env reads) | ✅ |
| B4 | Admin layout (`/admin/**`) — dedicated shell, auth guard | ✅ |
| B5 | AdminSidebar — mobile drawer, section nav, active state | ✅ |
| B6 | Parent layout bypass — admins skip onboarding, redirect to `/admin` | ✅ |
| B7 | Dashboard (`/admin`) — KPIs, plan breakdown, activity feed, quick actions, compact create forms | ✅ |
| B8 | Organizations page (`/admin/orgs`) — per-org stats, member list with role badges | ✅ |
| B9 | Users page (`/admin/users`) — all users, org memberships, platform admin badge | ✅ |
| B10 | Activity Feed (`/admin/activity`) — grouped by date, 200 entries, relative + absolute time | ✅ |
| B11 | Settings page (`/admin/settings`) — add/update/remove API keys, env-lock indicator | ✅ |
| B12 | Permissions page (`/admin/permissions`) — toggle platform admin, change org member roles, remove members | ✅ |
| B13 | EBELMAN owner account SQL seed script | ✅ |

---

## Group C — Product Bug Fixes ✅ Complete

Known regressions and silent failures in the core product.

| # | Task | Status | Notes |
|---|------|--------|-------|
| C1 | Calendar page broken — `newsletter_id` missing from select in `/calendar/page.tsx` | ✅ | |
| C2 | Segments page silent errors — delete/toggle swallows errors without user feedback | ✅ | |
| C3 | Templates page silent errors — same pattern as C2 | ✅ | |
| C4 | Automations page silent errors — same pattern as C2 | ✅ | |
| C5 | `automation_enrollments` schema — verify `next_step_at` column exists, add if missing | ✅ | `20260514_fixup.sql` |
| C6 | Segments/templates migration conflict — stale RLS policies from new_features.sql | ✅ | `20260514_fixup.sql` |
| C7 | Automation execution engine — `next_step_at` cron / background worker | ✅ | `/api/cron/automations`, runs every 5 min |

---

## Group D — Growth Features 🚀 Future

Features to turn Newsletter Studio into a competitive SaaS product.

| # | Feature | Priority | Notes |
|---|---------|----------|-------|
| D1 | Billing / plan management UI (Stripe integration) | High | Unlock plan gating already in schema |
| D2 | Org impersonation for support — admin opens any org as read-only | High | Needs RLS bypass + audit log |
| D3 | Newsletter analytics dashboard — open rate, click rate, unsubscribe trend | High | Needs tracking pixel + link wrapper |
| D4 | Subscriber import via CSV | Medium | Already on UI roadmap, no backend yet |
| D5 | Custom domain sending (per-org FROM address, Resend domain verification) | Medium | |
| D6 | Admin read-only newsletter view — see any org's drafts from `/admin/orgs/[id]` | Medium | |
| D7 | Invite link flow (email invite → accept → org member) | Medium | Currently only admin can add members |
| D8 | Unsubscribe page + one-click opt-out link in emails | High | Legal requirement (CAN-SPAM / GDPR) |
| D9 | GDPR data export / deletion request flow | Medium | |
| D10 | Multi-newsletter support per org (UI to switch between newsletters) | Low | Schema ready, UI missing |
| D11 | AI subject line suggestions | Low | |
| D12 | Scheduled send (pick date/time, queue send) | Low | |
