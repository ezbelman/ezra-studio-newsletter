import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { IssueEditor } from '@/components/app/issue-editor'

interface Props { params: Promise<{ id: string; issueId: string }> }

export default async function IssueDetailPage({ params }: Props) {
  const { id, issueId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: issue }, { data: nl }] = await Promise.all([
    supabase
      .from('issues')
      .select('id, vol, title, status, issue_date, raw_notes, polished_json, created_at, updated_at')
      .eq('id', issueId)
      .eq('newsletter_id', id)
      .single(),
    supabase
      .from('newsletters')
      .select('id, name')
      .eq('id', id)
      .single(),
  ])

  if (!issue || !nl) notFound()

  return (
    <IssueEditor
      issue={issue}
      newsletterId={id}
      newsletterName={nl.name}
    />
  )
}
