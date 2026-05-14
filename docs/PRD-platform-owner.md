# PRD — Platform Owner Experience
**Status:** Draft  
**Author:** Ezra Studio  
**Last updated:** 2026-05-14

---

## 1. Problem

The EBELMAN platform owner account (`ebelman@admin.com`) currently receives the same UI as regular org users, with a few admin extras tucked into a single `/admin` page. This creates two critical gaps:

1. **Wrong mental model.** The owner is not a user of any newsletter org — they operate the SaaS itself. The sidebar was built for writers and editors, not for someone who needs to monitor the health of the entire platform.
2. **Missing operational visibility.** There is no way to see cross-org activity, subscriber growth trends, revenue/plan status, or a live audit trail — all of which an operator needs to run the platform.

---

## 2. Who This Is For

**Platform Owner (EBELMAN):** The single person who built and runs Newsletter Studio as a SaaS product. Has no newsletter org of their own. Needs to monitor every org, manage every user, configure infrastructure keys, and see what's happening across the platform at any time.

---

## 3. Design Principle

> The platform owner is an **operator**, not an editor. Their navigation, dashboard, and data should reflect the platform level — not the org level.

The owner should never see org-scoped pages (Newsletters, Subscribers, Calendar, etc.) in their sidebar because those pages are scoped to a single org and make no sense at the platform level. Instead they get a completely separate navigation built around **visibility, control, and configuration**.

---

## 4. Current State vs Target State

| Area | Today | Target |
|---|---|---|
| Sidebar | Same as org users + Admin link | Dedicated admin-only nav |
| Landing page after login | `/admin` (one long page) | `/admin` — proper platform dashboard |
| Orgs view | Card list with members | Rich org cards with full stats |
| Users view | Flat table | Searchable table with org memberships |
| Activity | Not visible anywhere | Live activity feed from `activity_logs` |
| Analytics | Org-scoped only | Cross-platform totals + per-org breakdown |
| Settings | Bottom of admin page | Dedicated `/admin/settings` page |
| Permissions | Bottom of admin page | Dedicated `/admin/permissions` page |

---

## 5. Navigation — Platform Owner Sidebar

Replace the current org-scoped sidebar with a platform-scoped one when `is_platform_admin = true` AND `membership = null`.

```
PLATFORM OWNER NAV
───────────────────────────────
[NS logo]  Newsletter Studio
           Platform Owner

Overview
  ● Dashboard       /admin
  ● Activity Feed   /admin/activity

Platform
  ● Organizations   /admin/orgs
  ● Users           /admin/users
  ● Newsletters     /admin/newsletters  (read-only, all orgs)

Configuration
  ● Settings        /admin/settings
  ● Permissions     /admin/permissions

───────────────────────────────
[EBELMAN avatar]  ebelman@admin.com
[Logout]
```

---

## 6. Pages — Specification

### 6.1 Platform Dashboard  `/admin`

**Purpose:** Health at a glance. First thing the owner sees after login.

**KPI row (5 cards):**
- Total Organizations
- Total Users
- Total Active Subscribers (across all orgs)
- Total Issues Sent (all time)
- Total Emails Delivered (all time)

**Charts:**
- New orgs over time (30 days) — bar chart
- Total active subscribers over time (30 days) — line chart

**Recent activity feed (last 20 entries from `activity_logs`):**
- Shows: action type, org name, user name, timestamp
- Action types to display: `issue.sent`, `issue.sent_ab`, `subscriber.added`, `org.created`

**Plan breakdown (donut or table):**
- Count of orgs by plan: trial / starter / pro / enterprise

---

### 6.2 Organizations  `/admin/orgs`

**Purpose:** Full visibility into every org on the platform.

**Header:** Total org count, search input.

**Per-org card (expanded by default, collapsible):**
- Org name, slug, plan badge, created date
- Stats pulled from DB: newsletter count, subscriber count (active), issues sent
- Member list: name, role badge, user ID
- Quick actions: change plan (dropdown), view newsletters (read-only link)

**Empty state:** "No organizations yet — create one from the admin panel."

---

### 6.3 Users  `/admin/users`

**Purpose:** See and manage every user on the platform.

**Header:** Total user count, search by name/email.

**Table columns:**
- Name
- User ID (monospace, truncated)
- Platform admin badge
- Org memberships (list of org names + role per org)
- Created date
- Actions: Grant/Revoke admin (one click, can't self-revoke)

---

### 6.4 Activity Feed  `/admin/activity`

**Purpose:** Real-time audit trail — know what's happening across the platform.

**Source:** `activity_logs` table (org_id, user_id, action, resource_type, resource_id, metadata, created_at)

**Filters:** by org, by action type, by date range.

**Feed row:** timestamp · org name · user name · action label · resource link

**Action labels to display:**

| action key | Display label |
|---|---|
| `issue.sent` | Sent issue to N recipients |
| `issue.sent_ab` | Sent A/B issue to N recipients |
| `issue.polished` | Polished issue with AI |
| `issue.approved` | Approved issue |
| `subscriber.added` | Added subscriber |
| `org.created` | Created organization |

---

### 6.5 Settings  `/admin/settings`

**Purpose:** Configure platform-level infrastructure keys.

Extracted from the current single admin page into its own dedicated route. Same functionality as today:
- RESEND_API_KEY
- FROM_EMAIL
- PLATFORM_ANTHROPIC_API_KEY
- RESEND_WEBHOOK_SECRET

Each setting shows source badge (env / db / unset), masked value, and edit/remove controls.

---

### 6.6 Permissions  `/admin/permissions`

**Purpose:** Manage who can do what, across the entire platform.

Extracted from the current single admin page into its own dedicated route. Same functionality as today:
- Grant/revoke platform admin per user
- Change org member roles (owner/admin/editor/viewer) per org
- Remove org members

---

### 6.7 Newsletters (read-only)  `/admin/newsletters`

**Purpose:** Browse all newsletters across all orgs without switching into an org context.

**Table columns:** Newsletter name · Org name · Subscribers · Issues · Status · Created date

Read-only. No editing. Clicking a newsletter shows its issues (read-only).

---

## 7. Roles Reference

| Scope | Role | Description |
|---|---|---|
| Platform | Platform Admin | Full access to all admin pages, all orgs, all settings |
| Org | owner | Full control of the org |
| Org | admin | Manage members, settings, automations |
| Org | editor | Create/edit issues, segments, templates |
| Org | viewer | Read-only access to org data |

> **Note:** `reader` appears in the schema comment in `001_init.sql` but is unused everywhere in the codebase. It should be removed or formally defined.

---

## 8. What's Already Built

| Feature | Status |
|---|---|
| Platform admin flag on profiles | ✅ Done |
| Onboarding bypass for platform admin | ✅ Done |
| Platform settings (API keys in DB) | ✅ Done |
| Org members view (cards with roles) | ✅ Done |
| Grant/revoke platform admin | ✅ Done |
| Change org member roles | ✅ Done |
| EBELMAN seed script | ✅ Done |
| Platform-owner sidebar (separate nav) | ❌ To build |
| Platform dashboard with KPIs | ❌ To build |
| Activity feed page | ❌ To build |
| `/admin/orgs` with per-org stats | ❌ To build |
| `/admin/users` with org memberships | ❌ To build |
| `/admin/settings` dedicated page | ❌ To build |
| `/admin/permissions` dedicated page | ❌ To build |
| `/admin/newsletters` read-only view | ❌ To build |
| Cross-platform analytics on dashboard | ❌ To build |

---

## 9. Out of Scope (Phase 1)

- Billing integration / Stripe management
- Impersonating an org user
- Per-subscriber drill-down across orgs
- Real-time WebSocket activity feed (polling is fine for now)
- Email notifications to owner on critical events
