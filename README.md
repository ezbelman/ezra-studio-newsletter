# Newsletter Studio

Multi-tenant newsletter platform with AI-powered content editing, team collaboration, and multi-channel distribution. Built on Next.js, Supabase, and the Anthropic API.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Server Actions) |
| Database & Auth | Supabase (PostgreSQL + RLS + Auth) |
| Styling | Tailwind CSS v3 + Radix UI |
| AI | Anthropic Claude (platform key or bring your own) |
| Email delivery | Resend |
| Icons | Lucide React |
| Language | TypeScript |

---

## Getting Started

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project
- A [Resend](https://resend.com) account (for email delivery)

### 1. Install dependencies

```bash
npm install
```

### 2. Set environment variables

Copy the example below into a `.env.local` file at the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Email delivery (Resend)
RESEND_API_KEY=re_...

# AI — platform shared key (Claude)
PLATFORM_ANTHROPIC_API_KEY=sk-ant-...

# Encryption key for storing org API keys at rest (32 random bytes, hex)
ENCRYPTION_KEY=your_32_byte_hex_key
```

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
app/
├── (app)/                  Authenticated app shell
│   ├── dashboard/          Overview dashboard
│   ├── newsletters/        Newsletter & issue management
│   │   └── [id]/
│   │       ├── issues/     Issue editor
│   │       └── settings/   Per-newsletter settings
│   ├── subscribers/        Subscriber management
│   ├── team/               Team members & invitations
│   ├── settings/           Org & AI provider settings
│   ├── admin/              Platform admin (superadmin only)
│   ├── analytics/          Analytics (Phase 2)
│   ├── calendar/           Content calendar (Phase 2)
│   ├── connections/        Multi-channel connections (Phase 2)
│   ├── segments/           Audience segments (Phase 2)
│   ├── automations/        Email automations (Phase 2)
│   ├── templates/          Template library (Phase 2)
│   ├── billing/            Billing (Phase 2)
│   └── developers/         API keys & webhooks (Phase 3)
├── (auth)/                 Unauthenticated auth pages
│   ├── login/
│   ├── signup/
│   ├── forgot-password/
│   └── reset-password/
├── api/                    API routes
│   ├── ai/polish/          AI content polish endpoint
│   ├── issues/[id]/send/   Issue send endpoint (Resend)
│   └── subscribe/          Public subscribe endpoint
├── invite/accept/          Invitation acceptance
├── s/[slug]/               Public subscribe page & web archive
└── unsubscribe/            One-click unsubscribe

components/
├── app/                    App-specific components (sidebar, editor, theme)
└── ui/                     Design system primitives (button, badge, input…)

lib/
├── ai/                     AI provider abstraction (Anthropic / OpenAI / Gemini)
├── data/                   Data access helpers
├── email/                  Email template renderer & token utilities
├── supabase/               Supabase client factories (server, client, admin)
├── types/                  TypeScript types & display helpers
└── utils.ts                Shared utilities
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

The app uses a **dark-first** design system. The `:root` defines dark colors and the `.light` class overrides them for light mode.

Key Tailwind tokens:

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

| Action | Owner | Admin | Editor | Viewer |
|---|---|---|---|---|
| View newsletters & issues | ✅ | ✅ | ✅ | ✅ |
| Create & edit issues | ✅ | ✅ | ✅ | ❌ |
| Approve issues | ✅ | ✅ | ❌ | ❌ |
| Publish & send | ✅ | ✅ | ❌ | ❌ |
| Manage subscribers | ✅ | ✅ | ✅ | ❌ |
| Manage team | ✅ | ✅ | ❌ | ❌ |
| Rename organization | ✅ | ✅ | ❌ | ❌ |
| Configure AI provider | ✅ | ✅ | ❌ | ❌ |
| Manage billing | ✅ | ❌ | ❌ | ❌ |

---

## AI Provider Configuration

Organizations can choose their AI backend in **Settings → AI Provider**:

| Option | Description |
|---|---|
| Platform AI | Shared Claude key (rate-limited, no config needed) |
| Own Anthropic key | Unlimited via your Anthropic account |
| Own OpenAI key | Uses GPT-4o, billed to your OpenAI account |
| Own Gemini key | Uses Gemini 1.5 Pro, billed to your Google account |

Keys are stored AES-256 encrypted server-side and never returned to the browser.

---

## Issue Lifecycle

```
draft → pending_approval → approved → published
                ↑               |
                └───────────────┘  (back to draft)
```

---

## Phased Roadmap

### Phase 1 — Core Loop (current)
- [x] Auth, onboarding, org management
- [x] Newsletters & issues with AI polish
- [x] Team roles & invitations
- [x] Settings (org rename, AI provider)
- [x] Public subscribe page & unsubscribe flow
- [ ] Email send via Resend (wired to UI)
- [ ] Subscriber management CRUD + CSV import
- [ ] Invite accept flow

### Phase 2 — Growth & Multi-Channel
- [ ] Analytics dashboard
- [ ] Content calendar
- [ ] Segments (rule-based)
- [ ] Automations (welcome series, re-engagement)
- [ ] Connections: Telegram, WhatsApp, LinkedIn
- [ ] Template library
- [ ] Billing (Stripe)
- [ ] CRM (contact records, engagement scoring, notes)
- [ ] Referral system (subscriber + creator acquisition)
- [ ] White-label branding (logo, colors, font per org)
- [ ] Platform Admin KPI dashboard

### Phase 3 — Scale & Enterprise
- [ ] Connections: Instagram, X/Twitter
- [ ] Sponsorship & Ads (admin campaign manager, revenue share)
- [ ] Developer API & webhooks
- [ ] MFA (TOTP)
- [ ] SOC 2 Type II audit

---

## Security

- All authorization enforced via Supabase Row-Level Security at the database level
- Session cookies: HttpOnly, Secure, SameSite=Strict
- API keys shown once on creation, stored as bcrypt hashes
- Org AI keys encrypted AES-256-GCM at rest
- All user input validated with Zod at API boundaries
- Issue HTML sanitized with DOMPurify before send/render

See `PRD.md` Section 9 for the full security architecture.

---

## License

Private — all rights reserved.
