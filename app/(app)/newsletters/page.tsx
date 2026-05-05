import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, Newspaper, Zap } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { IssueStatus } from '@/lib/types/database'
import { getCurrentOrgId } from '@/lib/data/org'

export const metadata = { title: 'Newsletters' }

export default async function NewslettersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const orgId = await getCurrentOrgId(supabase, user.id)
  if (!orgId) redirect('/onboarding')

  const { data: newsletters } = await supabase
    .from('newsletters')
    .select(`id, name, description, slug, status, created_at, issues(id, status)`)
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })

  const isEmpty = !newsletters || newsletters.length === 0

  return (
    <div className="p-8 max-w-5xl mx-auto">

      <div className="flex items-center justify-between mb-8 animate-fade-up delay-0">
        <div>
          <p className="text-xs font-700 uppercase tracking-widest text-ink-muted mb-1">Publications</p>
          <h1 className="text-3xl font-display font-700 text-ink leading-none">Newsletters</h1>
        </div>
        {!isEmpty && (
          <Button variant="primary" asChild>
            <Link href="/newsletters/new">
              <Plus className="h-4 w-4" />
              New Newsletter
            </Link>
          </Button>
        )}
      </div>

      {isEmpty ? (
        <div className="animate-scale-in delay-100">
          {/* Atmospheric empty state */}
          <div className="relative overflow-hidden rounded-xl border border-line bg-white p-12 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan/4 via-transparent to-lime/4 pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-48 bg-gradient-to-r from-transparent via-cyan/40 to-transparent" />

            <div className="relative">
              <div className="h-16 w-16 rounded-xl bg-navy-deep/5 border border-navy/8 flex items-center justify-center mx-auto mb-5">
                <Zap className="h-7 w-7 text-navy-muted" />
              </div>
              <h2 className="text-xl font-display font-700 text-ink mb-2">Start publishing</h2>
              <p className="text-ink-muted text-sm leading-relaxed max-w-sm mx-auto mb-8">
                A newsletter is your publication channel. Create one, then add issues — Claude will polish your raw notes into professional copy.
              </p>
              <Button variant="primary" size="lg" asChild>
                <Link href="/newsletters/new">
                  <Plus className="h-4 w-4" />
                  Create Newsletter
                </Link>
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {newsletters.map((nl, i) => {
            const issues    = nl.issues as { id: string; status: IssueStatus }[] | null ?? []
            const published = issues.filter(issue => issue.status === 'published').length
            const inProgress = issues.filter(issue => ['draft','pending_approval','approved','scheduled'].includes(issue.status)).length
            const isFirst   = i === 0

            return (
              <Link
                key={nl.id}
                href={`/newsletters/${nl.id}`}
                className={`
                  animate-fade-up block group
                  ${i === 0 ? 'delay-100' : i === 1 ? 'delay-150' : i === 2 ? 'delay-200' : 'delay-250'}
                `}
              >
                {isFirst ? (
                  /* Hero card — first newsletter gets more prominence */
                  <div className="relative overflow-hidden rounded-xl bg-navy-deep text-white p-7 hover:shadow-[0_8px_40px_rgba(13,27,62,0.2)] transition-shadow">
                    <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-cyan/10 blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-lime/8 blur-2xl pointer-events-none" />
                    <div className="absolute top-0 right-0 h-px w-32 bg-gradient-to-l from-transparent via-cyan/30 to-transparent" />

                    <div className="relative flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="h-9 w-9 rounded-lg bg-cyan/15 border border-cyan/20 flex items-center justify-center shrink-0">
                            <Newspaper className="h-4.5 w-4.5 text-cyan" />
                          </div>
                          <Badge variant="published" className="bg-lime/20 text-lime border-0">
                            {nl.status}
                          </Badge>
                        </div>
                        <h2 className="text-lg font-display font-700 leading-tight mb-1">{nl.name}</h2>
                        {nl.description && (
                          <p className="text-white/50 text-sm line-clamp-1">{nl.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="relative mt-5 flex items-center gap-5 text-xs text-white/40">
                      <span className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-lime" />
                        <span className="text-white/70 font-600">{published}</span> published
                      </span>
                      {inProgress > 0 && (
                        <span className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-cyan/50" />
                          <span className="text-white/70 font-600">{inProgress}</span> in progress
                        </span>
                      )}
                      <span className="ml-auto">{formatDate(nl.created_at)}</span>
                    </div>
                  </div>
                ) : (
                  /* Regular card */
                  <div className="flex items-center gap-5 rounded-lg border border-line bg-white px-6 py-5 hover:border-navy/20 hover:shadow-card transition-all">
                    <div className="h-9 w-9 rounded-lg bg-bg border border-line flex items-center justify-center shrink-0">
                      <Newspaper className="h-4 w-4 text-ink-muted" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-700 text-ink truncate">{nl.name}</h3>
                      <p className="text-xs text-ink-muted mt-0.5">
                        {published} published · {formatDate(nl.created_at)}
                      </p>
                    </div>
                    <Badge variant={nl.status === 'active' ? 'published' : 'draft'}>
                      {nl.status}
                    </Badge>
                  </div>
                )}
              </Link>
            )
          })}

          {/* Add new CTA at bottom */}
          <div className="animate-fade-up delay-300">
            <Link
              href="/newsletters/new"
              className="flex items-center gap-3 rounded-lg border border-dashed border-line px-6 py-5 text-sm text-ink-muted hover:border-navy/20 hover:text-ink transition-all"
            >
              <div className="h-9 w-9 rounded-lg border border-dashed border-line flex items-center justify-center shrink-0">
                <Plus className="h-4 w-4" />
              </div>
              Add another newsletter
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
