import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentOrgId } from '@/lib/data/org'
import { maskKey, isKeySet } from '@/lib/ai/providers'
import { SettingsForm } from './settings-form'
import { OrgSettingsForm } from './org-settings-form'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const orgId = await getCurrentOrgId(supabase, user.id)
  if (!orgId) redirect('/onboarding')

  const admin = createAdminClient()
  const { data: org } = await admin
    .from('organizations')
    .select('name, slug, ai_provider, anthropic_api_key, openai_api_key, gemini_api_key')
    .eq('id', orgId)
    .single()

  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', user.id)
    .single()

  const canEdit = ['owner', 'admin'].includes(membership?.role ?? '')

  return (
    <div className="min-h-screen bg-bg">
    <div className="mx-auto max-w-2xl px-8 py-8">
      <div className="mb-8">
        <h1 className="text-[22px] font-display font-700 leading-tight text-ink">Settings</h1>
        <p className="mt-1 text-sm text-ink-muted">Manage your organization and AI provider preferences</p>
      </div>
      <div className="space-y-6">
        <OrgSettingsForm
          canEdit={canEdit}
          orgName={org?.name ?? ''}
          orgSlug={org?.slug ?? ''}
        />
        <SettingsForm
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
    </div>
    </div>
  )
}
