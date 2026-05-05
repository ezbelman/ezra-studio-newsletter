'use server'

import { createClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/utils'
import { redirect } from 'next/navigation'

export async function createOrganization(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const name = ((formData.get('name') as string) ?? '').trim()
  if (!name) return { error: 'Organization name is required.' }

  const slug = slugify(name)

  const { data: org, error: orgErr } = await supabase
    .from('organizations')
    .insert({ name, slug })
    .select('id')
    .single()

  if (orgErr) {
    return {
      error: orgErr.code === '23505'
        ? 'That workspace URL is taken. Try a slightly different name.'
        : orgErr.message,
    }
  }

  const { error: memberErr } = await supabase
    .from('org_members')
    .insert({ org_id: org.id, user_id: user.id, role: 'owner' })

  if (memberErr) return { error: memberErr.message }

  redirect('/dashboard')
}
