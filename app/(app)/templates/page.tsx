import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Layout, Plus, Eye, Copy, Trash2 } from 'lucide-react'

export const metadata = { title: 'Templates' }

const PLATFORM_TEMPLATES = [
  {
    id: 'weekly-digest',
    name: 'Weekly Digest',
    desc: 'Curated links and insights for your community',
    sections: ['Top Stories', 'Quick Takes', 'Hot Take'],
    preview: 'bg-gradient-to-br from-accent/20 to-accent-blue/20',
  },
  {
    id: 'product-update',
    name: 'Product Update',
    desc: "What's new, what's improved, what's coming next",
    sections: ["What's New", 'Improvements', 'Coming Soon'],
    preview: 'bg-gradient-to-br from-success/20 to-accent-blue/20',
  },
  {
    id: 'announcement',
    name: 'Announcement',
    desc: 'Big news deserves a clean, focused format',
    sections: ['Headline', 'Details', 'Call to Action'],
    preview: 'bg-gradient-to-br from-warning/20 to-success/20',
  },
  {
    id: 'ai-roundup',
    name: 'AI Industry Roundup',
    desc: 'Curated AI news, research, and tools',
    sections: ['Research Papers', 'Tools', 'Hot Take'],
    preview: 'bg-gradient-to-br from-instagram/20 to-accent/20',
  },
  {
    id: 'minimal-text',
    name: 'Minimal Text',
    desc: 'Pure prose — no frills, maximum focus',
    sections: ['Opening', 'Body', 'Closing'],
    preview: 'bg-gradient-to-br from-ink/5 to-ink/10',
  },
]

export default async function TemplatesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-600 text-ink">Templates</h1>
          <p className="text-ink/50 text-sm mt-0.5">Start from a proven layout or save your own</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-accent text-white text-sm font-500 hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" />
          New Template
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-elevated rounded-lg w-fit mb-8">
        {['Platform Templates', 'My Templates'].map((tab, i) => (
          <button
            key={tab}
            className={`px-4 py-1.5 rounded-md text-sm font-500 transition-colors ${
              i === 0
                ? 'bg-surface text-ink shadow-card'
                : 'text-ink/40 hover:text-ink'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Platform templates grid */}
      <div className="grid grid-cols-3 gap-5">
        {PLATFORM_TEMPLATES.map(tmpl => (
          <div key={tmpl.id} className="bg-surface border border-line rounded-xl overflow-hidden hover:border-accent/40 transition-colors group">
            {/* Preview area */}
            <div className={`h-36 ${tmpl.preview} relative flex items-center justify-center`}>
              <div className="w-24 space-y-1.5 opacity-60">
                {tmpl.sections.map(s => (
                  <div key={s} className="h-2 bg-ink/20 rounded-full" style={{ width: `${60 + Math.random() * 40}%` }} />
                ))}
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-surface/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3 gap-2">
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-surface/90 backdrop-blur-sm rounded-lg text-xs font-500 text-ink hover:bg-surface transition-colors">
                  <Eye className="h-3.5 w-3.5" />
                  Preview
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 gradient-accent rounded-lg text-xs font-500 text-white hover:opacity-90 transition-opacity">
                  Use this
                </button>
              </div>
            </div>

            {/* Info */}
            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-sm font-600 text-ink">{tmpl.name}</p>
                <span className="px-1.5 py-0.5 bg-accent/10 text-accent rounded text-[10px] font-600 shrink-0">
                  Platform
                </span>
              </div>
              <p className="text-xs text-ink/40 mb-3">{tmpl.desc}</p>
              <div className="flex flex-wrap gap-1">
                {tmpl.sections.map(s => (
                  <span key={s} className="px-1.5 py-0.5 bg-elevated rounded text-[10px] text-ink/50">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* My templates empty state */}
      <div className="mt-10 bg-surface border border-dashed border-line rounded-xl p-10 text-center">
        <Layout className="h-10 w-10 text-ink/15 mx-auto mb-3" />
        <p className="text-sm font-500 text-ink/40 mb-1">No custom templates yet</p>
        <p className="text-xs text-ink/30 mb-4">
          After publishing an issue, use "Save as template" to reuse its structure
        </p>
        <button className="px-4 py-2 rounded-lg border border-line text-sm text-ink/60 hover:text-ink hover:border-accent/40 transition-colors">
          Create from scratch
        </button>
      </div>
    </div>
  )
}
