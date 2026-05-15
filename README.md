# Newsletter Studio

Multi-tenant newsletter SaaS with AI-powered content editing, team collaboration, automated sequences, and multi-provider email delivery. Built on Next.js, Supabase, and Resend.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Server Actions) |
| Database & Auth | Supabase (PostgreSQL + RLS + Auth) |
| Styling | Tailwind CSS v3 + Radix UI |
| AI | Anthropic Claude · OpenAI GPT-4o · Google Gemini |
| Email delivery | Resend (batch send, A/B testing, webhooks) |
| Job queue | Inngest (automation fan-out, scheduled sends) |
| Billing | Stripe |
| Icons | Lucide React |
| Language | TypeScript |

---

## Getting Started

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project
- A [Resend](https://resend.com) account

### 1. Install dependencies

```bash
npm install
```

### 2. Set environment variables

Copy into `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App URL (used in email links)
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Encryption key for secrets stored in the DB (32 bytes, hex)
# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
SETTINGS_ENCRYPTION_KEY=your_32_byte_hex_key

# Cron auth (set the same value in Vercel cron config)
CRON_SECRET=your_cron_secret
```

Additional keys can be set via environment variables **or** configured in the Admin → Platform Settings UI (encrypted at rest):

| Key | Description |
|---|---|
| `RESEND_API_KEY` | Resend API key for sending emails |
| `FROM_EMAIL` | Verified sender address (e.g. `hello@yourdomain.com`) |
| `RESEND_WEBHOOK_SECRET` | Verifies bounce/open/click webhooks from Resend |
| `PLATFORM_ANTHROPIC_API_KEY` | Shared Claude key for all orgs on the platform plan |
| `STRIPE_SECRET_KEY` | Stripe secret key for billing |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key for the upgrade page |
| `STRIPE_WEBHOOK_SECRET` | Verifies Stripe webhook events |
| `INNGEST_EVENT_KEY` | Sends events to Inngest (job queue) |
| `INNGEST_SIGNING_KEY` | Verifies Inngest webhook calls to `/api/inngest` |

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
app/
├── (app)/                    Authenticated app shell
│   ├── dashboard/            Overview + onboarding checklist
│   ├── issues/               Cross-newsletter issue view (all orgs)
│   ├── newsletters/          Newsletter & issue management
│   │   └── [id]/
│   │       ├── issues/       Issue editor (+ version history, AI polish)
│   │       └── settings/     Per-newsletter settings (template, embed)
│   ├── subscribers/          Subscriber list, CSV import, date-added column
│   ├── segments/             Audience segments — rule builder CRUD
│   ├── automations/          Trigger-based email sequences CRUD
│   ├── templates/            Platform templates + My Templates CRUD
│   ├── analytics/            Analytics dashboard
│   ├── calendar/             Content calendar
│   ├── connections/          Multi-channel connections
│   ├── forms/                Subscribe forms & embed widgets
│   ├── team/                 Team members & invitations
│   ├── settings/             Org · branding · AI provider · personal AI keys
│   ├── billing/              Stripe billing & plan management
│   ├── developers/           API keys & webhooks
│   └── admin/                Platform admin — orgs, users, settings, permissions
├── (auth)/                   Auth pages (login, signup, password reset)
├── api/
│   ├── ai/polish/            AI content polish (streaming-ready)
│   ├── cron/
│   │   ├── automations/      Automation enrollment runner (every 5 min)
│   │   └── scheduled-sends/  Scheduled issue dispatch (every 5 min)
│   ├── inngest/              Inngest job queue webhook
│   ├── issues/[id]/send/     Issue send (Resend batch + A/B)
│   ├── notifications/        In-app notification feed (GET + PATCH mark-read)
│   ├── webhooks/resend/      Bounce / open / click tracking
│   └── subscribe/            Public subscribe endpoint
├── invite/accept/            Invitation acceptance
├── s/[slug]/                 Public subscribe page & web archive
└── unsubscribe/              One-click unsubscribe

components/
├── app/                      App shell (sidebar, notification bell, onboarding checklist, editor)
└── ui/                       Design system primitives (button, badge, input…)

lib/
├── actions/                  Shared server actions (issues, automations, segments, templates, notifications)
├── ai/                       AI provider abstraction — Anthropic · OpenAI · Gemini
├── auth/                     Permission helpers (assertPermission, issue state machine)
├── billing/                  Plan limits & usage tracking
├── crypto/                   AES-256-GCM encryption for secrets
├── data/                     Data access helpers + unstable_cache wrappers
├── email/                    Template renderer, batch dispatch, unsubscribe tokens
├── platform/                 Platform settings (DB-stored, encrypted, env-var fallback)
├── supabase/                 Client factories (server, browser, admin)
├── types/                    TypeScript types & display helpers
└── utils.ts                  Shared utilities

supabase/migrations/          All DB migrations in chronological order
docs/
├── STRATEGY.md               Full product strategy, audit, and phase roadmap
└── PRD.md                    Product requirements document
```

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## Design System

Dark-first design. `:root` defines dark tokens; `.light` class overrides for light mode.

| Token | Color | Usage |
|---|---|---|
| `bg` | `#0A0A0F` | Page background |
| `surface` | `#111118` | Cards, panels |
| `elevated` | `#1A1A24` | Modals, inputs |
| `line` | `#2A2A38` | Borders |
| `ink` | `#F0F0F5` | Primary text |
| `ink-muted` | `#8888A0` | Secondary text |
| `accent` | `#7B5CF0` | Primary CTA (purple) |
| `success` | `#22C55E` | Published / active |
| `warning` | `#F59E0B` | Pending / scheduled |
| `danger` | `#EF4444` | Errors / bounced |

---

## Roles & Permissions

```
owner (5) > admin (4) > editor (3) > reviewer (2) > contributor (1) > viewer (0)
```

| Action | viewer | contributor | reviewer | editor | admin | owner |
|---|---|---|---|---|---|---|
| Read issues | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create / edit issues | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Submit for review | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Approve / reject | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ |
| Delete issues | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Send emails | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Manage subscribers | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Manage automations | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Invite / remove members | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Org AI & branding settings | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Personal AI keys | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Billing | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## AI Configuration

### Organization AI (Admin + Owner)

Set in **Settings → Organization AI Provider**. The selected key is shared across all team members for newsletter polish.

| Option | Description |
|---|---|
| Platform AI | Shared Claude key (rate-limited, no config needed) |
| Own Anthropic key | Unlimited via your Anthropic account (Claude Sonnet) |
| Own OpenAI key | GPT-4o, billed to your OpenAI account |
| Own Gemini key | Gemini 1.5 Pro, billed to your Google account |

### Personal AI Keys (Owner only)

Set in **Settings → Personal AI Keys**. Independent from the org — for personal workflows outside newsletter polish. Includes a live connection test button per provider.

---

## Issue Lifecycle

```
draft ──────────────────────────────────────► sent
  │                                             ▲
  ▼                                             │
pending_approval ──(approve)──► approved ──(send / schedule)
  │
  ▼
needs_revision ──(resubmit)──► pending_approval
```

Server-side transition validation via `lib/auth/issue-state.ts` blocks invalid state jumps.

---

## Notifications

In-app notification bell (sidebar + mobile bar). Polls `/api/notifications` every 30 seconds.

Events that generate notifications:

| Event | Who is notified |
|---|---|
| Issue submitted for review | All reviewers, admins, owners in the org |
| Issue approved | Issue author |
| Issue needs revision | Issue author |

---

## Cron Jobs

Configured in `vercel.json`, running every 5 minutes:

| Route | Purpose |
|---|---|
| `/api/cron/automations` | Process due automation enrollment steps |
| `/api/cron/scheduled-sends` | Dispatch issues with a past `scheduled_at` timestamp |

Secure with `CRON_SECRET` — Vercel sets the `Authorization: Bearer` header automatically.

---

## Phased Roadmap

### Phase 1 — Core Loop ✅
Auth, onboarding, org management, newsletters, issues with AI polish, team roles & invitations, public subscribe/unsubscribe, Resend batch send + A/B testing, subscriber CRUD + CSV import, bounce/open/click webhooks, issue version history.

### Phase 2 — Growth & Multi-Channel ✅
Segments (rule-based CRUD), automations (trigger-based sequences + enrollment engine), My Templates CRUD, global search (⌘K), analytics dashboard, content calendar, white-label branding (logo, colors).

### Phase 3 — Scale & Developer Platform ✅
RBAC enforcement (`assertPermission`), AES-256-GCM encryption for secrets, issue state machine validation, rate limiting on public subscribe endpoint, GIN trigram indexes, platform admin panel (orgs, users, permissions, activity log), Stripe settings.

### Phase 4 — Security & Authorization ✅
Full permission matrix wired into all server actions and API routes, `assertValidTransition` on issue status, Zod validation at API boundaries, subscriber email normalization.

### Phase 5 — Growth Infrastructure ✅
In-app notifications (bell + dropdown, 30s polling, mark read), onboarding checklist on dashboard (4 steps, collapsible, localStorage dismiss), `/issues` cross-newsletter view with filters, `unstable_cache` for org-level reads, GitHub Actions CI (typecheck + lint), personal AI keys for owners (Anthropic / OpenAI / Gemini, live test button), Inngest keys in Admin → Platform Settings.

### Phase 6 — Developer Platform (planned)
Personal API keys, public API v1 (`/api/v1/subscribers`, `/api/v1/issues`), outbound webhooks, GDPR data export + deletion.

### Phase 7 — Engagement & Virality (planned)
Engagement scoring, win-back automation template, referral program, subscriber growth chart.

### Phase 8 — AI Intelligence Layer (planned)
Streaming AI polish (SSE), content topic tagging, subscriber interest profiles, AI-generated segment suggestions.

---

## Security

- Authorization enforced via `assertPermission()` in all server actions + Supabase RLS at the DB level
- All org and personal API keys stored AES-256-GCM encrypted; never returned to the browser
- Session cookies: HttpOnly, Secure, SameSite=Strict
- Public subscribe endpoint rate-limited (Upstash)
- All user input validated with Zod at API boundaries
- Issue HTML sanitized before send/render

---

## License

Private — all rights reserved.
