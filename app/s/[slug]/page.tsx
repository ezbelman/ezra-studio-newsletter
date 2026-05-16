import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { SubscribeForm } from './subscribe-form'

interface Props {
  params:       Promise<{ slug: string }>
  searchParams: Promise<{ ref?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = createAdminClient()
  const { data: nl } = await supabase
    .from('newsletters')
    .select('name, description')
    .eq('slug', slug)
    .single()
  if (!nl) return { title: 'Subscribe' }
  return {
    title: `Subscribe to ${nl.name}`,
    description: nl.description ?? undefined,
  }
}

export default async function SubscribePage({ params, searchParams }: Props) {
  const { slug }  = await params
  const { ref }   = await searchParams
  const supabase = createAdminClient()

  const { data: nl } = await supabase
    .from('newsletters')
    .select('id, name, description, organizations(name, primary_color)')
    .eq('slug', slug)
    .eq('status', 'active')
    .single()

  if (!nl) notFound()

  const org = nl.organizations as { name: string; primary_color: string | null } | null
  const color = org?.primary_color ?? '#7B5CF0'

  /* Latest published issue for preview */
  const { data: latestIssue } = await supabase
    .from('issues')
    .select('title, published_at')
    .eq('newsletter_id', nl.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(1)
    .single()

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Top bar */}
      <header className="border-b border-line bg-surface/80 backdrop-blur-sm">
        <div className="max-w-xl mx-auto px-6 py-4 flex items-center gap-2">
          <div className="h-6 w-6 rounded gradient-accent flex items-center justify-center">
            <span className="text-white text-[9px] font-black">NS</span>
          </div>
          <span className="text-xs text-ink/40">{org?.name}</span>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="w-full max-w-md animate-fade-up">

          {/* Badge */}
          <div className="flex justify-center mb-6">
            <span className="px-3 py-1 rounded-full text-xs font-600 bg-accent/15 text-accent">
              Newsletter
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-700 text-ink text-center mb-3 leading-tight">
            {nl.name}
          </h1>
          {nl.description && (
            <p className="text-ink/50 text-center text-sm leading-relaxed mb-8">
              {nl.description}
            </p>
          )}

          {/* Latest issue teaser */}
          {latestIssue && (
            <div className="bg-surface border border-line rounded-xl p-4 mb-6 flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-accent text-xs font-700">✦</span>
              </div>
              <div>
                <p className="text-[11px] text-ink/30 mb-0.5">Latest issue</p>
                <p className="text-sm font-500 text-ink">{latestIssue.title}</p>
              </div>
            </div>
          )}

          {/* Subscribe form */}
          <SubscribeForm newsletterId={nl.id} newsletterName={nl.name} referralCode={ref} />

          <p className="text-center text-xs text-ink/25 mt-4">
            No spam. Unsubscribe any time.
          </p>
        </div>
      </main>
    </div>
  )
}
