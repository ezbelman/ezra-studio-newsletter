# Newsletter Studio — User Manual

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Dashboard](#2-dashboard)
3. [Creating a Newsletter](#3-creating-a-newsletter)
4. [Writing an Issue](#4-writing-an-issue)
5. [AI Polish](#5-ai-polish)
6. [Approval Workflow](#6-approval-workflow)
7. [Sending an Issue](#7-sending-an-issue)
8. [Subscribers](#8-subscribers)
9. [Segments](#9-segments)
10. [Templates](#10-templates)
11. [Automations](#11-automations)
12. [Team Management](#12-team-management)
13. [Settings](#13-settings)
14. [Roles & What Each Can Do](#14-roles--what-each-can-do)

> **Mobile support** — Newsletter Studio works on Android and iOS browsers. All pages adapt to small screens: tables collapse to card layouts, dialogs slide up from the bottom, and action buttons stack vertically on narrow viewports.

---

## 1. Getting Started

### Sign up

1. Go to the app and click **Get started** or navigate to `/signup`.
2. Enter your email address and a password (minimum 12 characters).
3. Check your inbox and click the verification link.

### Create your organization

After verifying your email you land on the onboarding wizard:

1. **Organization name** — this is your workspace name (e.g. "Acme Corp"). You can rename it later.
2. **Create your first newsletter** — give it a name and a short description.
3. **Invite teammates** (optional, you can skip and do this later).
4. **Connect a channel** (optional, skip for now).

Click **Finish** to reach your dashboard.

---

## 2. Dashboard

The dashboard gives you a snapshot of your workspace at a glance.

### Header

- **Greeting** — shows your name and today's date.
- **Organization name** — visible next to the date. If you are an owner or admin, hover over it and click the pencil icon to rename your workspace inline.
- **New newsletter** — shortcut button to create a new publication.

### Stats row (when you have content)

| Card | What it shows |
|---|---|
| Subscribers | Total active subscribers across all newsletters |
| Newsletters | Number of publications you manage |
| Published | Total issues sent |
| In progress | Issues currently in draft, pending approval, or approved |

### Recent issues

A list of the 7 most recently created issues with their status badge, newsletter name, and creation date. Click any row to open the issue editor.

### Quick actions

Shortcuts to the most common tasks: New newsletter, Manage subscribers, Invite a teammate, Configure AI.

### First time (empty state)

If you have not created a newsletter yet, you see a guided checklist instead of the stats. Follow the three steps to get set up.

---

## 3. Creating a Newsletter

A **newsletter** is a publication channel (e.g. "Weekly Product Update"). Each newsletter contains multiple **issues** (individual editions).

1. Go to **Newsletters** in the sidebar, or click **New newsletter** from the dashboard.
2. Fill in:
   - **Name** — the publication title your subscribers will see.
   - **Description** — a short summary of what you cover.
   - **Slug** — the URL-safe identifier (auto-generated, editable). Used in your public subscribe page (`/s/your-slug`).
3. Click **Create newsletter**.

You land on the newsletter detail page with an **Issues** tab and a **Settings** link.

---

## 4. Writing an Issue

1. Open a newsletter and click **New issue**.
2. Fill in:
   - **Title** — the edition headline.
   - **Volume / Issue number** (optional) — shown as a label in the issue list.
   - **Raw notes** — paste your unformatted notes, bullet points, or draft text here.
3. Click **Create issue** to open the full issue editor.

### Issue editor

The editor has two main areas:

- **Raw notes** (left / top) — the unpolished input you provide.
- **Polished output** (right / below) — the AI-generated or manually edited fields: title, stories, highlights, hot take.

You can manually edit any polished field at any time. Changes are saved automatically every 30 seconds, or press **Cmd/Ctrl + S** to save immediately.

---

## 5. AI Polish

AI Polish takes your raw notes and transforms them into structured, publication-ready copy in seconds.

1. Enter your raw notes in the editor.
2. Click the **Polish with AI** button.
3. Wait a few seconds. The polished fields (title, stories, highlights, hot take) fill in automatically.
4. Review and tweak anything you want to change.

The AI provider used depends on your organization's settings:

- **Platform AI** — the default. Uses a shared Claude key. Rate-limited to 10 polishes per organization per hour.
- **Your own key** — configure an Anthropic, OpenAI, or Gemini key in Settings to remove the platform rate limit.

---

## 6. Approval Workflow

Every issue follows this lifecycle before it can be sent:

```
Draft → Pending Approval → Approved → Published
```

### Submitting for approval (Editor / Admin / Owner)

1. Open the issue editor.
2. When you are happy with the content, click **Submit for approval**.
3. The issue status changes to **Pending approval**. Admins and owners are notified.

### Approving or rejecting (Admin / Owner only)

1. Open the issue (you can find pending issues in the **Recent issues** list on the dashboard or by browsing the newsletter's Issues tab).
2. Review the content.
3. Click **Approve** to move it to the **Approved** state — it is now ready to send.
4. Click **Back to draft** to return it to the editor for revisions.

Editors cannot approve their own issues. A second set of eyes is always required.

---

## 7. Sending an Issue

Only **Approved** issues can be sent.

1. Open an approved issue.
2. Click **Send now**.
3. The distribution panel shows your connected channels (email, and future channels like Telegram / WhatsApp). Toggle which channels to include.
4. Confirm — the issue is sent and its status changes to **Published**.

A web-archive version of the issue is automatically available at `/s/[newsletter-slug]/[issue-slug]`.

---

## 8. Subscribers

### Viewing subscribers

Go to **Subscribers** in the sidebar to see all active subscribers across your organization. Each row shows the email, name, subscribed newsletter, status badge, and a **Date Added** column with the exact subscription date and a relative time label (e.g., "3d ago").

### Filtering

Use the filter bar to narrow the list by:
- **Search** — email or name (partial match)
- **Newsletter** — show subscribers of a specific publication
- **Status** — Active, Unsubscribed, or Bounced

### Adding a subscriber manually

1. Click **Add subscriber**.
2. Enter the subscriber's email, name (optional), and select the newsletter.
3. Click **Add**.

### Importing a CSV

1. Click **Import CSV**.
2. Upload a `.csv` file with at least an `email` column. A `name` column is also supported.
3. Select the target newsletter.
4. Click **Import**. Duplicate emails are silently skipped.

### Public subscribe page

Each newsletter has an auto-generated subscribe page at:

```
https://your-app.com/s/[newsletter-slug]
```

Share this URL to let readers subscribe themselves. No account required.

### Unsubscribing

Every email sent includes an unsubscribe link. When a reader clicks it they are taken to a confirmation page and immediately removed — no login required.

You can also manually unsubscribe from the Subscribers page using the **Unsubscribe** button on each active subscriber row.

---

## 9. Segments

Go to **Segments** in the sidebar to group subscribers by behavior, tags, or subscription date. Segments are used when sending an issue to target a specific audience instead of your full list.

### Segment types

| Type | Description |
|---|---|
| **Dynamic** | Rules are evaluated on every send. Subscribers automatically enter or exit. |
| **Static** | No rules — acts as a named placeholder for manual curation (future: manual add/remove). |

### Creating a segment

1. Click **New Segment**.
2. Enter a name and optional description.
3. Add one or more rules:
   - **Status is** active / unsubscribed / bounced
   - **Newsletter is** [select newsletter]
   - **Joined before / after** [date]
   - **Tag is / is not** [tag name]
4. Click **Create segment**.

### Deleting a segment

Click the trash icon on any segment row. This only removes the segment definition — no subscribers are affected.

---

## 10. Templates

Go to **Templates** in the sidebar to browse reusable issue structures.

### Platform Templates

Five built-in templates created by the Newsletter Studio team:

| Template | Best for |
|---|---|
| Weekly Digest | Curated stories + hot take |
| Product Update | Feature releases and improvements |
| Announcement | Big news in a focused format |
| AI Industry Roundup | Curated AI news and tools |
| Minimal Text | Pure prose, no structure |

Hover over a platform template and click **Use this** → you will be directed to pick a newsletter and create a new issue pre-filled with that structure.

### My Templates

Click the **My Templates** tab to see templates your organization has created.

**Creating a template from scratch:**
1. Click **New template** (visible when on the My Templates tab).
2. Enter a name and optional description.
3. Click **Create template**. You can populate its structure from the issue editor later.

**Saving an issue as a template:**
Open any published issue in the issue editor and click **Save as template** to capture its current `polished_json` structure for reuse.

**Deleting a template:**
Click the trash icon on any My Templates card.

---

## 11. Automations

Go to **Automations** in the sidebar to set up trigger-based email sequences that run automatically for new or existing subscribers.

### How automations work

1. A **trigger** fires when a condition is met (e.g., a new subscriber joins).
2. Each subscriber is **enrolled** in the automation.
3. The automation processes **steps** in sequence, sending emails with configurable delays.

### Trigger types

| Trigger | When it fires |
|---|---|
| New subscriber joins | Immediately when someone subscribes |
| Tag added | When a specific tag is added to a subscriber |
| No opens in N days | When a subscriber hasn't opened in a while |
| Scheduled date | At a specific date and time |

### Creating an automation

1. Click **New Automation**.
2. Name the automation and select the target newsletter.
3. Choose a trigger type.
4. Add one or more steps — each step is an email with a subject, body, and optional delay (in hours after the previous step).
5. Click **Create automation**. New automations start in **Paused** state.

### Activating / pausing

Click the ▶ (Play) or ⏸ (Pause) icon on each automation card to toggle its status. Only **Active** automations enroll new subscribers.

### Stats

Each automation card shows:
- **Enrolled** — total subscribers ever entered the sequence
- **Completed** — subscribers who finished all steps

### Deleting an automation

Click the trash icon. Subscribers already in the flow are not affected.

---

## 12. Team Management

Go to **Team** in the sidebar.

### Inviting a teammate

1. Click **Invite member**.
2. Enter their email address and select a role (see [Roles](#14-roles--what-each-can-do)).
3. Click **Send invite**.

They receive an email invitation. If they do not have an account yet, they can create one when accepting. Invitations expire after 7 days.

### Changing a role

Click the role badge next to a member's name and select a new role from the dropdown. Changes take effect immediately.

### Removing a member

Click the **···** menu next to a member and select **Remove**. They lose access immediately.

---

## 13. Settings

Go to **Settings** in the sidebar.

### Organization name

You can rename your organization from two places:

- **Dashboard header** — hover over the org name next to the date and click the pencil icon. Type the new name and press Enter or click the check button.
- **Settings page → Organization section** — enter the new name and click **Save changes**.

Both require Owner or Admin role.

### AI Provider

In the **AI Provider** section you can choose how AI polish is powered:

| Option | When to use |
|---|---|
| Platform AI (included) | Default. No setup needed. Rate-limited at 10 polishes/org/hour. |
| My Claude key (Anthropic) | Unlimited polishes billed to your Anthropic account. |
| My OpenAI key | Uses GPT-4o, billed to your OpenAI account. |
| My Gemini key (Google) | Uses Gemini 1.5 Pro, billed to your Google account. |

To add a key:
1. Select your preferred provider.
2. Enter your API key in the field that appears.
3. Click **Save AI settings**.

Keys are stored encrypted on the server and never shown in full again. You can replace a key at any time by clicking **Replace**.

---

## 14. Roles & What Each Can Do

| Action | Owner | Admin | Editor | Viewer |
|---|---|---|---|---|
| View newsletters & issues | ✅ | ✅ | ✅ | ✅ |
| View analytics | ✅ | ✅ | ✅ | ✅ |
| Create & edit issues | ✅ | ✅ | ✅ | ❌ |
| Use AI Polish | ✅ | ✅ | ✅ | ❌ |
| Submit issue for approval | ✅ | ✅ | ✅ | ❌ |
| Manage subscribers | ✅ | ✅ | ✅ | ❌ |
| Create / delete segments | ✅ | ✅ | ✅ | ❌ |
| Create / delete templates | ✅ | ✅ | ✅ | ❌ |
| Approve issues | ✅ | ✅ | ❌ | ❌ |
| Publish & send issues | ✅ | ✅ | ❌ | ❌ |
| Create / manage automations | ✅ | ✅ | ❌ | ❌ |
| Manage team (invite, remove, change roles) | ✅ | ✅ | ❌ | ❌ |
| Rename organization | ✅ | ✅ | ❌ | ❌ |
| Configure AI provider | ✅ | ✅ | ❌ | ❌ |
| Manage connections (Telegram, WhatsApp…) | ✅ | ✅ | ❌ | ❌ |
| Manage billing | ✅ | ❌ | ❌ | ❌ |
| Delete organization | ✅ | ❌ | ❌ | ❌ |

**Owner** — the person who created the organization. There is exactly one owner per workspace.

**Admin** — full editorial and operational access, but cannot touch billing or delete the org.

**Editor** — can write and submit issues for review, manage subscribers, but cannot approve or send.

**Viewer** — read-only access. Useful for stakeholders who need visibility without the ability to make changes.

---

## Status Badge Reference

| Badge | Meaning |
|---|---|
| **Draft** | Issue is being written. Only the author and admins can see it. |
| **Pending approval** | Submitted and waiting for an admin or owner to review. |
| **Approved** | Cleared for sending. |
| **Published** | Sent to subscribers. A web-archive version is live. |

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| Cmd/Ctrl + S | Save issue |

---

*Newsletter Studio — User Manual v1.1 — Updated 2026-05-14*
