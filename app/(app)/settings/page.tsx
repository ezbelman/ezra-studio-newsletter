import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentOrgId } from '@/lib/data/org'
import { maskKey, isKeySet } from '@/lib/ai/providers'
import { SettingsForm } from './settings-form'
import { OrgSettingsForm } from './org-settings-form'
import { BrandingForm } from './branding-form'
import { PersonalAIForm, type PersonalProvider } from './personal-ai-form'

export const metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const orgId = await getCurrentOrgId(supabase, user.id)
  if (!orgId) redirect('/onboarding')

  const admin = createAdminClient()
  const [{ data: org }, { data: membership }, { data: profile }] = await Promise.all([
    admin
      .from('organizations')
      .select('name, slug, logo_url, primary_color, accent_color, ai_provider, anthropic_api_key, openai_api_key, gemini_api_key')
      .eq('id', orgId)
      .single(),
    supabase
      .from('org_members')
      .select('role')
      .eq('org_id', orgId)
      .eq('user_id', user.id)
      .single(),
    admin
      .from('profiles')
      .select('personal_ai_provider, personal_anthropic_api_key, personal_openai_api_key, personal_gemini_api_key')
      .eq('id', user.id)
      .single(),
  ])

  const role    = membership?.role ?? ''
  const canEdit = ['owner', 'admin'].includes(role)
  const isOwner = role === 'owner'

  const personalProfile = profile as {
    personal_ai_provider:       string | null
    personal_anthropic_api_key: string | null
    personal_openai_api_key:    string | null
    personal_gemini_api_key:    string | null
  } | null

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-2xl px-4 sm:px-8 py-4 sm:py-8">
        <div className="mb-8">
          <h1 className="text-[22px] font-display font-700 leading-tight text-ink">Settings</h1>
          <p className="mt-1 text-sm text-ink-muted">Manage your organization, branding, and AI preferences</p>
        </div>

        <div className="space-y-6">
          <OrgSettingsForm
            canEdit={canEdit}
            orgName={org?.name ?? ''}
            orgSlug={org?.slug ?? ''}
          />

          <BrandingForm
            canEdit={canEdit}
            orgId={orgId}
            currentLogoUrl={org?.logo_url ?? null}
            currentPrimary={org?.primary_color ?? '#7B5CF0'}
            currentAccent={org?.accent_color ?? '#4F8EF7'}
          />

          {/* Org-level AI keys (admin + owner) */}
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

          {/* Personal AI keys (owner only) */}
          {isOwner && (
            <PersonalAIForm
              currentProvider={(personalProfile?.personal_ai_provider ?? 'none') as PersonalProvider}
              anthropicKeySet={isKeySet(personalProfile?.personal_anthropic_api_key)}
              anthropicKeyMasked={maskKey(personalProfile?.personal_anthropic_api_key)}
              openaiKeySet={isKeySet(personalProfile?.personal_openai_api_key)}
              openaiKeyMasked={maskKey(personalProfile?.personal_openai_api_key)}
              geminiKeySet={isKeySet(personalProfile?.personal_gemini_api_key)}
              geminiKeyMasked={maskKey(personalProfile?.personal_gemini_api_key)}
            />
          )}
        </div>
      </div>
    </div>
  )
}
