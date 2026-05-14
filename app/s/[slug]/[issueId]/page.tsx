import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'

interface Story {
  headline: string
  bullets?: string[]
  takeaway?: string
}

interface PolishedContent {
  title: string
  stories?: Story[]
  prompts?: string[]
  hot_take?: string
}

interface Props {
  params: Promise<{ slug: string; issueId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { issueId } = await params
  const supabase = createAdminClient()
  const { data: issue } = await supabase
    .from('issues')
    .select('title, newsletters(name)')
    .eq('id', issueId)
    .eq('status', 'published')
    .single()
  if (!issue) return { title: 'Issue' }
  const nl = issue.newsletters as { name: string } | null
  return {
    title: issue.title ?? nl?.name ?? 'Issue',
    description: `Read ${issue.title ?? 'this issue'} from ${nl?.name ?? 'the newsletter'}`,
  }
}

export default async function IssueArchivePage({ params }: Props) {
  const { slug, issueId } = await params
  const supabase = createAdminClient()

  const { data: issue } = await supabase
    .from('issues')
    .select('id, title, published_at, polished_json, newsletter_id, newsletters(id, name, slug, organizations(name, primary_color))')
    .eq('id', issueId)
    .eq('status', 'published')
    .single()

  if (!issue) notFound()

  const nl  = issue.newsletters as { id: string; name: string; slug: string; organizations: { name: string; primary_color: string | null } } | null
  if (!nl || nl.slug !== slug) notFound()

  const org     = nl.organizations
  const color   = org?.primary_color ?? '#7B5CF0'
  const polished = issue.polished_json as unknown as PolishedContent | null

  const publishedDate = issue.published_at
    ? new Date(issue.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null

  return (
    <div className="min-h-screen bg-bg">
      {/* Top bar */}
      <header className="border-b border-line bg-surface/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href={`/s/${slug}`} className="flex items-center gap-2 group">
            <div className="h-6 w-6 rounded gradient-accent flex items-center justify-center">
              <span className="text-white text-[9px] font-black">NS</span>
            </div>
            <span className="text-xs text-ink/40 group-hover:text-ink/60 transition-colors">{org?.name}</span>
          </Link>
          <Link
            href={`/s/${slug}`}
            className="text-xs px-3 py-1.5 rounded-lg border border-line text-ink/50 hover:text-ink hover:border-accent/40 transition-colors"
          >
            Subscribe
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-6 py-14">
        {/* Issue header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-700 uppercase tracking-widest"
              style={{ backgroundColor: `${color}20`, color }}
            >
              {nl.name}
            </span>
            {publishedDate && (
              <span className="text-xs text-ink/30">{publishedDate}</span>
            )}
          </div>
          <h1 className="text-3xl font-display font-700 text-ink leading-tight">
            {issue.title ?? 'Untitled Issue'}
          </h1>
          <div className="mt-4 h-px" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
        </div>

        {/* Stories */}
        {polished ? (
          <div className="space-y-10">
            {polished.stories?.map((story, i) => (
              <article key={i} className="group">
                <h2 className="text-xl font-display font-700 text-ink mb-3 leading-snug">
                  {story.headline}
                </h2>
                {story.bullets && story.bullets.length > 0 && (
                  <ul className="space-y-2 mb-3">
                    {story.bullets.map((bullet, j) => (
                      <li key={j} className="flex items-start gap-3 text-sm text-ink/70 leading-relaxed">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                )}
                {story.takeaway && (
                  <div className="mt-4 pl-4 border-l-2" style={{ borderColor: `${color}40` }}>
                    <p className="text-xs text-ink/40 leading-relaxed">
                      <span className="font-700 text-ink/60">Why it matters: </span>
                      {story.takeaway}
                    </p>
                  </div>
                )}
                {i < (polished.stories?.length ?? 0) - 1 && (
                  <hr className="mt-10 border-line" />
                )}
              </article>
            ))}

            {polished.prompts && polished.prompts.length > 0 && (
              <div className="rounded-xl border border-line bg-elevated p-6">
                <p className="text-[10px] font-700 uppercase tracking-widest mb-4" style={{ color }}>
                  Prompts to explore
                </p>
                <ul className="space-y-3">
                  {polished.prompts.map((prompt, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-ink/70 leading-relaxed">
                      <span className="mt-1 text-ink/30">·</span>
                      {prompt}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {polished.hot_take && (
              <div className="rounded-xl border border-accent/20 bg-accent/5 p-6">
                <p className="text-[10px] font-700 uppercase tracking-widest text-accent mb-3">Hot Take</p>
                <p className="text-sm text-ink leading-relaxed italic">
                  &ldquo;{polished.hot_take}&rdquo;
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-ink/40 text-sm text-center py-20">No content available.</p>
        )}

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-line text-center">
          <p className="text-xs text-ink/30 mb-4">
            You received this from <strong className="text-ink/50">{org?.name}</strong>
          </p>
          <Link
            href={`/s/${slug}`}
            className="inline-flex items-center gap-2 text-xs px-4 py-2 rounded-lg border border-line text-ink/50 hover:text-ink hover:border-accent/40 transition-colors"
          >
            Subscribe to {nl.name}
          </Link>
        </div>
      </main>
    </div>
  )
}
