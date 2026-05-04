import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrgId } from '@/lib/data/org'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { NewNewsletterForm } from './new-newsletter-form'

export default async function NewNewsletterPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const orgId = await getCurrentOrgId(supabase, user.id)
  if (!orgId) redirect('/onboarding')

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link href="/newsletters" className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink mb-8 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Newsletters
      </Link>

      <h1 className="text-2xl font-display font-700 text-ink mb-2">New Newsletter</h1>
      <p className="text-ink-muted text-sm mb-8">Set up your publication channel</p>

      <NewNewsletterForm orgId={orgId} />
    </div>
  )
}
