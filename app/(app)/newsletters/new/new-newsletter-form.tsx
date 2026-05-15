'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createNewsletter } from './actions'
import { slugify } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export function NewNewsletterForm({ orgId: _orgId }: { orgId: string }) {
  const router = useRouter()

  const [name,        setName]    = useState('')
  const [description, setDesc]    = useState('')
  const [error,       setError]   = useState('')
  const [loading,     setLoading] = useState(false)

  const slug = slugify(name)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setError('')
    setLoading(true)

    const fd = new FormData()
    fd.set('name', name.trim())
    if (description.trim()) fd.set('description', description.trim())

    const result = await createNewsletter(fd)
    if ('error' in result) {
      setError(result.error ?? '')
      setLoading(false)
      return
    }
    router.push(`/newsletters/${result.id}`)
  }

  return (
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
            <p className="text-ink-muted text-xs font-mono -mt-3">slug: {slug}</p>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="desc" className="text-xs font-700 uppercase tracking-widest text-ink-muted">
              Description <span className="text-ink-muted/50 normal-case tracking-normal">— optional</span>
            </label>
            <textarea
              id="desc"
              value={description}
              onChange={e => setDesc(e.target.value)}
              placeholder="A brief description of your newsletter's topic and audience"
              rows={3}
              className="w-full rounded-sm border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent resize-none"
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
  )
}
