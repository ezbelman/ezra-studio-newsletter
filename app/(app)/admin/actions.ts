'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/utils'
import { redirect } from 'next/navigation'

async function assertPlatformAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_platform_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_platform_admin) redirect('/dashboard')
  return supabase
}

export async function adminCreateUser(formData: FormData) {
  await assertPlatformAdmin()

  const email    = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('full_name') as string

  const admin = createAdminClient()

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })

  if (error) return { error: error.message }

  await admin.from('profiles').upsert({
    id: data.user.id,
    full_name: fullName,
    is_platform_admin: false,
  })

  return { success: true, userId: data.user.id }
}

export async function adminCreateOrg(formData: FormData) {
  await assertPlatformAdmin()

  const name   = (formData.get('name') as string).trim()
  const slug   = slugify(formData.get('slug') as string || name)
  const userId = formData.get('user_id') as string | null

  const admin = createAdminClient()

  const { data: org, error: orgErr } = await admin
    .from('organizations')
    .insert({ name, slug })
    .select('id')
    .single()

  if (orgErr) {
    return {
      error: orgErr.code === '23505'
        ? 'That workspace URL is already taken.'
        : orgErr.message,
    }
  }

  if (userId) {
    const { error: memberErr } = await admin
      .from('org_members')
      .insert({ org_id: org.id, user_id: userId, role: 'owner' })

    if (memberErr) return { error: memberErr.message }
  }

  return { success: true, orgId: org.id }
}
