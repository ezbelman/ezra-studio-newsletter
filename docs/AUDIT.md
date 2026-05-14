# Newsletter Studio — Expert Platform Audit

> Conducted 2026-05-14. Full sweep: architecture, UX, roles, billing, code quality.

---

## Blockers (P0 — ship-stopping)

### BLOCKER-1 · No `middleware.ts` route guard

Auth is enforced only in server component layouts. Every API route and any direct URL access bypasses the auth check entirely. A user who discovers an API path can hit it unauthenticated.

**Fix:** Create `middleware.ts` at the project root, matching `/app/**` and `/api/**`, redirecting unauthenticated requests to `/login`.

---

### BLOCKER-2 · Billing limits not enforced anywhere

`plan` exists on `organizations` and the DB has plan tiers, but nothing stops a `trial` org from adding 10,000 subscribers, sending unlimited emails, or creating unlimited newsletters.

**Fix:** Add `PLAN_LIMITS` constant + `checkOrgLimit()` helper. Enforce at every creation/send boundary.

```typescript
// lib/billing/limits.ts
export const PLAN_LIMITS = {
  trial:      { newsletters: 1,        subscribers: 500,      sends: 1_000,   seats: 2,        aiPolish: 10  },
  starter:    { newsletters: 3,        subscribers: 2_500,    sends: 10_000,  seats: 5,        aiPolish: 50  },
  pro:        { newsletters: 10,       subscribers: 10_000,   sends: 50_000,  seats: 15,       aiPolish: 200 },
  enterprise: { newsletters: Infinity, subscribers: Infinity, sends: Infinity, seats: Infinity, aiPolish: Infinity },
} as const

export type PlanKey = keyof typeof PLAN_LIMITS
export type LimitKey = keyof typeof PLAN_LIMITS['trial']
```

**Enforcement points:**
- Newsletter creation (`new-newsletter-form.tsx`)
- Invite member (`team/actions.ts → inviteMember()`)
- Issue send (`/api/issues/[issueId]/send`)
- AI polish (`/api/ai/polish`)

**Supporting DB table:**
```sql
create table if not exists org_usage (
  org_id     uuid references organizations(id) on delete cascade,
  month      text not null,  -- 'YYYY-MM'
  sends      int  not null default 0,
  ai_polish  int  not null default 0,
  primary key (org_id, month)
);
```

---

### BLOCKER-3 · No approval notification

When an editor submits an issue (`status → pending_approval`), admins and owners have no way to know. There's no email notification, no in-app badge, no webhook.

**Fix:** In the status-change server action, when new status is `pending_approval`, query org members with `role IN ('owner', 'admin')` and send a transactional email via Resend.

---

### BLOCKER-4 · Calendar month navigation is dead UI

`/calendar/page.tsx` renders `<button>` elements for prev/next month with no `onClick` handlers. The calendar is frozen on the current month.

**Fix:** Convert to URL search params (`?year=2026&month=05`). The server component reads `searchParams` and renders the correct month. Navigation becomes `<Link>` elements — no client JS needed.

---

### BLOCKER-5 · Duplicate email dispatch logic

`/api/issues/[issueId]/send/route.ts` and `/api/cron/scheduled-sends/route.ts` each contain their own copy of `buildEmails()` + batch-send loop. They've already diverged (the send route has A/B support; the cron does not).

**Fix:** Extract to `lib/email/dispatch-issue.ts` with a shared `dispatchIssue(issueId, opts)` function. Both callers import and delegate.

---

## High Issues (P1 — should fix before soft launch)

### HIGH-1 · No email preview before send

Editors can polish content in the TipTap editor but cannot see what the final rendered HTML email looks like. The gap between editor output and email render is where formatting bugs live.

**Fix:** Email preview modal with rendered iframe + "Send test to myself" button hitting `/api/issues/[issueId]/preview`.

---

### HIGH-2 · No global search

No way to search across issues by title/content, subscribers by email/name, or newsletters by name. At scale (hundreds of issues, thousands of subscribers) the app becomes unusable without search.

**Fix:** Global search modal (Cmd+K) backed by Postgres `ilike` across issues, subscribers, newsletters. Debounced, results grouped by type.

---

### HIGH-3 · Role model too coarse

Current roles: `owner / admin / editor / viewer`. No `reviewer` (can approve without sending) and no `contributor` (can draft but not publish). This forces orgs to give editors full send access or nothing.

**Proposed role matrix:**

| Permission             | viewer | contributor | editor | reviewer | admin | owner |
|------------------------|:------:|:-----------:|:------:|:--------:|:-----:|:-----:|
| View issues            | ✓      | ✓           | ✓      | ✓        | ✓     | ✓     |
| Create draft           | —      | ✓           | ✓      | —        | ✓     | ✓     |
| Edit draft             | —      | own only    | ✓      | —        | ✓     | ✓     |
| AI polish              | —      | ✓           | ✓      | —        | ✓     | ✓     |
| Submit for review      | —      | ✓           | ✓      | —        | ✓     | ✓     |
| Approve / request revision | —  | —           | —      | ✓        | ✓     | ✓     |
| Send / schedule        | —      | —           | —      | —        | ✓     | ✓     |
| Manage subscribers     | —      | —           | ✓      | —        | ✓     | ✓     |
| Manage segments        | —      | —           | ✓      | —        | ✓     | ✓     |
| Manage automations     | —      | —           | ✓      | ✓        | ✓     | ✓     |
| Manage templates       | —      | —           | ✓      | —        | ✓     | ✓     |
| Invite members         | —      | —           | —      | —        | ✓     | ✓     |
| Remove / change roles  | —      | —           | —      | —        | admin | ✓     |
| Delete newsletter      | —      | —           | —      | —        | —     | ✓     |
| Billing / plan         | —      | —           | —      | —        | —     | ✓     |

---

### HIGH-4 · Subscriber tag UI missing

`subscribers` table has a `tags` JSONB column but there is no UI to add, remove, or filter by tags. Segment rules can reference tags but users cannot set them.

**Fix:** Inline tag chips in the subscriber row + tag filter in the segment rule builder.

---

### HIGH-5 · Single rigid email template

All issues render with the same `renderEmailHtml()` template. There's no way for an org to choose a different layout, add a logo image, or change the footer.

**Fix:** Template-based rendering — store `email_template_id` on newsletters, render with the chosen template's layout wrapper.

---

### HIGH-6 · Calendar navigation broken (duplicate of BLOCKER-4)

See BLOCKER-4.

---

### HIGH-7 · Schedule UI shows no timezone

The schedule datetime picker shows times but never mentions timezone. A user in UTC-5 who types "9:00 AM" gets 9:00 AM UTC, not 9:00 AM local — a 5-hour surprise.

**Fix:** Show the user's detected timezone next to the datetime input. Store `scheduled_at` in UTC (already done); display local equivalent on confirmation.

---

### HIGH-8 · No error boundaries

Any server component or client component that throws will crash the full page with Next.js's default unhandled error screen. No graceful degradation.

**Fix:** Add `error.tsx` at `app/`, `app/(app)/`, and `app/(app)/admin/` with a user-friendly fallback + retry button.

---

## Medium Issues (P2 — target in Phase 2–3)

| # | Issue |
|---|-------|
| M-1 | Newsletter creation is a raw client-side Supabase insert — no server action, no plan limit check, no activity log |
| M-2 | Invitation emails are plain Resend transactional with no styling (no org branding) |
| M-3 | Activity log capped at 200 entries — no pagination or infinite scroll |
| M-4 | Issue version history exists in DB (`issue_versions` table + `saveIssueVersion` action) but no UI viewer |
| M-5 | No confirmation dialogs on destructive actions (delete issue, remove member, delete newsletter) |
| M-6 | No bulk actions in subscriber list (bulk tag, bulk unsubscribe, bulk delete) |
| M-7 | Automation step ordering is purely manual (no drag-and-drop reorder) |
| M-8 | A/B test results not surfaced in `/analytics/[sendId]` — data exists, UI doesn't split by variant |
| M-9 | No per-org send rate throttle — a misconfigured automation could flood Resend |
| M-10 | No read-time estimate in the issue editor |
| M-11 | Webhook retry missing — if Resend webhook fires and DB write fails, the open/click is lost silently |
| M-12 | Subscriber count in org stats is cached at page load, not live |
| M-13 | Missing keyboard shortcuts in TipTap editor (beyond built-in bold/italic) |
| M-14 | No public-facing subscriber count widget or embed code |
| M-15 | `needs_revision` is not a valid issue status — reviewers can only Approve, not request changes with a comment |

---

## Technical Architecture Observations

### What's working well
- Supabase RLS + admin client separation is correct — user-scoped queries use the server client; privileged operations use the admin client.
- `getPlatformSetting()` env-first, DB-fallback pattern is clean and correct.
- Server actions pattern is used consistently across most mutation paths.
- `as unknown as TargetType` double-cast for Supabase join type errors is the right idiom.
- Vercel cron via `vercel.json` is the right approach for background jobs at this scale.

### What needs attention
- **No `middleware.ts`** — the single biggest security gap.
- **Direct client Supabase insert** in `new-newsletter-form.tsx` — bypasses RLS, activity logging, and limit enforcement. Should be a server action.
- **Auth check in layout** instead of middleware means API routes are unprotected.
- **Build errors from `SelectQueryError` casts** — Supabase join types are not inferred correctly when using `.select()` with nested relations; double-cast is correct but should be centralized in typed helpers.
- **Duplicate send logic** — `send/route.ts` has A/B support; `scheduled-sends/route.ts` does not. They will diverge further.
- **Rate limiting** is absent. At scale, move to Redis/Upstash for sliding window limits.

---

## Phase Roadmap

See `docs/ROADMAP.md` — Phases 1–4.
