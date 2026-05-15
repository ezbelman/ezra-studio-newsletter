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

## Group D — Growth Features ✅ Complete (core items)

Features to turn Newsletter Studio into a competitive SaaS product.

| # | Feature | Priority | Status | Notes |
|---|---------|----------|--------|-------|
| D1 | Billing / plan management UI (Stripe integration) | High | 🔲 Phase 4 | External service setup required |
| D2 | Org impersonation for support — admin opens any org as read-only | High | ✅ | `/admin/orgs/[id]` — full org detail with newsletters, issues, members, activity |
| D3 | Newsletter analytics dashboard — open rate, click rate, unsubscribe trend | High | ✅ | `/analytics` and `/analytics/[sendId]` pages built |
| D4 | Subscriber import via CSV | Medium | ✅ | `ImportCsvDialog` + `importSubscribers` action |
| D5 | Custom domain sending (per-org FROM address, Resend domain verification) | Medium | 🔲 Phase 4 | Resend domain API setup required |
| D6 | Admin read-only newsletter view — see any org's drafts from `/admin/orgs/[id]` | Medium | ✅ | Covered by D2 |
| D7 | Invite link flow (email invite → accept → org member) | Medium | ✅ | `/team` invite form, `/invite/accept` page, `org_invitations` table |
| D8 | Unsubscribe page + one-click opt-out link in emails | High | ✅ | `/unsubscribe` page, token-based opt-out in all sent emails |
| D9 | GDPR data export / deletion request flow | Medium | 🔲 Phase 4 | Complex compliance scope |
| D10 | Multi-newsletter support per org (UI to switch between newsletters) | Low | ✅ | `/newsletters` list is the switcher; all pages are newsletter-scoped |
| D11 | AI subject line suggestions | Low | ✅ | "Suggest subjects" button in issue editor, Claude generates 5 options |
| D12 | Scheduled send (pick date/time, queue send) | Low | ✅ | Schedule toggle in send dialog, `/api/cron/scheduled-sends` runs every 5 min |

---

## Phase 1 — Security & Stability 🔄 In Progress

> Target: 2 weeks. Blockers and high-severity issues from the [expert audit](./AUDIT.md).

| # | Task | Priority | Status | Notes |
|---|------|----------|--------|-------|
| P1-1 | `middleware.ts` — server-side auth guard for all app + API routes | BLOCKER-1 | ✅ | Redirect unauthenticated to `/login` |
| P1-2 | Error boundaries — `error.tsx` at `app/`, `app/(app)/`, `app/(app)/admin/` | HIGH-8 | ✅ | Friendly fallback + retry |
| P1-3 | `lib/billing/limits.ts` — `PLAN_LIMITS` constant | BLOCKER-2 | ✅ | trial/starter/pro/enterprise |
| P1-4 | `supabase/migrations/20260515_org_usage.sql` — `org_usage` table | BLOCKER-2 | ✅ | Monthly send + AI counters |
| P1-5 | `lib/billing/check-limit.ts` — `checkOrgLimit()` + `incrementUsage()` | BLOCKER-2 | ✅ | Used at every enforcement point |
| P1-6 | Enforce newsletter limit in `new-newsletter-form.tsx` → convert to server action | BLOCKER-2 | ✅ | `newsletters/new/actions.ts` |
| P1-7 | Enforce seat limit in `team/actions.ts → inviteMember()` | BLOCKER-2 | ✅ | |
| P1-8 | Enforce email send limit in `/api/issues/[issueId]/send` | BLOCKER-2 | ✅ | Also applied to scheduled-sends cron |
| P1-9 | Enforce AI polish limit in `/api/ai/polish` | BLOCKER-2 | ✅ | Platform key only |
| P1-10 | Extract `lib/email/dispatch-issue.ts` — shared send logic (eliminating duplication) | BLOCKER-5 | ✅ | Both send route + scheduled-sends cron refactored |
| P1-11 | Interactive calendar — URL search param month/year navigation | BLOCKER-4 | ✅ | `?year=&month=` params, `<Link>` nav |
| P1-12 | Approval notification email — notify owners/admins when `pending_approval` | BLOCKER-3 | ✅ | `/api/issues/[issueId]/status` route + editor update |
| P1-13 | Issue autosave — debounced raw_notes save in issue editor | HIGH | ✅ | 1.5s debounce, raw notes now editable, "Saving…/Saved" indicator |
| P1-14 | Email preview modal + "Send test to self" | HIGH-1 | ✅ | `/api/issues/[issueId]/preview` GET + POST; full-screen iframe modal |
| P1-15 | `needs_revision` status + reviewer comment | M-15 | ✅ | Dialog with optional comment, notifies author via email |
| P1-16 | Timezone label in schedule datetime UI | HIGH-7 | ✅ | `Intl.DateTimeFormat().resolvedOptions().timeZone` |

---

## Phase 2 — Editor & Content Quality ✅ Complete

> Target: Weeks 3–4. Polish the issue creation and approval workflow.

| # | Task | Priority | Status | Notes |
|---|------|----------|--------|-------|
| P2-1 | Issue version history viewer — UI for `issue_versions` table + restore | M-4 | ✅ | `/newsletters/[id]/issues/[issueId]/versions` + `restoreVersion` action |
| P2-2 | Subscriber tag UI — inline chip editor + tag filter in segments | HIGH-4 | ✅ | `TagChipEditor` inline chip editor, `20260516_subscriber_tags.sql` migration, `bulkAddTag` action |
| P2-3 | Expanded role model — add `reviewer` + `contributor` roles | HIGH-3 | ✅ | New roles in DB, invite form, member-list, status route allows reviewers to approve |
| P2-4 | Confirmation dialogs — delete issue, remove member, delete newsletter | M-5 | ✅ | Delete issue modal, confirm-remove for members, archive newsletter already had confirm |
| P2-5 | Bulk subscriber actions — bulk tag, bulk unsubscribe, bulk delete | M-6 | ✅ | `BulkSubscriberTable` with checkbox selection + toolbar |
| P2-6 | A/B test results split in analytics `/analytics/[sendId]` | M-8 | ✅ | Side-by-side variant comparison with `FunnelStats` component |
| P2-7 | Read-time estimate in issue editor (words ÷ 200 wpm) | M-10 | ✅ | Derived from `polished_json` word count, shown above polished content |
| P2-8 | Styled invitation emails with org branding | M-2 | ✅ | Branded HTML email sent on invite creation via Resend |
| P2-9 | Activity log pagination — beyond 200 entries | M-3 | ✅ | 50-per-page with prev/next links, `?page=N` URL param |

---

## Phase 3 — Growth & Discovery ✅ Complete

> Target: Weeks 5–6. Make the product sticky and discoverable.

| # | Task | Priority | Status | Notes |
|---|------|----------|--------|-------|
| P3-1 | Global search modal (Cmd+K) — issues, subscribers, newsletters | HIGH-2 | ✅ | `/api/search` + `SearchModal` wired in Sidebar |
| P3-2 | Automation step drag-and-drop reorder | M-7 | ✅ | HTML5 native drag API in `new-automation-dialog.tsx` |
| P3-3 | Segment live count preview (real-time subscriber count for rule set) | — | ✅ | `previewSegmentCount` action + debounced display |
| P3-4 | Per-org send rate throttle | M-9 | ✅ | 200 emails/run cap in automation cron |
| P3-5 | Webhook retry for failed open/click events | M-11 | ✅ | `withRetry` wrapper (3 attempts) in webhook handler |
| P3-6 | Multi-template email layout library | HIGH-5 | ✅ | `dark` / `light` / `minimal` layouts; template picker in newsletter settings |
| P3-7 | Public subscriber widget / embed code | M-14 | ✅ | `/embed/[slug]` iframe page; embed snippet in newsletter settings |

---

## Phase 4 — Security & Authorization 🔄 In Progress

> Target: Weeks 7–8. RBAC enforcement, encryption, state machine, search performance.

| # | Task | Priority | Status | Notes |
|---|------|----------|--------|-------|
| P4-1 | `lib/auth/permissions.ts` — `checkPermission()` + `assertPermission()` + role hierarchy | BLOCKER | ✅ | `ROLE_RANK`: viewer(0)→owner(5) |
| P4-2 | `lib/auth/issue-state.ts` — `validateTransition()` + `transitionMinRole()` | HIGH | ✅ | State machine: draft→pending→approved→sent |
| P4-3 | Wire `checkPermission('editor')` into all server actions | BLOCKER | ✅ | automation, segment, template, issue-versions, subscriber, bulk, tag actions |
| P4-4 | State machine validation in `/api/issues/[issueId]/status` route | HIGH | ✅ | Replaces ad-hoc APPROVER_ROLES check |
| P4-5 | `lib/crypto/encrypt.ts` — AES-256-GCM encryption for platform settings | BLOCKER | ✅ | `enc:iv:tag:ciphertext` format, backward-compat with plain-text |
| P4-6 | Stripe keys in admin settings (encrypted at rest) | HIGH | ✅ | `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` |
| P4-7 | GIN trigram indexes for search performance | HIGH | ✅ | `20260518_search_indexes.sql` — issues, subscribers, newsletters |
| P4-8 | Stripe billing integration — plan upgrades, payment method, invoices | D1 | 🔲 | External Stripe setup required |
| P4-9 | Custom domain sending — per-org FROM address via Resend domain API | D5 | 🔲 | Resend domain setup required |
| P4-10 | GDPR data export + deletion request flow | D9 | 🔲 | Complex compliance scope |
