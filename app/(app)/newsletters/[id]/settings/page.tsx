import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { NewsletterSettingsForm } from './newsletter-settings-form'

export default async function NewsletterSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: nl } = await supabase
    .from('newsletters')
    .select('id, name, description, slug, status')
    .eq('id', id)
    .single()

  if (!nl) notFound()

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link
        href={`/newsletters/${id}`}
        className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink mb-8 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to newsletter
      </Link>

      <div className="mb-8 animate-fade-up delay-0">
        <p className="text-xs font-700 uppercase tracking-widest text-ink-muted mb-1">Newsletter</p>
        <h1 className="text-3xl font-display font-700 text-ink leading-none">Settings</h1>
      </div>

      <NewsletterSettingsForm newsletter={nl} />
    </div>
  )
}
