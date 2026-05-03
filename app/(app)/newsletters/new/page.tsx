'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { slugify } from '@/lib/utils'
import { getCurrentOrgId } from '@/lib/data/org'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewNewsletterPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [name,        setName]        = useState('')
  const [description, setDescription] = useState('')
  const [error,       setError]       = useState('')
  const [loading,     setLoading]     = useState(false)

  const slug = slugify(name)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setError('')
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const orgId = await getCurrentOrgId(supabase, user.id)
    if (!orgId) { router.push('/onboarding'); return }

    const { data: nl, error: nlErr } = await supabase
      .from('newsletters')
      .insert({
        org_id: orgId,
        name: name.trim(),
        description: description.trim() || null,
        slug,
      })
      .select('id')
      .single()

    if (nlErr) {
      setError(nlErr.message)
      setLoading(false)
      return
    }

    router.push(`/newsletters/${nl.id}`)
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link href="/newsletters" className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink mb-8 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Newsletters
      </Link>

      <h1 className="text-2xl font-display font-700 text-ink mb-2">New Newsletter</h1>
      <p className="text-ink-muted text-sm mb-8">Set up your publication channel</p>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-5">
            <Input
              id="name"
              label="Newsletter name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="AI Weekly Digest"
            />
            {slug && (
              <p className="text-ink-muted text-xs font-mono -mt-3">
                slug: {slug}
              </p>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="desc" className="text-xs font-700 uppercase tracking-widest text-ink-muted">
                Description <span className="text-ink-muted/50 normal-case tracking-normal">— optional</span>
              </label>
              <textarea
                id="desc"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="A brief description of your newsletter's topic and audience"
                rows={3}
                className="w-full rounded-sm border border-line bg-white px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-cyan focus:border-cyan resize-none"
              />
            </div>

            {error && (
              <p className="text-red-500 text-xs bg-red-50 border border-red-200 rounded px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" asChild>
                <Link href="/newsletters">Cancel</Link>
              </Button>
              <Button type="submit" variant="primary" disabled={loading || !name.trim()}>
                {loading ? 'Creating…' : 'Create Newsletter'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
