import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, Clock } from 'lucide-react'
import { RestoreVersionButton } from './restore-version-button'

interface Props { params: Promise<{ id: string; issueId: string }> }

export default async function VersionsPage({ params }: Props) {
  const { id, issueId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: issue }, { data: versions }] = await Promise.all([
    supabase
      .from('issues')
      .select('id, title')
      .eq('id', issueId)
      .eq('newsletter_id', id)
      .single(),
    supabase
      .from('issue_versions')
      .select('id, version_number, title, created_at, profiles!created_by(full_name)')
      .eq('issue_id', issueId)
      .order('version_number', { ascending: false }),
  ])

  if (!issue) notFound()

  return (
    <div className="p-4 sm:p-8 max-w-3xl">
      <Link
        href={`/newsletters/${id}/issues/${issueId}`}
        className="inline-flex items-center gap-2 text-sm text-ink/40 hover:text-ink mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {issue.title ?? 'Untitled Issue'}
      </Link>

      <h1 className="text-[22px] font-display font-700 text-ink mb-1">Version history</h1>
      <p className="text-sm text-ink/40 mb-6 sm:mb-8">
        Each polish creates a snapshot. Restore any version to roll back.
      </p>

      {versions && versions.length > 0 ? (
        <div className="space-y-3">
          {versions.map((v, idx) => {
            const profile   = v.profiles as { full_name: string | null } | null
            const isLatest  = idx === 0
            const createdAt = new Date(v.created_at).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric',
            })
            return (
              <div
                key={v.id}
                className={`bg-surface border rounded-xl p-4 sm:p-5 flex items-center gap-4 ${
                  isLatest ? 'border-accent/30' : 'border-line'
                }`}
              >
                <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <Clock className="h-4 w-4 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-600 text-ink">Version {v.version_number}</p>
                    {isLatest && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-700 bg-accent/10 text-accent border border-accent/20">
                        Latest
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink/40 mt-0.5 truncate">
                    {v.title ?? 'Untitled'} · {createdAt}
                    {profile?.full_name ? ` · ${profile.full_name}` : ''}
                  </p>
                </div>
                {!isLatest && (
                  <RestoreVersionButton
                    versionId={v.id}
                    issueId={issueId}
                    newsletterId={id}
                  />
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-surface border border-dashed border-line rounded-xl p-10 sm:p-14 text-center">
          <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <Clock className="h-5 w-5 text-accent" />
          </div>
          <p className="text-sm font-500 text-ink mb-1">No versions yet</p>
          <p className="text-xs text-ink/40">
            Polish the issue to create your first version snapshot.
          </p>
        </div>
      )}
    </div>
  )
}
