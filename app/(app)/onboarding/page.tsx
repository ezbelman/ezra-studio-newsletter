'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { slugify } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export default function OnboardingPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [orgName, setOrgName] = useState('')
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const slug = slugify(orgName)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!orgName.trim()) return
    setError('')
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    // Create org
    const { data: org, error: orgErr } = await supabase
      .from('organizations')
      .insert({ name: orgName.trim(), slug })
      .select('id')
      .single()

    if (orgErr) {
      setError(orgErr.code === '23505'
        ? 'That workspace URL is taken. Try a slightly different name.'
        : orgErr.message
      )
      setLoading(false)
      return
    }

    // Add current user as owner
    const { error: memberErr } = await supabase
      .from('org_members')
      .insert({ org_id: org.id, user_id: user.id, role: 'owner' })

    if (memberErr) {
      setError(memberErr.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="bg-navy-soft/20 border border-white/8 rounded p-8 backdrop-blur-sm w-full">
      <h1 className="text-white font-display font-700 text-xl mb-1">Create your workspace</h1>
      <p className="text-white/40 text-sm mb-8">Name your organization to get started</p>

      <form onSubmit={handleCreate} className="space-y-5">
        <div>
          <label className="block text-xs font-700 uppercase tracking-widest text-white/40 mb-1.5">
            Organization name
          </label>
          <input
            type="text"
            value={orgName}
            onChange={e => setOrgName(e.target.value)}
            required
            placeholder="Acme Corp"
            className="w-full h-10 rounded-sm border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-cyan focus:border-cyan transition-colors"
          />
          {slug && (
            <p className="text-white/30 text-xs mt-1.5 font-mono">
              workspace: {slug}
            </p>
          )}
        </div>

        {error && (
          <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded px-3 py-2">
            {error}
          </p>
        )}

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={loading || !orgName.trim()}
        >
          {loading ? 'Creating workspace…' : 'Create workspace'}
        </Button>
      </form>
    </div>
  )
}
