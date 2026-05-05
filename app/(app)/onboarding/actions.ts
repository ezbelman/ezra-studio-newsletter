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

  const { error } = await supabase.rpc('create_organization_for_user', {
    p_name: name,
    p_slug: slug,
  })

  if (error) {
    return {
      error: error.code === '23505'
        ? 'That workspace URL is taken. Try a slightly different name.'
        : error.message,
    }
  }

  redirect('/dashboard')
}
