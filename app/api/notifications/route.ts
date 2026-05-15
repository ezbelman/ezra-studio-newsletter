import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Notifications table is not yet in generated types — cast for compatibility
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as unknown as { from: (t: string) => any }

  const { searchParams } = new URL(request.url)
  const limit  = Math.min(parseInt(searchParams.get('limit') ?? '20'), 50)
  const before = searchParams.get('before')

  let query = db
    .from('notifications')
    .select('id, type, payload, read_at, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (before) query = query.lt('created_at', before)

  const [{ data: notifications, error }, { count }] = await Promise.all([
    query,
    db
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('read_at', null),
  ])

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ notifications: notifications ?? [], unread: count ?? 0 })
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as unknown as { from: (t: string) => any }

  const body = await request.json().catch(() => ({}))
  const ids: string[] | undefined = Array.isArray(body?.ids) ? body.ids : undefined

  let query = db
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .is('read_at', null)

  if (ids?.length) query = query.in('id', ids)

  const { error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ success: true })
}
