import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { EmbedSubscribeForm } from './embed-form'

interface Props {
  params:       Promise<{ slug: string }>
  searchParams: Promise<{ ref?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = createAdminClient()
  const { data: nl } = await supabase
    .from('newsletters')
    .select('name')
    .eq('slug', slug)
    .single()
  return { title: nl?.name ? `Subscribe to ${nl.name}` : 'Subscribe' }
}

export default async function EmbedPage({ params, searchParams }: Props) {
  const { slug }  = await params
  const { ref }   = await searchParams
  const supabase = createAdminClient()

  const { data: nl } = await supabase
    .from('newsletters')
    .select('id, name, organizations(primary_color)')
    .eq('slug', slug)
    .eq('status', 'active')
    .single()

  if (!nl) notFound()

  const org = nl.organizations as { primary_color: string | null } | null
  const color = org?.primary_color ?? '#7B5CF0'

  return (
    <div
      style={{ background: 'transparent', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
      className="p-4"
    >
      <EmbedSubscribeForm
        newsletterId={nl.id}
        newsletterName={nl.name}
        primaryColor={color}
        referralCode={ref}
      />
    </div>
  )
}
