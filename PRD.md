# Newsletter Studio — Product Requirements Document (PRD)
**Version:** 1.1  
**Date:** 2026-05-07  
**Author:** Ezra Bellon  
**Status:** Draft — Awaiting Approval

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Goals & Success Metrics](#3-goals--success-metrics)
4. [User Personas](#4-user-personas)
5. [Visual Identity & Design System](#5-visual-identity--design-system)
6. [Information Architecture](#6-information-architecture)
7. [Complete Screen Inventory & Paths](#7-complete-screen-inventory--paths)
8. [Feature Specifications](#8-feature-specifications)
   - 8.1 Authentication
   - 8.2 Onboarding
   - 8.3 Dashboard
   - 8.4 Newsletters & Issues
   - 8.5 Subscribers
   - 8.6 Segments
   - 8.7 Templates
   - 8.8 Automations
   - 8.9 Calendar
   - 8.10 Connections (Multi-Channel)
   - 8.11 Analytics
   - 8.12 Team
   - 8.13 Forms & Landing Pages
   - 8.14 Settings
   - 8.15 Billing
   - 8.16 Developers
   - 8.17 Help & Docs
   - 8.18 Platform Admin
   - 8.19 Public Pages
   - 8.20 CRM
   - 8.21 Sponsorship & Ads
   - 8.22 Referral System
   - 8.23 White-Label Branding
9. [Security Architecture](#9-security-architecture)
10. [Data Models](#10-data-models)
11. [API Surface](#11-api-surface)
12. [Infrastructure & Integrations](#12-infrastructure--integrations)
13. [Phased Roadmap](#13-phased-roadmap)
14. [Open Questions](#14-open-questions)

---

## 1. Executive Summary

**Newsletter Studio** is a multi-tenant SaaS platform that unifies newsletter creation, team collaboration, multi-channel distribution, and audience analytics into a single workspace. It combines AI-powered content generation with a structured editorial workflow, enabling any team — regardless of writing experience — to produce professional newsletters and distribute them across email, WhatsApp, Telegram, and Instagram from one place.

---

## 2. Problem Statement

| Pain Point | Current Reality | Newsletter Studio Fix |
|---|---|---|
| Writing takes too long | Writers start from blank page | AI transforms raw notes into polished copy in seconds |
| No approval process | Content sent via Slack/email for review | Structured Draft → Approval → Publish workflow |
| Fragmented distribution | Email tool + manual social posts | One-click send to email + WhatsApp + Telegram + Instagram |
| No subscriber intelligence | Flat list, no segmentation | Rule-based segments, engagement scoring |
| Analytics are shallow | Open rate only | Opens, clicks, channel comparison, growth trends, heat maps |
| No team visibility | No shared workspace | Role-based access, activity feed, content calendar |

---

## 3. Goals & Success Metrics

### Primary Goals
- Reduce time from raw idea to published newsletter to under 10 minutes
- Enable any team member (not just writers) to produce quality content
- Provide a single control center for multi-channel communication

### Success Metrics

| Metric | Target | Measurement |
|---|---|---|
| Time raw notes → published | < 10 min | Session duration in editor |
| AI Polish adoption | > 80% of new issues | `issues.polished_json IS NOT NULL` |
| Email delivery rate | > 98% | `delivered / sent` in `email_sends` |
| Average open rate | > 30% | `opened / delivered` |
| Multi-channel adoption | > 40% orgs use 2+ channels | `connections` table channel count |
| Subscriber growth MoM | > 15% | Subscriber count delta |
| Approval workflow usage | > 60% of issues | Issues that pass through `pending_approval` |
| Weekly active orgs | > 70% of paid orgs | Sessions in last 7 days |

### Platform Admin KPIs Dashboard

The platform admin panel exposes a dedicated KPIs view tracking the health of the creator ecosystem. These metrics are calculated nightly and displayed as time-series charts with 7-day, 30-day, and 90-day windows.

| KPI | Definition | Target | Data Source |
|---|---|---|---|
| **Weekly Active Creators** | Distinct orgs that published at least one issue or used AI Polish in the last 7 days | > 70% of paid orgs | `issues.created_at`, `issues.polished_json` |
| **Type of Communication Send Rate** | Breakdown of sends by channel (email / WhatsApp / Telegram / LinkedIn / Instagram) as a % of total sends per week | Email > 60%, multi-channel adoption growing | `channel_sends.channel` |
| **Referral Rate** | % of new org sign-ups that originated from a referral link | > 25% of new signups | `referrals.referred_org_id` |
| **AI Usage per User** | Average number of AI Polish calls per active editor per week | > 3 per user | `ai_usage_logs.user_id` |
| **Subscriber Growth** | Net new subscribers across all orgs week-over-week | Platform-wide > 10% MoM | `subscribers.created_at` |
| **Churn** | Orgs that downgraded, cancelled, or went inactive (no activity in 30 days) | < 5% MoM | `billing.status`, last session date |
| **Revenue per Creator** | MRR divided by number of active paying orgs | Growing > 5% QoQ | `billing.mrr`, active org count |

All KPIs are visible to platform admins only in the **Admin → KPIs** tab. Each card shows: current value, delta vs previous period, and a sparkline chart. Critical regressions (WAC drops > 10%, churn spikes > 2%) trigger a PagerDuty alert.

---

## 4. User Personas

### P1 — Alex, Content Lead (Owner/Admin)
- **Goal:** Full visibility over all newsletters, approve content before it goes out
- **Frustration:** No unified view of what's in draft vs approved vs scheduled
- **Uses:** Dashboard, Calendar, Approval Queue, Analytics, Team

### P2 — Maria, Newsletter Writer (Editor)
- **Goal:** Draft and publish fast without needing a writing degree
- **Frustration:** Blank page anxiety, back-and-forth approval chains via Slack
- **Uses:** Issue Editor, AI Polish, Templates, Connections panel

### P3 — Sam, Approver (Admin)
- **Goal:** Review content quickly and unblock the team
- **Frustration:** Gets content in email/Slack with no context or history
- **Uses:** Approval queue notification, Issue viewer, Activity log

### P4 — Jordan, Subscriber (Reader)
- **Goal:** Receive relevant, well-formatted content on their preferred channel
- **Frustration:** Inconsistent formatting, no channel choice, hard to unsubscribe
- **Uses:** Subscribe page, Unsubscribe link, Web archive

### P5 — Dev / Integrator (Developer role)
- **Goal:** Connect Newsletter Studio to their existing stack
- **Frustration:** No API, no webhooks, locked into one tool
- **Uses:** Developers section, API keys, Webhooks

### P6 — Platform Admin (Superadmin)
- **Goal:** Manage all organizations, monitor usage, handle support
- **Frustration:** No centralized dashboard for platform health
- **Uses:** Admin panel, Org management, User management

---

## 5. Visual Identity & Design System

### Brand Direction
Newsletter Studio positions itself as a **modern, professional editorial tool** — not a mass-marketing platform. The visual language draws from:
- **GitHub** — clean sidebar navigation, high information density, neutral dark tones
- **QuickBooks** — structured dashboard cards, clear metric hierarchy, left-nav sections
- **SEMrush** — data-rich analytics panels, tabbed filtering, chart-forward layout
- **Stripe** — premium gradient accents, refined typography, trust-inspiring whitespace

### Color Palette

| Token | Value | Usage |
|---|---|---|
| `--color-bg-base` | `#0A0A0F` | App background (dark mode default) |
| `--color-bg-surface` | `#111118` | Cards, panels, sidebars |
| `--color-bg-elevated` | `#1A1A24` | Modals, dropdowns, popovers |
| `--color-border` | `#2A2A38` | All dividers and outlines |
| `--color-text-primary` | `#F0F0F5` | Headings, key labels |
| `--color-text-secondary` | `#8888A0` | Subtext, metadata |
| `--color-text-muted` | `#55556A` | Placeholders, disabled |
| `--color-accent-primary` | `#7B5CF0` | Primary CTA (purple) |
| `--color-accent-secondary` | `#4F8EF7` | Links, active states (blue) |
| `--color-accent-gradient` | `linear-gradient(135deg, #7B5CF0, #4F8EF7)` | Hero sections, key highlights |
| `--color-success` | `#22C55E` | Published, delivered, active |
| `--color-warning` | `#F59E0B` | Pending approval, scheduled |
| `--color-error` | `#EF4444` | Errors, bounced, rejected |
| `--color-channel-whatsapp` | `#25D366` | WhatsApp brand color |
| `--color-channel-telegram` | `#2AABEE` | Telegram brand color |
| `--color-channel-instagram` | `#E1306C` | Instagram brand color |

### Typography

| Role | Font | Weight | Size |
|---|---|---|---|
| Display / Hero | Inter | 700 | 48–64px |
| Heading H1 | Inter | 600 | 28–36px |
| Heading H2 | Inter | 600 | 20–24px |
| Heading H3 | Inter | 500 | 16–18px |
| Body | Inter | 400 | 14–15px |
| Caption / Meta | Inter | 400 | 12px |
| Code / Monospace | JetBrains Mono | 400 | 13px |

### Component Style Rules

- **Cards:** `border-radius: 12px`, `border: 1px solid var(--color-border)`, subtle `box-shadow`
- **Buttons (Primary):** gradient background (`accent-gradient`), white text, `border-radius: 8px`
- **Buttons (Secondary):** transparent with border, `hover: bg-elevated`
- **Sidebar:** fixed 240px width, collapsible to 60px (icons only), `bg-surface`
- **Tables:** zebra striping with `bg-elevated` on alternate rows
- **Badges:** pill-shaped, color-coded by status (draft=muted, pending=warning, published=success)
- **Charts:** dark background, gradient fills, subtle grid lines
- **Modals:** centered, `max-width: 560px`, backdrop blur

### Iconography
- **Library:** Lucide React (already installed)
- **Style:** Outline icons, 20px default, 16px in dense views
- **Channel icons:** Official brand SVGs for WhatsApp, Telegram, Instagram

### Motion
- **Transitions:** 150ms ease-out for hover states, 200ms for modals
- **Skeleton loaders** on all async content (no spinners)
- **Toast notifications:** slide in from bottom-right, auto-dismiss 4s

### Themes
- Default: **Dark mode** (matches design palette above)
- Optional: **Light mode** (inverted surface colors, same accent palette)
- Toggle: accessible via user profile menu and keyboard shortcut

---

## 6. Information Architecture

```
Newsletter Studio
│
├── PUBLIC (unauthenticated)
│   ├── /                          Marketing homepage
│   ├── /login                     Sign in
│   ├── /signup                    Create account
│   ├── /forgot-password           Request reset
│   ├── /reset-password            Set new password
│   ├── /invite/accept?token=xxx   Accept team invitation
│   ├── /s/[newsletter-slug]       Public subscribe page
│   ├── /s/[slug]/[issue-slug]     Web archive — issue view
│   └── /unsubscribe?token=xxx     One-click unsubscribe
│
├── ONBOARDING (authenticated, no org)
│   └── /onboarding                Create first organization
│
└── APP (authenticated, has org)
    ├── /dashboard                 Overview
    ├── /newsletters               All newsletters
    │   └── /newsletters/[id]      Newsletter detail
    │       ├── /issues/new        New issue
    │       ├── /issues/[id]       Issue editor
    │       └── /settings          Newsletter settings
    ├── /calendar                  Content calendar
    ├── /automations               Email automation rules
    ├── /subscribers               Subscriber management
    ├── /segments                  Audience segments
    ├── /templates                 Template library
    ├── /connections               Multi-channel connections
    ├── /analytics                 Analytics dashboard
    ├── /forms                     Subscribe forms & pages
    ├── /team                      Team members & roles
    ├── /settings                  Org & user settings (incl. branding)
    ├── /billing                   Plan & payment management
    ├── /developers                API keys & webhooks
    ├── /help                      Docs & support
    ├── /crm                       Subscriber CRM & contact records
    ├── /referrals                 Referral program management
    └── /admin                     Platform admin (superadmin only)
        ├── /admin/kpis            Platform KPI dashboard
        └── /admin/sponsorships    Sponsorship campaign management
```

---

## 7. Complete Screen Inventory & Paths

### 7.1 Authentication Paths

```
[/]  Homepage
 ├──→ "Get Started" CTA  →  [/signup]
 │         ├── Submit form  →  Email verification sent
 │         │         └──→  Verify email link  →  [/onboarding]
 │         └── "Already have account"  →  [/login]
 │
 └──→ "Sign In" CTA  →  [/login]
           ├── Submit email + password  →  [/dashboard] or [/onboarding]
           ├── "Forgot password"  →  [/forgot-password]
           │         └── Submit email  →  Email sent
           │                   └──→  Link in email  →  [/reset-password]
           │                               └── Submit new password  →  [/login]
           └── OAuth (future)  →  Redirect  →  [/api/auth/callback]  →  [/dashboard]
```

### 7.2 Onboarding Path

```
[/onboarding]
 └── Step 1: Create organization (name, slug)
       └── Step 2: Create first newsletter (name, description)
             └── Step 3: Invite team members (optional, skippable)
                   └── Step 4: Connect a channel (optional, skippable)
                         └──→  [/dashboard]  (with onboarding checklist widget)
```

### 7.3 Editorial Core Path (Primary User Loop)

```
[/dashboard]
 └──→ [/newsletters]
           ├──→ "New Newsletter" modal  →  creates newsletter  →  [/newsletters/[id]]
           └──→ Click newsletter card  →  [/newsletters/[id]]
                     │
                     ├── Tab: Issues
                     │     ├──→ "New Issue"  →  [/newsletters/[id]/issues/new]
                     │     │         └── Form (title, raw notes)  →  creates draft
                     │     │                   └──→  [/newsletters/[id]/issues/[id]]
                     │     │                               │
                     │     │                    ┌──────────┴──────────────────┐
                     │     │                    ↓                             ↓
                     │     │              AI Polish button              Manual editing
                     │     │                    │                             │
                     │     │                    └──────────┬──────────────────┘
                     │     │                               ↓
                     │     │                    "Preview Email" modal
                     │     │                               │
                     │     │                    "Submit for Approval"
                     │     │                               │
                     │     │                    ┌──────────┴──────────┐
                     │     │                    ↓ (approver)          ↓ (approver)
                     │     │              "Approve"             "Back to Draft"
                     │     │                    │
                     │     │         ┌──────────┴────────────────┐
                     │     │         ↓                           ↓
                     │     │    "Send Now"                 "Schedule"
                     │     │         │                     set date/time
                     │     │         └──────────┬──────────────┘
                     │     │                    ↓
                     │     │         Distribution panel opens:
                     │     │         ✅ Email  ✅ WhatsApp  ✅ Telegram  ⬜ Instagram  ⬜ LinkedIn
                     │     │                    ↓  confirm
                     │     │              [Published ✓]
                     │     │                    └──→ Web archive: /s/[slug]/[issue-slug]
                     │     │
                     │     └──→ Click existing issue  →  [/newsletters/[id]/issues/[id]]
                     │
                     ├── Tab: Subscribers  →  filtered to this newsletter
                     ├── Tab: Analytics   →  filtered to this newsletter
                     └── Settings link    →  [/newsletters/[id]/settings]
```

### 7.4 Subscriber Paths

```
[/subscribers]
 ├──→ Filter by newsletter / status / tag
 ├──→ Search bar (email, name)
 ├──→ "Import CSV"
 │         └── Upload modal  →  column mapping  →  preview  →  confirm import
 ├──→ "Add Subscriber" modal
 │         └── Form: email, name, newsletter, tags
 ├──→ Click row  →  Subscriber detail panel (side drawer)
 │         ├── History: subscribed date, issues received, opens, clicks
 │         ├── Edit tags
 │         └── "Unsubscribe" / "Delete" actions
 └──→ Bulk select  →  "Add tag" / "Move to segment" / "Unsubscribe" / "Export"

PUBLIC PATH:
[/s/[newsletter-slug]]  Subscribe page
 └── Submit email  →  confirmation email sent  →  thank-you state
           │
           └── Email footer unsubscribe link
                 └──→ [/unsubscribe?token=xxx]  →  confirmed unsubscribed state
```

### 7.5 Segment Paths

```
[/segments]
 ├──→ "New Segment" modal
 │         └── Rule builder:
 │               ├── Subscribed to: [newsletter dropdown]
 │               ├── Status: active / unsubscribed / bounced
 │               ├── Opened: last N issues / never
 │               ├── Tag: is / is not [tag name]
 │               └── Joined: before / after [date]
 │               └──  Preview count  →  Save segment
 │
 └──→ Click segment  →  Segment detail
           ├── Subscriber list (filtered)
           ├── "Use in send" — select when sending an issue
           └── "Edit rules" / "Delete segment"
```

### 7.6 Templates Paths

```
[/templates]
 ├── Tab: Platform Templates (read-only)
 │     ├── Weekly Digest
 │     ├── Product Update
 │     ├── Company Announcement
 │     ├── AI Industry Roundup
 │     └── Minimal Text
 │           └──→ Click  →  Preview modal  →  "Use this template"
 │                               └──→  [/newsletters/[id]/issues/new?template=xxx]
 │
 └── Tab: My Templates (org-specific)
       ├──→ Saved from published issues
       ├──→ "New Template" from scratch
       └──→ Click  →  Edit / Delete / Duplicate
```

### 7.7 Automations Paths

```
[/automations]
 ├──→ "New Automation" modal
 │         ├── Trigger: New subscriber / Tag added / No open in N days / Date
 │         ├── Action: Send issue / Wait N days / Add tag / Remove tag
 │         └── Status: Active / Paused
 │
 └──→ Click automation  →  Automation detail
           ├── Visual trigger → action flow
           ├── Stats: enrolled, completed, in-progress
           └── "Edit" / "Pause" / "Delete"
```

### 7.8 Calendar Path

```
[/calendar]
 ├── View toggle: Month / Week
 ├── Filter: All newsletters / specific newsletter
 ├── Each cell shows issues (scheduled, published, draft)
 │     └──→ Click issue chip  →  side panel with issue summary + link to editor
 ├──→ Drag issue chip to reschedule
 └──→ Click empty date  →  "New Issue" modal with date pre-filled
```

### 7.9 Connections Paths

```
[/connections]
 │
 ├── EMAIL (Resend)
 │     ├── Status: Connected ✓ / Not configured
 │     ├── Sending domain: [domain] — SPF/DKIM status indicators
 │     └── "Configure domain" → DNS instructions
 │
 ├── WHATSAPP
 │     ├── Status: Connected / Not connected
 │     ├── "Connect" → Choose provider:
 │     │     ├── Meta Business API (direct)
 │     │     ├── Twilio
 │     │     └── 360dialog
 │     ├── Enter API credentials → verify → Connected ✓
 │     ├── Linked phone number displayed
 │     └── Opt-in settings: subscribers must provide phone number separately
 │
 ├── TELEGRAM
 │     ├── Status: Connected / Not connected
 │     ├── "Connect" → Enter Bot Token (from BotFather)
 │     │     └── Select channel or group → verify bot is admin → Connected ✓
 │     ├── Channel name displayed
 │     └── Format settings: full text / summary + link
 │
 ├── INSTAGRAM
 │     ├── Status: Connected / Not connected
 │     ├── "Connect" → OAuth with Meta Business account
 │     ├── Select Instagram Professional account
 │     ├── Connected ✓ — account displayed
 │     └── Post settings: caption style, hashtags, image template
 │
 ├── LINKEDIN
 │     ├── Status: Connected / Not connected
 │     ├── "Connect" → OAuth with LinkedIn (OpenID Connect + r_organization_social scope)
 │     ├── Select: Company Page or Personal Profile
 │     ├── Connected ✓ — page/profile name displayed
 │     └── Post settings: text format (short/long), article vs text post, hashtags
 │
 └── COMING SOON: X/Twitter, Slack
```

### 7.10 Analytics Paths

```
[/analytics]
 ├── Filter: Date range / Newsletter / Channel
 │
 ├── Summary Cards Row:
 │     ├── Total sends (this period)
 │     ├── Average open rate
 │     ├── Average click rate
 │     └── Total active subscribers
 │
 ├── Charts Section:
 │     ├── Subscriber growth (line chart, 30/90/365 days)
 │     ├── Open rate trend per newsletter (line chart)
 │     ├── Send volume over time (bar chart)
 │     ├── Best send day/time heatmap
 │     └── Channel comparison (email vs WhatsApp vs Telegram — bar chart)
 │
 └── Issues Table:
       └── Issue title / Date / Recipients / Delivered / Opened / Clicked / Rate
             └──→ Click row  →  [/newsletters/[id]/issues/[id]] (analytics view)
```

### 7.11 Team Paths

```
[/team]
 ├──→ "Invite Member" modal
 │         └── Email + Role  →  invitation email sent  →  pending badge shown
 │                   └──→ Invitee clicks link  →  [/invite/accept?token=xxx]
 │                               ├── If new user  →  signup flow  →  joins org
 │                               └── If existing  →  login  →  joins org
 │
 ├──→ Member row → Role dropdown (inline change)
 ├──→ Member row → "Remove" → confirm modal → removed
 └──→ Pending invitations tab → "Resend" / "Cancel"
```

### 7.12 Forms & Landing Pages Paths

```
[/forms]
 ├──→ "New Form" modal
 │         ├── Name, linked newsletter
 │         ├── Fields: email (required), name (optional), custom fields
 │         ├── Success message customization
 │         └──→  Creates: embeddable JS snippet + hosted page URL
 │
 └──→ Click form  →  Form detail
           ├── Stats: views, submissions, conversion rate
           ├── Embed code (copy snippet for website)
           ├── Hosted URL: /s/[newsletter-slug]?form=[id]
           └── "Edit" / "Duplicate" / "Archive"
```

### 7.13 Settings Paths

```
[/settings]
 ├── Tab: Profile
 │     └── Full name, avatar upload
 ├── Tab: Organization
 │     └── Name, logo, primary/accent color, default language, plan label
 ├── Tab: AI Provider
 │     └── Platform Claude / Own Anthropic / Own OpenAI / Own Gemini
 │           └── API key input (masked, toggle visibility, test connection button)
 ├── Tab: Email Sending
 │     └── From name, reply-to email, custom domain setup (DKIM/SPF guide)
 └── Tab: Notifications
       └── Email me when: issue approved / subscriber milestone / bounce spike
```

### 7.14 Billing Paths

```
[/billing]
 ├── Current plan card: Trial / Starter / Growth / Enterprise
 │     └── Usage meters: emails sent, AI polishes, subscribers, team seats
 ├── "Upgrade Plan" CTA  →  Plan comparison table  →  Stripe checkout
 ├── Payment method: card on file (last 4, expiry)
 │     └── "Update card"  →  Stripe hosted form
 └── Invoice history table
       └── Date / Amount / Status / Download PDF
```

### 7.15 Developers Paths

```
[/developers]
 ├── Tab: API Keys
 │     ├──→ "New API Key" → name → created (shown once, then masked)
 │     └──→ Key row → "Revoke"
 ├── Tab: Webhooks
 │     ├──→ "Add Endpoint" → URL + select events
 │     │     Events: issue.published / subscriber.added / subscriber.unsubscribed
 │     │             / email.bounced / email.opened / email.clicked
 │     ├── Test webhook button → sends sample payload
 │     └── Delivery log (last 50 attempts, status, response code)
 └── Tab: Documentation
       └── Link to hosted API docs (OpenAPI spec)
```

### 7.16 Admin Paths (superadmin only)

```
[/admin]
 ├── Tab: Overview
 │     └── Platform stats: total orgs, users, issues, sends (this month)
 ├── Tab: KPIs
 │     ├── Weekly Active Creators (WAC) — chart + current value + delta
 │     ├── Type of Communication Send Rate — stacked bar by channel
 │     ├── Referral Rate — % new orgs from referral link
 │     ├── AI Usage per User — avg polishes/editor/week
 │     ├── Subscriber Growth — net new subscribers MoM
 │     ├── Churn — cancelled/inactive orgs MoM %
 │     └── Revenue per Creator — MRR / active orgs
 ├── Tab: Organizations
 │     ├── List: name, plan, member count, newsletter count, created date
 │     ├──→ "Create Org" modal
 │     └──→ Click org  →  org detail (members, newsletters, usage, branding)
 ├── Tab: Users
 │     ├── List: email, name, orgs count, admin flag, created date
 │     ├──→ "Create User" modal
 │     └──→ Toggle admin flag
 ├── Tab: Sponsorships
 │     ├── List: campaign name, advertiser, status, flight dates, impressions, clicks, CTR
 │     ├──→ "New Campaign" modal (advertiser, CTA, URL, placement, budget, dates, targeting)
 │     ├──→ Campaign detail → assignment list (orgs/newsletters) + impression chart
 │     └──→ Revenue report: total ad revenue, creator payouts, platform share
 └── Tab: System
       └── Rate limit status, error rates, recent activity log
```

### 7.17 Public Pages

```
[/]  Marketing homepage
 ├── Hero section with gradient, product screenshot
 ├── Features section
 ├── Pricing section
 └── CTA → /signup

[/s/[newsletter-slug]]  Subscribe page
 ├── Newsletter name, description, sample issue preview
 └── Subscribe form (email, name optional)

[/s/[slug]/[issue-slug]]  Web archive
 ├── Rendered issue HTML (full email content)
 ├── Subscribe CTA in header
 └── Share buttons (Twitter/X, LinkedIn, copy link)

[/unsubscribe?token=xxx]
 └── One-click confirm → status updated → "You've been unsubscribed" message

[/invite/accept?token=xxx]
 ├── Shows: invited by [name] to join [org] as [role]
 ├── If not logged in → signup/login first → redirected back
 └── "Accept invitation" → joins org → [/dashboard]
```

---

## 8. Feature Specifications

### 8.1 Authentication

**Supported methods:**
- Email + password (primary)
- Magic link (passwordless email)
- OAuth: Google (Phase 2), GitHub (Phase 2)

**Session management:**
- Supabase session stored in HttpOnly, Secure, SameSite=Strict cookies
- Access token TTL: 1 hour; refresh token TTL: 7 days
- Refresh happens server-side transparently
- Logout invalidates both tokens server-side

**Password policy:**
- Minimum 12 characters
- At least 1 uppercase, 1 number, 1 special character
- Bcrypt hashing via Supabase Auth
- Password history: reject last 5 passwords on reset

**Account lockout:**
- 5 failed login attempts → 15-minute lockout
- Lockout state stored in Supabase (not client-side)
- Admin can manually unlock accounts

---

### 8.2 Onboarding

- 4-step wizard (org creation, first newsletter, invite, connect channel)
- Steps 3 and 4 are skippable
- Progress tracked in profile metadata
- Dashboard onboarding checklist widget shown until all P0 steps completed
- Completion tracked per-org (not per-user)

---

### 8.3 Dashboard

**Widgets:**
- Summary cards: newsletters count, total subscribers, issues this month, avg open rate
- Recent issues list (last 5, with status badges)
- Approval queue (issues in `pending_approval` — visible to admin/owner)
- Activity feed (last 10 events: publishes, new subscribers, approvals)
- Onboarding checklist (dismissible, hidden once all steps done)
- Quick actions: "New Issue", "Invite Member", "View Analytics"

---

### 8.4 Newsletters & Issues

**Newsletter properties:** name, description, slug, template, status (active/archived), branding overrides (from org defaults)

**Issue lifecycle:**
```
draft → pending_approval → approved → [scheduled | published]
                     ↑          |
                     └──────────┘ (back to draft)
```

**Issue editor features:**
- Raw notes input (textarea, markdown supported)
- AI Polish: calls `/api/ai/polish` → returns structured JSON
- Output fields: title, stories[], prompts[], hot_take
- Manual edit of all polished fields
- "Preview Email" modal: rendered HTML in browser
- Distribution panel: toggle channels per send
- Save draft auto-every 30 seconds
- Issue status badge (always visible)
- Keyboard shortcut `Cmd+S` to save

**AI Polish multi-provider:**
- Platform key (Claude Sonnet) — rate limited (10/org/hour)
- Own Anthropic, OpenAI, or Gemini key — no platform rate limit

---

### 8.5 Subscribers

**Fields per subscriber:** email, name, newsletter, tags[], status, source, subscribed_at, unsubscribed_at, bounce_type

**Subscriber sources:** manual, CSV import, subscribe form, API, Connections opt-in (WhatsApp/Telegram phone number linked separately)

**CSV Import:**
- Column mapping UI (drag headers to fields)
- Duplicate detection (email already exists → skip or update)
- Preview 10 rows before confirming
- Import report: added / skipped / errors

**Bulk actions:**
- Add/remove tag
- Move to segment
- Unsubscribe
- Export selected as CSV
- Delete (hard delete, requires confirmation)

---

### 8.6 Segments

**Segment types:**
- Static: manually curated list
- Dynamic: rule-based, auto-updates on each send

**Rule operators:** AND / OR between rules

**Rule conditions:**
- Subscribed to newsletter [X]
- Status is [active / unsubscribed / bounced]
- Tag [is / is not] [value]
- Opened [any of / none of] last [N] issues
- Clicked [any link / specific link] in last [N] issues
- Joined [before / after] [date]
- Source is [manual / CSV / form / API]

**Usage:** selectable as send target when publishing an issue (instead of full subscriber list)

---

### 8.7 Templates

**Platform templates (read-only):**
- Weekly Digest, Product Update, Company Announcement, AI Industry Roundup, Minimal Text
- Each has: name, description, preview image, `polished_json` structure preset

**My Templates:**
- Save any published issue as template (button in issue editor)
- Create from scratch
- Properties: name, description, structure JSON
- Actions: edit, duplicate, delete, set as default for newsletter

---

### 8.8 Automations

**Trigger types:**
- Subscriber joins newsletter
- Tag added to subscriber
- Subscriber has not opened in N days
- Specific date/time (one-shot or recurring)

**Action types:**
- Send a specific issue
- Wait N hours / days
- Add tag to subscriber
- Remove tag from subscriber
- Move to segment
- Send webhook (notify external system)

**Automation builder:**
- Visual flow: trigger → actions in sequence
- Each action has delay configuration
- Automations can be paused mid-run

**Stats per automation:**
- Enrolled (total subscribers ever entered)
- Completed (finished all steps)
- In progress (currently in flow)
- Exited early (unsubscribed during flow)

---

### 8.9 Calendar

**Views:** Month, Week  
**Filters:** All newsletters or specific newsletter  
**Issue states shown:** Draft (gray), Pending (yellow), Approved (blue), Scheduled (purple), Published (green)  
**Drag to reschedule:** updates `scheduled_at` on issue (only for scheduled issues)  
**Click empty cell:** opens "New Issue" modal with date pre-filled

---

### 8.10 Connections (Multi-Channel)

#### Email (Resend)
- Sending domain with SPF/DKIM verification guide
- From name and reply-to email per newsletter
- Bounce and complaint webhooks (auto-update subscriber status)
- Batch sending with rate limiting (Resend handles delivery queue)

#### WhatsApp
- Providers: Meta Business API (direct) / Twilio / 360dialog
- Subscribers must separately opt-in and provide phone number
- Message format: 160-char summary (AI-generated) + web archive link
- Delivery receipts: delivered, read
- Opt-out handled via WhatsApp's native opt-out → auto-unsubscribes in platform

#### Telegram
- Setup: Bot Token from BotFather + channel admin rights
- Message format options: full markdown text / short summary + link
- One channel per newsletter (or one shared org-wide channel)
- Delivery: Telegram Bot API, no read receipts

#### Instagram
- OAuth via Meta Business API
- Professional account required (Business or Creator)
- Post types: Feed post (caption = AI-generated from issue highlights) or Story (image template with headline)
- Image: auto-generated card (headline + org logo + gradient) or manual upload
- Hashtags: configurable per newsletter

#### LinkedIn
- OAuth 2.0 via LinkedIn API (scopes: `r_liteprofile`, `r_organization_social`, `w_member_social`, `w_organization_social`)
- Supports both **Company Pages** and **Personal Profiles**
- Post types: **Text post** (up to 3,000 chars, AI-generated from issue highlights) or **Article** (long-form, mirrors full issue content)
- Hashtags: configurable per newsletter (up to 5 recommended by LinkedIn algorithm)
- Engagement tracking: reactions, comments, shares, impressions (via LinkedIn Analytics API)
- One page/profile per newsletter (or shared org-wide page)

#### Distribution panel (in issue editor)
- Shows all connected channels with subscriber/reach counts
- Toggle per channel before sending
- "Send to all active channels" one-click option
- Post-send: status per channel (sent / failed / pending)

---

### 8.11 Analytics

**Metrics tracked:**
- Email: sent, delivered, opened (unique), clicked (unique), bounced, unsubscribed
- WhatsApp: delivered, read
- Telegram: sent (no read receipts)
- Instagram: reach, impressions, likes, comments, saves
- LinkedIn: impressions, reactions, comments, shares, clicks

**Dashboard charts:**
- Subscriber growth (line, by newsletter or org-wide)
- Open rate trend (line, last 10 issues)
- Send volume (bar, by week/month)
- Best send day/time (heatmap — days × hours, color = avg open rate)
- Channel comparison (bar — email vs WhatsApp vs Telegram reach per issue)
- Subscriber source breakdown (pie — form / CSV / API / manual)

**Issue-level analytics:**
- Full funnel: sent → delivered → opened → clicked
- Top clicked links table
- Subscriber-level: who opened, who clicked (admin/owner only)
- Geographic breakdown (Phase 2)

---

### 8.12 Team

**Roles and permissions matrix:**

| Action | Owner | Admin | Editor | Viewer |
|---|---|---|---|---|
| View newsletters/issues | ✅ | ✅ | ✅ | ✅ |
| Create/edit issues | ✅ | ✅ | ✅ | ❌ |
| Submit for approval | ✅ | ✅ | ✅ | ❌ |
| Approve issues | ✅ | ✅ | ❌ | ❌ |
| Publish / Send | ✅ | ✅ | ❌ | ❌ |
| Manage subscribers | ✅ | ✅ | ✅ | ❌ |
| View analytics | ✅ | ✅ | ✅ | ✅ |
| Manage connections | ✅ | ✅ | ❌ | ❌ |
| Manage team | ✅ | ✅ | ❌ | ❌ |
| Manage billing | ✅ | ❌ | ❌ | ❌ |
| Manage API keys | ✅ | ✅ | ❌ | ❌ |
| Delete org | ✅ | ❌ | ❌ | ❌ |

**Invitation flow:**
- Expires in 7 days
- One pending invite per email per org
- Invitee can create account if new user
- Invitation email includes org name, inviter name, role being assigned

---

### 8.13 Forms & Landing Pages

**Embeddable form:**
- JavaScript snippet (2KB, no dependencies)
- Configurable fields: email (required), name (optional), custom text fields
- CAPTCHA/bot protection: Cloudflare Turnstile (invisible challenge)
- Custom success redirect URL or inline thank-you message
- Styling: inherits org primary color, or fully custom CSS override

**Hosted subscribe page (`/s/[slug]`):**
- Auto-generated from org branding (logo, colors)
- Newsletter description, recent issue preview (latest published)
- Subscribe form embedded
- Open Graph meta tags for social sharing

**Stats per form:**
- Views (page loads)
- Submissions
- Conversion rate (submissions / views)
- Submissions over time (chart)

---

### 8.14 Settings

**Profile tab:** full name, avatar (upload to Supabase storage), email (view only)  
**Organization tab:** name (inline-editable from dashboard), logo, default language, timezone  
**Branding tab:** logo upload, favicon upload, primary color picker, accent color picker, heading font selector, custom footer text, "Remove Powered by" toggle (Growth+), live preview panel showing mock email + subscribe page with changes applied  
**AI Provider tab:** provider selection, API key management (AES-256 encrypted at rest), test connection  
**Email Sending tab:** from name, reply-to, custom domain setup (DKIM/SPF guide)  
**Notifications tab:** configurable email alerts (approval requests, subscriber milestones, bounce spikes)

---

### 8.15 Billing

**Plans:**

| Feature | Trial | Starter | Growth | Enterprise |
|---|---|---|---|---|
| Newsletters | 1 | 3 | 10 | Unlimited |
| Subscribers | 500 | 5,000 | 50,000 | Custom |
| Emails/month | 2,500 | 25,000 | 500,000 | Custom |
| AI polishes/month | 10 | 100 | 1,000 | Unlimited |
| Team seats | 2 | 5 | 20 | Unlimited |
| Channels | Email only | Email + Telegram | All channels | All channels |
| Custom domain | ❌ | ✅ | ✅ | ✅ |
| API access | ❌ | ❌ | ✅ | ✅ |
| SLA | ❌ | ❌ | ❌ | ✅ |

**Payment:** Stripe (subscriptions + one-time invoices)  
**Overage handling:** soft limit warnings at 80%, hard limit at 100%, upgrade prompt  
**Invoice download:** PDF via Stripe Customer Portal

---

### 8.16 Developers

**REST API:**
- Bearer token authentication (API key from `/developers` screen)
- Endpoints: newsletters, issues, subscribers, segments, sends
- Rate limit: 1,000 requests/hour per API key
- OpenAPI 3.1 spec hosted at `/api/docs`

**Webhooks:**
- HTTPS endpoint required
- Signed with HMAC-SHA256 (secret shown once on creation)
- Retry policy: 3 attempts with exponential backoff (1min, 5min, 30min)
- Events: `issue.published`, `subscriber.added`, `subscriber.unsubscribed`, `email.bounced`, `email.opened`, `email.clicked`, `automation.completed`
- Delivery log: last 50 events with response code and latency

---

### 8.17 Help & Docs

- In-app knowledge base (searchable articles)
- Onboarding video links (Loom embeds)
- Keyboard shortcuts reference
- Contact support form (creates Intercom/Linear ticket)
- System status page link (external)
- Changelog (last 10 releases)

---

### 8.18 Platform Admin

- Access controlled by `is_platform_admin` flag on `profiles`
- Separate nav group (not visible to regular users)
- Tabs: Overview, Organizations, Users, System
- Cannot be enabled via app UI — must be set directly in database by another admin
- All admin actions logged to `activity_logs` with `platform_admin` resource type

---

### 8.19 Public Pages

- `/` — Marketing homepage (Next.js static generation)
- `/s/[slug]` — Subscribe page (SSR, newsletter data from Supabase)
- `/s/[slug]/[issue-slug]` — Web archive (SSR, issue HTML)
- `/unsubscribe?token=xxx` — Token-based, no auth required
- `/invite/accept?token=xxx` — Token-based, requires auth (creates account if new)

All public pages: no cookies, no tracking pixels, no user session required.

---

### 8.20 CRM

Newsletter Studio embeds a lightweight but functional CRM so creators can manage their audience relationships without switching tools.

**Contact record (per subscriber):**
- Identity: email, full name, avatar (Gravatar fallback), company, job title, location
- Subscription history: which newsletters, joined date, status (active / unsubscribed / bounced)
- Engagement score: computed weekly from opens, clicks, and recency (0–100 scale, color-coded)
- Tags: freeform labels (e.g. "VIP", "cold", "prospect")
- Notes: internal freeform notes per contact (visible to team, not subscriber)
- Activity timeline: chronological feed of every email received, opened, clicked, unsubscribed

**CRM views:**
- **Contacts list** — searchable, filterable by newsletter / tag / status / engagement score / join date
- **Contact detail panel** — slide-over drawer with full timeline, notes, and quick actions
- **Engagement heatmap** — grid showing each subscriber's open history across the last 20 issues
- **Segments** — dynamic rules that auto-tag or group contacts (see 8.6)

**Quick actions from contact record:**
- Add/remove tags
- Add internal note
- Manually unsubscribe
- Move to segment
- View all issues they received and which they opened

**CRM in Admin Panel:**
- Platform admins can view aggregate CRM health across all orgs (total contacts, avg engagement score, churn risk count)
- Cannot view individual subscriber PII across orgs (each org's data is RLS-isolated)

**Data model additions:**
- `subscriber_notes(id, subscriber_id, author_id, body, created_at)`
- `subscriber_engagement_scores(subscriber_id, score, computed_at)` — updated nightly
- `crm_fields(id, org_id, label, field_type, required)` — custom fields per org

---

### 8.21 Sponsorship & Ads

Platform admins can sell and inject sponsorships into newsletters. This creates a revenue-sharing model between the platform and creators.

**Admin: Sponsorship management**

Located at **Admin → Sponsorships**:

- Create a sponsorship campaign: advertiser name, logo, CTA text, destination URL, budget, flight dates (start/end)
- Assign to: all orgs, specific orgs, or newsletters matching a tag/topic
- Choose placement: **Top banner** (above issue body), **Mid-roll** (after story 1), **Footer** (before unsubscribe link)
- Set frequency cap: max N injections per subscriber per flight
- Track: impressions, clicks, CTR, spend, CPM

**Creator: Sponsorship visibility**

- Creators see a **Sponsorships** tab on each newsletter's settings page
- Shows active campaigns injected into their newsletter: advertiser, dates, placement, estimated impressions
- Can opt out of specific campaigns (opt-out is logged; platform admin can enforce mandatory campaigns on free-tier orgs)
- Revenue share: % of ad revenue credited to creator's balance (configurable per plan in billing)

**Injection mechanism:**
- Sponsorship blocks are injected at send time by the email renderer — not stored in the issue body
- Rendered as a visually distinct, labeled block: `Sponsored by [Advertiser]`
- CAN-SPAM/GDPR compliant: clearly labeled as sponsored content
- Click tracking via redirect through platform domain before forwarding to advertiser URL

**Data model:**
- `sponsors(id, name, logo_url, contact_email, created_at)`
- `sponsorship_campaigns(id, sponsor_id, cta_text, url, placement, budget_cents, starts_at, ends_at, status)`
- `campaign_assignments(id, campaign_id, org_id, newsletter_id, opt_out_at)`
- `sponsorship_impressions(id, campaign_id, issue_id, subscriber_id, channel, clicked_at)`

---

### 8.22 Referral System

A built-in referral program lets creators grow their subscriber base by rewarding readers who bring new sign-ups.

**How it works (subscriber referral):**

1. Each active subscriber receives a unique referral link included in every email footer: `https://app.com/s/[slug]?ref=[subscriber_token]`
2. When someone subscribes via that link, the referral is attributed to the referring subscriber
3. The creator sees a **Referrals** tab on each newsletter showing: referrer email, referred email, date, status (subscribed / confirmed / churned)
4. Milestone rewards (configured by creator per newsletter):
   - Refer 1 → thank-you email
   - Refer 5 → exclusive content unlock (creator-defined)
   - Refer 10 → physical reward (creator-managed externally)

**Platform-level referral (creator acquisition):**

- Each org gets a unique platform referral link: `https://app.com/signup?ref=[org_token]`
- When a new org signs up via that link and activates a paid plan, the referring org earns a credit (configurable: e.g. $20 account credit per conversion)
- Admin → Referrals tab shows: referring org, referred org, conversion status, credit issued
- Fraud prevention: referred org must stay active 30 days before credit is issued

**Referral dashboard (per newsletter):**
- Total referrals generated
- Conversion rate (referred → confirmed subscriber)
- Top referrers leaderboard (top 10 subscribers by referral count)
- Reward milestone tracker per referrer

**Data model:**
- `referral_links(id, org_id, newsletter_id, subscriber_id, token, created_at)` — nullable `subscriber_id` = org-level link
- `referrals(id, link_id, referred_email, referred_subscriber_id, referred_org_id, converted_at, credit_issued_at)`
- `referral_rewards(id, newsletter_id, milestone, reward_type, reward_config JSONB, created_at)`

---

### 8.23 White-Label Branding

Each organization can customize the look of their public-facing pages and email templates to match their brand, replacing Newsletter Studio's default visual identity.

**Configurable brand elements (Settings → Organization → Branding):**

| Element | What it controls |
|---|---|
| Logo | Shown in email header, subscribe page header, web archive |
| Favicon | Tab icon for hosted public pages (`/s/[slug]`) |
| Primary color | Button backgrounds, link color, accent highlights in emails |
| Accent color | Badge colors, progress indicators |
| Font | Heading font for public pages (Google Fonts — limited selection) |
| Footer text | Custom footer copy replacing the default platform tagline |
| Custom domain (email from) | `From: newsletter@yourdomain.com` (requires DNS setup) |
| Remove "Powered by" badge | Available on Growth plan and above |

**Preview:**
- Live preview panel in Settings showing a mock email and subscribe page with the current brand applied
- Changes are applied to all future sends; past issues are not retroactively updated

**Email template theming:**
- Primary color cascades into button background, link underlines, and divider lines
- Logo is inserted at top of every email in a centered header block
- All colors are validated for WCAG AA contrast ratio before save (warn if contrast fails)

**Subscribe page theming:**
- `/s/[slug]` renders using org's primary color, logo, and font
- Open Graph image (for social sharing previews) is auto-generated with org logo + newsletter name on the primary-color background

**Admin view:**
- Platform admins can see each org's branding config in **Admin → Organizations → [Org] → Branding**
- Cannot override an org's branding (read-only for admins)

**Data model additions to `organizations`:**
```sql
ALTER TABLE organizations ADD COLUMN
  brand_logo_url        TEXT,
  brand_favicon_url     TEXT,
  brand_primary_color   TEXT DEFAULT '#7B5CF0',
  brand_accent_color    TEXT DEFAULT '#4F8EF7',
  brand_font            TEXT DEFAULT 'Inter',
  brand_footer_text     TEXT,
  brand_remove_badge    BOOLEAN DEFAULT false;
```

---

## 9. Security Architecture

### 9.1 Authentication & Session Security

| Control | Implementation |
|---|---|
| Session storage | HttpOnly + Secure + SameSite=Strict cookies only — never localStorage |
| CSRF protection | SameSite=Strict on session cookie + Supabase CSRF token on mutations |
| Token rotation | Access token (1hr TTL), refresh token (7 days TTL), rotated on each use |
| Brute force protection | 5 failed attempts → 15-minute account lockout (server-side counter) |
| Password strength | Min 12 chars, uppercase + number + special char, bcrypt hashing |
| Password reset | Expiring signed token (15-minute TTL), one-time use, invalidated after use |
| MFA | TOTP (Google Authenticator compatible) — Phase 2 |
| Session revocation | Logout invalidates server-side session immediately |

### 9.2 Authorization

| Control | Implementation |
|---|---|
| Multi-tenant isolation | Supabase Row-Level Security (RLS) on all tables — enforced at database level |
| Role enforcement | `org_role(org_id)` checked in RLS policies and server actions |
| Admin bypass | `is_platform_admin()` check — cannot be set via API, only direct DB |
| Server-side only | All authorization checks happen in server components/API routes, never client |
| API key scoping | API keys scoped to org — cannot access other orgs |
| Invitation tokens | UUID v4 token, 7-day expiry, single-use, org+email bound |
| Unsubscribe tokens | HMAC-signed token with subscriber ID + newsletter ID, no expiry |

### 9.3 Data Security

| Control | Implementation |
|---|---|
| AI API keys | AES-256-GCM encrypted at rest in Supabase — never returned to client |
| Connection credentials (WhatsApp/Telegram/Instagram) | AES-256-GCM encrypted — only decrypted server-side at send time |
| Stripe keys | Server-side only, never exposed to browser |
| Webhook signing secret | Shown once on creation, stored as HMAC key (not plaintext) |
| API keys | Shown once on creation, stored as bcrypt hash |
| PII in logs | Subscriber emails/names excluded from application logs |
| Database backups | Supabase daily backups, 30-day retention, encrypted |
| Storage | Supabase Storage (S3-compatible), private bucket for org assets, public bucket for issue images |

### 9.4 Input Validation & Injection Prevention

| Control | Implementation |
|---|---|
| Schema validation | Zod on all API route inputs — reject on first invalid field |
| SQL injection | Parameterized queries via Supabase client — no raw SQL concatenation |
| XSS prevention | All user content rendered via React (auto-escaping) — no `dangerouslySetInnerHTML` except for sanitized issue HTML |
| Issue HTML sanitization | DOMPurify on `html_email` / `html_web` before rendering or sending |
| File upload validation | MIME type + magic bytes check on CSV/image uploads |
| Slug validation | Regex `^[a-z0-9-]+$` enforced on newsletter and org slugs |
| Rate limiting | Per-org AI endpoint: 10 req/hr (platform key); per-IP login: 20 req/15min |
| Email validation | RFC 5322 regex + MX record check on subscribe form submissions |

### 9.5 Transport Security

| Control | Implementation |
|---|---|
| HTTPS | TLS 1.3 enforced — HTTP redirects to HTTPS at edge |
| HSTS | `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` |
| Security headers | `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` |
| CSP | `Content-Security-Policy` restricting script sources to self + Supabase + Stripe |
| CORS | API routes allow only app origin + developer API keys (no wildcard) |

### 9.6 Third-Party Integration Security

| Control | Implementation |
|---|---|
| WhatsApp credentials | Stored encrypted, used only at send time, never logged |
| Telegram bot token | Stored encrypted, webhook validation via secret token header |
| Instagram OAuth | Token stored encrypted, refresh token rotation |
| Resend API key | Server-side env var only (`RESEND_API_KEY`) |
| Webhook validation | Inbound Resend webhooks: HMAC-SHA256 signature verified before processing |
| Stripe webhooks | Stripe signature verified with `stripe.webhooks.constructEvent` |

### 9.7 Audit & Monitoring

| Control | Implementation |
|---|---|
| Activity log | All issue state changes, member changes, settings changes → `activity_logs` table |
| Admin actions | Platform admin actions logged with `platform_admin` actor type |
| API access log | Every API key request logged (key ID, endpoint, timestamp, response code) |
| Failed login log | Failed attempts logged with IP and timestamp (not stored with user record) |
| Webhook delivery log | All outbound webhook attempts: URL, status, response, latency |
| Error monitoring | Sentry integration (server + client) — PII excluded from error payloads |
| Alerting | PagerDuty alert on: error rate > 1%, delivery rate drop > 5%, auth lockout spike |

### 9.8 Compliance

| Standard | Status |
|---|---|
| GDPR | Subscriber data deletion on request, data export endpoint, consent recorded at subscribe |
| CAN-SPAM | Unsubscribe link in every email, physical address in footer, no deceptive subjects |
| CASL | Explicit opt-in required (no pre-checked boxes), consent timestamp stored |
| SOC 2 Type II | Target: Phase 3 |
| DMARC | Recommended setup guide for custom domains in sending settings |

### 9.9 Secrets & Environment Variables

```
# Authentication
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # server-side only

# Email
RESEND_API_KEY=                   # server-side only
RESEND_WEBHOOK_SECRET=            # server-side only
FROM_EMAIL=                       # ⚠️ PENDING — requires a verified sending domain in Resend
                                  # Fallback: onboarding@resend.dev (Resend's shared domain, dev/testing only)
                                  # Production: set to newsletter@yourdomain.com after DNS verification

# Encryption
ENCRYPTION_KEY=                   # 32-byte AES key for API key encryption

# Payments
STRIPE_SECRET_KEY=                # server-side only
STRIPE_WEBHOOK_SECRET=            # server-side only
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Monitoring
SENTRY_DSN=
SENTRY_AUTH_TOKEN=

# Feature Flags (Phase 2)
ENABLE_WHATSAPP=false
ENABLE_INSTAGRAM=false
```

---

## 10. Data Models

### Extended Schema (additions to existing)

```sql
-- Segments
CREATE TABLE segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  newsletter_id UUID REFERENCES newsletters(id) ON DELETE CASCADE, -- nullable = org-wide
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('static', 'dynamic')),
  rules JSONB, -- rule tree for dynamic segments
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Templates
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID, -- nullable = platform template
  name TEXT NOT NULL,
  description TEXT,
  structure JSONB NOT NULL, -- polished_json shape
  is_platform BOOLEAN DEFAULT false,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Automations
CREATE TABLE automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  newsletter_id UUID REFERENCES newsletters(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'paused', 'archived')),
  trigger_type TEXT NOT NULL, -- new_subscriber | tag_added | no_open | date
  trigger_config JSONB NOT NULL,
  steps JSONB NOT NULL, -- ordered array of {action, delay, config}
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE automation_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID REFERENCES automations(id) ON DELETE CASCADE,
  subscriber_id UUID REFERENCES subscribers(id) ON DELETE CASCADE,
  current_step INTEGER DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('in_progress', 'completed', 'exited')),
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE (automation_id, subscriber_id)
);

-- Connections
CREATE TABLE connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp', 'telegram', 'instagram')),
  status TEXT NOT NULL CHECK (status IN ('active', 'disconnected', 'error')),
  credentials JSONB NOT NULL, -- AES-256 encrypted blob
  config JSONB, -- non-secret config (channel name, phone number, etc.)
  connected_by UUID REFERENCES profiles(id),
  connected_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ,
  UNIQUE (org_id, channel)
);

-- Channel sends (per issue per channel)
CREATE TABLE channel_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id),
  channel TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at TIMESTAMPTZ,
  reach INTEGER, -- recipients / channel members
  external_id TEXT, -- Resend batch ID, Telegram message ID, etc.
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Forms
CREATE TABLE forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  newsletter_id UUID REFERENCES newsletters(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  fields JSONB NOT NULL, -- field definitions
  success_message TEXT,
  redirect_url TEXT,
  views INTEGER DEFAULT 0,
  submissions INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- API keys
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE, -- bcrypt of actual key
  key_prefix TEXT NOT NULL, -- first 8 chars for display
  created_by UUID REFERENCES profiles(id),
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  revoked_at TIMESTAMPTZ
);

-- Webhooks
CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL,
  secret_hash TEXT NOT NULL, -- HMAC key stored encrypted
  status TEXT NOT NULL CHECK (status IN ('active', 'disabled')),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID REFERENCES webhooks(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  payload JSONB NOT NULL,
  response_code INTEGER,
  response_body TEXT,
  latency_ms INTEGER,
  attempt INTEGER DEFAULT 1,
  delivered_at TIMESTAMPTZ DEFAULT now()
);

-- Subscriber tags
CREATE TABLE subscriber_tags (
  subscriber_id UUID REFERENCES subscribers(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  added_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (subscriber_id, tag)
);
```

---

## 11. API Surface

All endpoints require `Authorization: Bearer <api-key>` header (except public subscribe/unsubscribe).

```
GET    /api/v1/newsletters                    List newsletters
POST   /api/v1/newsletters                    Create newsletter
GET    /api/v1/newsletters/:id                Get newsletter
PATCH  /api/v1/newsletters/:id                Update newsletter

GET    /api/v1/newsletters/:id/issues         List issues
POST   /api/v1/newsletters/:id/issues         Create issue
GET    /api/v1/issues/:id                     Get issue
PATCH  /api/v1/issues/:id                     Update issue
POST   /api/v1/issues/:id/send                Send issue

GET    /api/v1/subscribers                    List subscribers (paginated)
POST   /api/v1/subscribers                    Add subscriber
GET    /api/v1/subscribers/:id                Get subscriber
PATCH  /api/v1/subscribers/:id                Update subscriber
DELETE /api/v1/subscribers/:id                Unsubscribe

GET    /api/v1/segments                       List segments
POST   /api/v1/segments                       Create segment

GET    /api/v1/analytics/overview             Org-wide metrics
GET    /api/v1/analytics/issues/:id           Issue-level metrics

POST   /api/v1/subscribe                      Public subscribe (no auth)
POST   /api/v1/unsubscribe                    Public unsubscribe via token (no auth)

POST   /api/ai/polish                         AI content polish (internal)
```

---

## 12. Infrastructure & Integrations

| Service | Role |
|---|---|
| **Vercel** | Hosting, Edge CDN, serverless functions |
| **Supabase** | PostgreSQL, Auth, Storage, RLS, Realtime |
| **Resend** | Email delivery, bounce/complaint webhooks |
| **Stripe** | Billing, subscriptions, invoices |
| **Meta Business API** | WhatsApp Business, Instagram posting |
| **Twilio / 360dialog** | Alternative WhatsApp provider |
| **Telegram Bot API** | Telegram channel posting |
| **LinkedIn API** | Company page / profile post and article publishing |
| **Cloudflare Turnstile** | Bot protection on subscribe forms |
| **Sentry** | Error monitoring (server + client) |
| **DOMPurify** | HTML sanitization before email send/render |
| **Vercel Cron** | Scheduled issue sends, automation step execution |

---

## 13. Phased Roadmap

> **Competitive benchmark:** Beehiiv is the primary reference point for feature parity. Gap items are marked with **[GAP]** to distinguish them from originally planned features.

### Phase 1 — Core Loop Complete (Current Sprint)
- [x] Auth, onboarding, newsletters, issues, AI polish
- [x] Team management, roles, invitations
- [x] Settings (org rename, AI provider)
- [ ] **Email send via Resend** (wire existing schema to actual delivery)
- [ ] **Public subscribe page** `/s/[slug]`
- [ ] **Unsubscribe flow** `/unsubscribe?token=xxx`
- [ ] **Subscriber management UI** (full CRUD + CSV import)
- [ ] **Email template renderer** (polished_json → responsive HTML)
- [ ] **Invite accept flow** `/invite/accept?token=xxx`
- [ ] **Bounce webhook handler** (Resend → auto-mark bounced)
- [ ] **[GAP] Merge tags** — personalize emails with `{{subscriber.first_name}}`, `{{subscriber.custom_field}}`
- [ ] **[GAP] Subscriber preference center** — let subscribers choose topics/frequency
- [ ] **[GAP] Migration importer** — import from Mailchimp, Substack, Ghost, ConvertKit via CSV or API

### Phase 2 — Growth & Multi-Channel
- [ ] Connections: Telegram
- [ ] Connections: WhatsApp
- [ ] Connections: LinkedIn (OAuth + post/article publishing)
- [ ] Calendar view
- [ ] Segments (dynamic rule-based)
- [ ] Automations (welcome series, re-engagement)
- [ ] Analytics dashboard (charts, heatmap, channel comparison incl. LinkedIn)
- [ ] Templates library (platform + org)
- [ ] Forms & embeddable subscribe widget (multiple layouts: inline, popup, sticky, slide-in; behavioral triggers: scroll depth, exit-intent, time on page)
- [ ] Billing (Stripe integration)
- [ ] A/B subject line testing (up to 4 variants, auto-winner)
- [ ] CRM (contact records, engagement score, notes, timeline)
- [ ] Referral system (subscriber referral links + creator acquisition referrals)
- [ ] White-label branding (logo, colors, font, footer, live preview)
- [ ] Platform Admin KPI dashboard (WAC, send rate, AI usage, churn, RPU)
- [ ] **[GAP] Paid subscriptions & paywalls** — creators charge readers for premium issues; full-post and mid-content paywalls; Stripe-powered (0% platform cut); multiple pricing tiers per newsletter
- [ ] **[GAP] Polls & surveys in emails** — voting polls, trivia blocks, multi-question surveys embedded in issues; real-time results dashboard; CSV export; response-based segmentation
- [ ] **[GAP] AI Social Helper** — auto-generate social media posts (LinkedIn, Instagram, X) from issue content in the creator's brand voice
- [ ] **[GAP] AI Translator** — one-click translation of a polished issue into another language; translated version saved as a variant issue
- [ ] **[GAP] Verified clicks** — bot-filtered click metrics using IP, user-agent, and click-pattern analysis; distinguish bot vs real clicks in analytics
- [ ] **[GAP] Version history** — every saved issue state is snapshotted; single-click restore; diff view between versions
- [ ] **[GAP] Custom subscriber fields** — org-defined extra fields (birthday, company, plan tier, etc.) collected on subscribe form and usable in segments, merge tags, and CRM
- [ ] **[GAP] Real-time collaborative editing** — multiple team members editing the same issue simultaneously with live cursor presence
- [ ] **[GAP] Recommendations network** — during subscribe flow, show the reader other newsletters on the platform they may like; cross-promotion opt-in; attribution tracking

### Phase 3 — Scale & Enterprise
- [ ] Connections: Instagram
- [ ] Connections: X/Twitter
- [ ] Sponsorship & Ads (admin campaign manager, mid-roll injection, revenue share)
- [ ] **[GAP] Direct sponsorship storefront** — creator-facing self-service ad sales: ad calendar, Stripe invoicing, verified click reporting; separate from platform ad network
- [ ] **[GAP] Ad network marketplace** — pre-negotiated sponsorship matching between advertisers and creators; CPM/CPC pricing; real-time offer surfacing by audience profile
- [ ] **[GAP] Native podcast hosting** — audio upload, RSS feed generation, distribution to Apple Podcasts / Spotify / Overcast; IAB analytics; private podcast feeds for paid subscribers
- [ ] **[GAP] Dynamic content blocks** — conditional email content based on subscriber segment, custom field value, or behavior (if subscriber tagged "premium" → show block A else block B); block-level if/then logic
- [ ] **[GAP] Digital product sales** — sell PDFs, courses, templates directly from newsletters; Stripe checkout; delivery via download link in email
- [ ] **[GAP] Website/blog builder** — each newsletter gets a full public website (not just web archive); drag-and-drop page builder; SEO-optimized article pages; Google Analytics integration; custom domain per newsletter
- [ ] Developers: API keys, webhooks, OpenAPI docs
- [ ] MFA (TOTP)
- [ ] Custom email domain with DMARC setup + smart domain warming
- [ ] SOC 2 Type II audit
- [ ] Geographic analytics
- [ ] Custom app domain per org (true white-label hosting)
- [ ] Help & Docs in-app knowledge base
- [ ] **[GAP] SSO (SAML/OIDC)** — enterprise single sign-on
- [ ] **[GAP] Dedicated sending IPs** — enterprise deliverability; separate IP reputation per org
- [ ] **[GAP] Boosts marketplace** — paid subscriber acquisition: creators pay to have their newsletter promoted in other newsletters' post-subscribe flows; verified subscriber billing only
- [ ] **[GAP] MCP integration** — expose newsletter data via Model Context Protocol so AI assistants (Claude, Cursor, Codex) can query subscribers, analytics, and issues directly

---

## 14. Open Questions

| # | Question | Owner | Decision needed by |
|---|---|---|---|
| 1 | WhatsApp provider: Meta direct vs Twilio vs 360dialog? Direct is cheapest at scale but requires Meta Business verification. | Ezra | Before Phase 2 kick-off |
| 2 | Stripe pricing tiers: finalize subscriber limits and prices per plan | Ezra | Before billing feature |
| 3 | Should Automations be Phase 2 or Phase 3? Adds significant backend complexity. | Ezra | Sprint planning |
| 4 | Instagram: Feed posts only, or also Stories and Reels? | Ezra | Before Connections Phase 2 |
| 5 | Email template: single standard layout or configurable block editor (like Beehiiv)? Block editor is a major scope increase. | Ezra | Before Phase 1 email send |
| 6 | Public API: included in Growth plan or Enterprise only? | Ezra | Before billing feature |
| 7 | Analytics: self-hosted (Supabase queries) or third-party (Mixpanel/PostHog)? | Ezra | Before Phase 2 analytics |
| 8 | Referral rewards: platform-managed (account credits) only, or support physical/digital rewards creator configures externally? | Ezra | Before Phase 2 referral build |
| 9 | Sponsorship revenue share %: fixed platform cut (e.g. 30%) or negotiable per org plan? | Ezra | Before Phase 3 sponsorship build |
| 10 | LinkedIn: personal profile posts or company page only? Personal requires individual OAuth per user, adding auth complexity. | Ezra | Before Phase 2 LinkedIn connection |
| 11 | White-label font: Google Fonts selector (limited, free) or allow custom font upload (complex, hosting cost)? | Ezra | Before Phase 2 branding build |
| 12 | Paid subscriptions: 0% platform cut (Beehiiv model, Stripe fees only) or platform takes a % cut (revenue share model)? | Ezra | Before Phase 2 billing |
| 13 | Polls/surveys: built in-house or integrate a third-party embed (Typeform, Tally)? In-house is differentiating; third-party is faster. | Ezra | Before Phase 2 interactive content |
| 14 | Newsletter website builder: build custom drag-and-drop (6+ months) or integrate an existing headless CMS (Ghost, Sanity) for Phase 3? | Ezra | Before Phase 3 web builder |
| 15 | Boosts marketplace: build from scratch (network effect problem with cold start) or partner with an existing newsletter ad network (e.g. Paved, Letterhead) for Phase 3? | Ezra | Before Phase 3 marketplace |
| 16 | Podcast hosting: build native (S3 + RSS feed) or white-label a provider (Transistor, Simplecast) for Phase 3? | Ezra | Before Phase 3 podcast feature |

---

*End of PRD v1.0 — Newsletter Studio*
