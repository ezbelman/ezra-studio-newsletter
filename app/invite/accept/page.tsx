import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { AcceptInviteButton } from './accept-button'

export const metadata: Metadata = { title: 'Accept Invitation' }

interface Props {
  searchParams: Promise<{ token?: string }>
}

export default async function AcceptInvitePage({ searchParams }: Props) {
  const { token } = await searchParams
  if (!token) notFound()

  const adminClient = createAdminClient()

  /* Lookup invitation */
  const { data: invitation } = await adminClient
    .from('org_invitations')
    .select('id, org_id, email, role, expires_at, accepted_at, organizations(name)')
    .eq('token', token)
    .single()

  if (!invitation) {
    return (
      <ErrorPage
        title="Invitation not found"
        message="This invitation link is invalid or has already been used."
      />
    )
  }

  if (invitation.accepted_at) {
    return (
      <ErrorPage
        title="Already accepted"
        message="This invitation has already been accepted. Sign in to access the workspace."
        cta={{ label: 'Sign in', href: '/login' }}
      />
    )
  }

  if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
    return (
      <ErrorPage
        title="Invitation expired"
        message="This invitation expired. Ask the team owner to send a new one."
      />
    )
  }

  /* Check current session */
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const orgName = (invitation.organizations as { name: string } | null)?.name ?? 'the workspace'

  if (!user) {
    /* Redirect to signup with return URL */
    const returnUrl = encodeURIComponent(`/invite/accept?token=${token}`)
    redirect(`/signup?return=${returnUrl}&email=${encodeURIComponent(invitation.email)}`)
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm animate-fade-up">
        <div className="flex justify-center mb-8">
          <div className="h-7 w-7 rounded-lg gradient-accent flex items-center justify-center">
            <span className="text-white text-[11px] font-black">NS</span>
          </div>
        </div>

        <div className="bg-surface border border-line rounded-xl p-8 text-center">
          <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">✉️</span>
          </div>
          <h1 className="text-lg font-700 text-ink mb-2">You're invited!</h1>
          <p className="text-sm text-ink/50 mb-1">
            You've been invited to join
          </p>
          <p className="text-sm font-600 text-ink mb-1">{orgName}</p>
          <p className="text-xs text-ink/40 mb-6">
            as <span className="text-ink font-500 capitalize">{invitation.role}</span>
          </p>

          <AcceptInviteButton
            token={token}
            invitationId={invitation.id}
            orgId={invitation.org_id}
            userId={user.id}
            role={invitation.role}
          />
        </div>
      </div>
    </div>
  )
}

function ErrorPage({ title, message, cta }: {
  title: string
  message: string
  cta?: { label: string; href: string }
}) {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm animate-scale-in">
        <div className="bg-surface border border-line rounded-xl p-8 text-center">
          <p className="text-sm font-600 text-ink mb-2">{title}</p>
          <p className="text-xs text-ink/50 leading-relaxed mb-4">{message}</p>
          {cta && (
            <a
              href={cta.href}
              className="inline-block px-4 py-2 rounded-lg gradient-accent text-white text-sm font-500 hover:opacity-90 transition-opacity"
            >
              {cta.label}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
