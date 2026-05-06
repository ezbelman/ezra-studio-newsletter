import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FileText, Plus, Copy, ExternalLink, BarChart2 } from 'lucide-react'

export const metadata = { title: 'Forms' }

export default async function FormsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id, organizations(slug)')
    .eq('user_id', user.id)
    .single()

  const { data: newsletters } = membership
    ? await supabase
        .from('newsletters')
        .select('id, name, slug')
        .eq('org_id', membership.org_id)
        .eq('status', 'active')
    : { data: [] }

  const orgSlug = (membership?.organizations as { slug: string } | null)?.slug

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-600 text-ink">Forms</h1>
          <p className="text-ink/50 text-sm mt-0.5">Embeddable subscribe forms and hosted landing pages</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-accent text-white text-sm font-500 hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" />
          New Form
        </button>
      </div>

      {/* Newsletter subscribe pages */}
      {newsletters && newsletters.length > 0 ? (
        <div>
          <h2 className="text-sm font-600 text-ink mb-4">Subscribe pages</h2>
          <div className="space-y-3 mb-10">
            {newsletters.map(nl => (
              <div key={nl.id} className="bg-surface border border-line rounded-xl p-5 flex items-center gap-4">
                <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4 text-accent" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-600 text-ink mb-0.5">{nl.name}</p>
                  <p className="text-xs text-ink/40 font-mono truncate">
                    /s/{nl.slug}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-center px-4">
                    <p className="text-sm font-600 text-ink">—</p>
                    <p className="text-[11px] text-ink/30">Views</p>
                  </div>
                  <div className="text-center px-4">
                    <p className="text-sm font-600 text-ink">—</p>
                    <p className="text-[11px] text-ink/30">Signups</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line text-xs text-ink/50 hover:text-ink hover:border-accent/40 transition-colors"
                    title="Copy embed code"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Embed
                  </button>
                  <a
                    href={`/s/${nl.slug}`}
                    target="_blank"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line text-xs text-ink/50 hover:text-ink hover:border-accent/40 transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    View
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-surface border border-dashed border-line rounded-xl p-10 text-center mb-10">
          <FileText className="h-10 w-10 text-ink/15 mx-auto mb-3" />
          <p className="text-sm font-500 text-ink/40 mb-1">No newsletters yet</p>
          <p className="text-xs text-ink/30 mb-4">Create a newsletter first to get a subscribe page</p>
          <a
            href="/newsletters"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg gradient-accent text-white text-sm font-500 hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" />
            Create Newsletter
          </a>
        </div>
      )}

      {/* Embed code section */}
      <div className="bg-surface border border-line rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-600 text-ink">Embed on your website</p>
            <p className="text-xs text-ink/40 mt-0.5">Add this snippet anywhere on your site</p>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line text-xs text-ink/50 hover:text-ink transition-colors">
            <Copy className="h-3.5 w-3.5" />
            Copy
          </button>
        </div>
        <pre className="bg-elevated rounded-lg p-4 text-xs font-mono text-ink/60 overflow-x-auto">
{`<script src="https://studio.ezrastudio.com/embed.js"
  data-newsletter="your-newsletter-slug"
  data-theme="dark">
</script>`}
        </pre>
      </div>

      {/* Analytics teaser */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        {[
          { label: 'Total form views', value: '—' },
          { label: 'Total signups',    value: '—' },
          { label: 'Conversion rate',  value: '—' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-surface border border-line rounded-xl p-4 text-center">
            <p className="text-xl font-700 text-ink">{value}</p>
            <p className="text-xs text-ink/40 mt-0.5">{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
