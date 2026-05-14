import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getCurrentOrgId } from '@/lib/data/org'
import { Layout, Eye } from 'lucide-react'
import Link from 'next/link'
import { NewTemplateDialog } from './new-template-dialog'
import { DeleteTemplateButton } from './delete-template-button'

export const metadata = { title: 'Templates' }

interface SearchParams { tab?: string }

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

export default async function TemplatesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const orgId = await getCurrentOrgId(supabase, user.id)
  if (!orgId) redirect('/onboarding')

  const { tab } = await searchParams
  const activeTab = tab === 'my' ? 'my' : 'platform'

  const { data: myTemplates } = await supabase
    .from('templates')
    .select('*')
    .eq('org_id', orgId)
    .eq('is_platform', false)
    .order('created_at', { ascending: false })

  const orgTemplates = myTemplates ?? []

  return (
    <div className="p-4 sm:p-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-600 text-ink">Templates</h1>
          <p className="text-ink/50 text-sm mt-0.5">Start from a proven layout or save your own</p>
        </div>
        {activeTab === 'my' && <NewTemplateDialog />}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-elevated rounded-lg w-fit mb-8">
        {[
          { label: 'Platform Templates', value: 'platform' },
          { label: `My Templates${orgTemplates.length > 0 ? ` (${orgTemplates.length})` : ''}`, value: 'my' },
        ].map(t => (
          <Link
            key={t.value}
            href={t.value === 'platform' ? '/templates' : '/templates?tab=my'}
            className={`px-4 py-1.5 rounded-md text-sm font-500 transition-colors ${
              activeTab === t.value
                ? 'bg-surface text-ink shadow-card'
                : 'text-ink/40 hover:text-ink'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Platform Templates tab */}
      {activeTab === 'platform' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {PLATFORM_TEMPLATES.map(tmpl => (
            <div key={tmpl.id} className="bg-surface border border-line rounded-xl overflow-hidden hover:border-accent/40 transition-colors group">
              <div className={`h-32 sm:h-36 ${tmpl.preview} relative flex items-center justify-center`}>
                <div className="w-24 space-y-1.5 opacity-60">
                  {tmpl.sections.map(s => (
                    <div key={s} className="h-2 bg-ink/20 rounded-full" style={{ width: `${60 + s.length * 3}%` }} />
                  ))}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-surface/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3 gap-2">
                  <button className="flex items-center gap-1.5 px-3 py-1.5 bg-surface/90 backdrop-blur-sm rounded-lg text-xs font-500 text-ink hover:bg-surface transition-colors">
                    <Eye className="h-3.5 w-3.5" />
                    Preview
                  </button>
                  <Link
                    href="/newsletters"
                    className="flex items-center gap-1.5 px-3 py-1.5 gradient-accent rounded-lg text-xs font-500 text-white hover:opacity-90 transition-opacity"
                  >
                    Use this
                  </Link>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-600 text-ink">{tmpl.name}</p>
                  <span className="px-1.5 py-0.5 bg-accent/10 text-accent rounded text-[10px] font-600 shrink-0">Platform</span>
                </div>
                <p className="text-xs text-ink/40 mb-3">{tmpl.desc}</p>
                <div className="flex flex-wrap gap-1">
                  {tmpl.sections.map(s => (
                    <span key={s} className="px-1.5 py-0.5 bg-elevated rounded text-[10px] text-ink/50">{s}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* My Templates tab */}
      {activeTab === 'my' && (
        <>
          {orgTemplates.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {orgTemplates.map(tmpl => (
                <div key={tmpl.id} className="bg-surface border border-line rounded-xl overflow-hidden hover:border-accent/40 transition-colors group">
                  <div className="h-32 sm:h-36 bg-gradient-to-br from-accent/10 to-accent-blue/10 relative flex items-center justify-center">
                    <div className="w-24 space-y-1.5 opacity-40">
                      {[70, 90, 55].map((w, i) => (
                        <div key={i} className="h-2 bg-ink/30 rounded-full" style={{ width: `${w}%` }} />
                      ))}
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-600 text-ink">{tmpl.name}</p>
                      <DeleteTemplateButton id={tmpl.id} />
                    </div>
                    {tmpl.description && (
                      <p className="text-xs text-ink/40">{tmpl.description}</p>
                    )}
                    <p className="text-[10px] text-ink/25 mt-2">
                      {new Date(tmpl.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-surface border border-dashed border-line rounded-xl p-10 sm:p-14 text-center">
              <Layout className="h-10 w-10 text-ink/15 mx-auto mb-3" />
              <p className="text-sm font-500 text-ink/40 mb-1">No custom templates yet</p>
              <p className="text-xs text-ink/30 mb-6">
                Create a blank template or save any published issue as a template from the issue editor.
              </p>
              <NewTemplateDialog />
            </div>
          )}
        </>
      )}
    </div>
  )
}
