'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentOrgId } from '@/lib/data/org'
import { revalidatePath } from 'next/cache'

export { saveIssueVersion } from '@/lib/actions/issue-versions'

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
