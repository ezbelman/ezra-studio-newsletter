import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentOrgId } from '@/lib/data/org'
import { maskKey, isKeySet } from '@/lib/ai/providers'
import { SettingsForm } from './settings-form'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const orgId = await getCurrentOrgId(supabase, user.id)
  if (!orgId) redirect('/onboarding')

  // Use admin client so keys are never returned through user's Supabase session
  const admin = createAdminClient()
  const { data: org } = await admin
    .from('organizations')
    .select('ai_provider, anthropic_api_key, openai_api_key, gemini_api_key')
    .eq('id', orgId)
    .single()

  // Determine role to conditionally show write UI
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', user.id)
    .single()

  const canEdit = ['owner', 'admin'].includes(membership?.role ?? '')

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <p className="text-xs font-700 uppercase tracking-widest text-ink-muted mb-1">Organization</p>
        <h1 className="text-3xl font-display font-700 text-ink leading-none">Settings</h1>
      </div>
      <SettingsForm
        orgId={orgId}
        canEdit={canEdit}
        provider={org?.ai_provider ?? 'platform'}
        anthropicKeyMasked={maskKey(org?.anthropic_api_key)}
        anthropicKeySet={isKeySet(org?.anthropic_api_key)}
        openaiKeyMasked={maskKey(org?.openai_api_key)}
        openaiKeySet={isKeySet(org?.openai_api_key)}
        geminiKeyMasked={maskKey(org?.gemini_api_key)}
        geminiKeySet={isKeySet(org?.gemini_api_key)}
      />
    </div>
  )
}
