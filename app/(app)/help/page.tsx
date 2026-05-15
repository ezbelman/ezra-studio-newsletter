import { BookOpen, MessageCircle, ExternalLink, Search, Keyboard } from 'lucide-react'

export const metadata = { title: 'Help & Docs' }

const ARTICLES = [
  {
    category: 'Getting Started',
    items: [
      'Create your first newsletter',
      'Invite team members and set roles',
      'Connect your first channel',
      'Publish your first issue',
    ],
  },
  {
    category: 'AI & Content',
    items: [
      'How AI Polish works',
      'Bring your own AI key (Anthropic, OpenAI, Gemini)',
      'Writing effective raw notes for better AI output',
      'Saving issues as reusable templates',
    ],
  },
  {
    category: 'Subscribers',
    items: [
      'Import subscribers via CSV',
      'Create dynamic segments',
      'Set up a public subscribe page',
      'Managing unsubscribes and bounces',
    ],
  },
  {
    category: 'Connections',
    items: [
      'Connect WhatsApp Business',
      'Set up a Telegram bot',
      'Configure Resend for email delivery',
      'Setting up custom sending domain (DKIM/SPF)',
    ],
  },
]

const SHORTCUTS = [
  { keys: ['Cmd', 'K'],      action: 'Global search' },
  { keys: ['Cmd', 'S'],      action: 'Save draft' },
  { keys: ['Cmd', 'Enter'],  action: 'Submit for approval' },
  { keys: ['Cmd', '/'],      action: 'Toggle AI Polish' },
  { keys: ['?'],             action: 'Show keyboard shortcuts' },
]

export default function HelpPage() {
  return (
    <div className="p-4 sm:p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-600 text-ink">Help & Docs</h1>
        <p className="text-ink/50 text-sm mt-0.5">Guides, shortcuts, and support resources</p>
      </div>

      {/* Search */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-ink/30" />
        <input
          type="text"
          placeholder="Search documentation..."
          className="w-full pl-10 pr-4 py-3 bg-surface border border-line rounded-xl text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:border-accent/50 transition-colors"
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Articles */}
        <div className="col-span-2 space-y-6">
          {ARTICLES.map(section => (
            <div key={section.category}>
              <p className="text-xs font-600 uppercase tracking-widest text-ink/30 mb-3">
                {section.category}
              </p>
              <div className="space-y-1">
                {section.items.map(item => (
                  <a
                    key={item}
                    href="#"
                    className="flex items-center gap-3 px-4 py-2.5 bg-surface border border-line rounded-lg hover:border-accent/40 hover:bg-elevated transition-all group text-sm text-ink/70 hover:text-ink"
                  >
                    <BookOpen className="h-3.5 w-3.5 text-ink/20 group-hover:text-accent transition-colors shrink-0" />
                    {item}
                    <ExternalLink className="h-3 w-3 text-ink/15 group-hover:text-ink/40 ml-auto transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Contact support */}
          <div className="bg-surface border border-line rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle className="h-4 w-4 text-accent" />
              <p className="text-sm font-600 text-ink">Contact Support</p>
            </div>
            <p className="text-xs text-ink/40 mb-4">
              Get help from the team. We typically respond within 24 hours.
            </p>
            <button className="w-full py-2 rounded-lg gradient-accent text-white text-sm font-500 hover:opacity-90 transition-opacity">
              Open ticket
            </button>
          </div>

          {/* Keyboard shortcuts */}
          <div className="bg-surface border border-line rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Keyboard className="h-4 w-4 text-ink/40" />
              <p className="text-sm font-600 text-ink">Keyboard shortcuts</p>
            </div>
            <div className="space-y-2">
              {SHORTCUTS.map(({ keys, action }) => (
                <div key={action} className="flex items-center justify-between">
                  <span className="text-xs text-ink/50">{action}</span>
                  <div className="flex items-center gap-1">
                    {keys.map((k, i) => (
                      <span key={i} className="px-1.5 py-0.5 bg-elevated border border-line rounded text-[10px] font-mono text-ink/50">
                        {k}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* System status */}
          <div className="bg-surface border border-line rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-600 text-ink">System status</p>
              <span className="flex items-center gap-1 text-success text-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                All systems go
              </span>
            </div>
            <a
              href="#"
              className="text-xs text-accent hover:text-accent/80 transition-colors flex items-center gap-1"
            >
              View status page
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {/* Changelog */}
          <div className="bg-surface border border-line rounded-xl p-5">
            <p className="text-sm font-600 text-ink mb-3">Recent updates</p>
            <div className="space-y-2">
              {[
                { v: 'v1.3', date: 'May 2026',   note: 'Multi-channel Connections' },
                { v: 'v1.2', date: 'Apr 2026',   note: 'Segments & Automations' },
                { v: 'v1.1', date: 'Mar 2026',   note: 'AI Polish improvements' },
              ].map(c => (
                <div key={c.v} className="flex items-baseline gap-2">
                  <code className="text-[10px] font-mono text-accent/60 shrink-0">{c.v}</code>
                  <p className="text-xs text-ink/50 truncate">{c.note}</p>
                  <span className="text-[10px] text-ink/20 shrink-0 ml-auto">{c.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
