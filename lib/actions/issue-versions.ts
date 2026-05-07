'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentOrgId } from '@/lib/data/org'
import { revalidatePath } from 'next/cache'

export async function saveIssueVersion(issueId: string): Promise<{ success?: boolean; versionNumber?: number; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const orgId = await getCurrentOrgId(supabase, user.id)
  if (!orgId) return { error: 'No organization found' }

  const { data: issue } = await supabase
    .from('issues')
    .select('id, title, raw_notes, polished_json')
    .eq('id', issueId)
    .eq('org_id', orgId)
    .single()

  if (!issue) return { error: 'Issue not found' }

  const { count } = await supabase
    .from('issue_versions')
    .select('id', { count: 'exact', head: true })
    .eq('issue_id', issueId)

  const versionNumber = (count ?? 0) + 1

  const admin = createAdminClient()
  const { error } = await admin.from('issue_versions').insert({
    issue_id:       issueId,
    org_id:         orgId,
    version_number: versionNumber,
    title:          issue.title ?? null,
    raw_notes:      issue.raw_notes ?? null,
    polished_json:  issue.polished_json ?? null,
    created_by:     user.id,
  })

  if (error) return { error: error.message }
  return { success: true, versionNumber }
}

export async function restoreVersion(
  versionId: string,
  issueId: string,
  newsletterId: string,
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const orgId = await getCurrentOrgId(supabase, user.id)
  if (!orgId) return { error: 'No organization found' }

  const { data: version } = await supabase
    .from('issue_versions')
    .select('title, raw_notes, polished_json')
    .eq('id', versionId)
    .eq('org_id', orgId)
    .single()

  if (!version) return { error: 'Version not found' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('issues')
    .update({
      title:         version.title ?? null,
      raw_notes:     version.raw_notes ?? null,
      polished_json: version.polished_json ?? null,
    })
    .eq('id', issueId)
    .eq('org_id', orgId)

  if (error) return { error: error.message }

  revalidatePath(`/newsletters/${newsletterId}/issues/${issueId}`)
  return { success: true }
}
