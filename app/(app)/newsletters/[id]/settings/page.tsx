'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react'
import { slugify } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

interface Newsletter {
  id: string
  name: string
  description: string | null
  slug: string
  status: string
}

export default function NewsletterSettingsPage() {
  const { id }   = useParams<{ id: string }>()
  const router   = useRouter()
  const supabase = createClient()

  const [nl,       setNl]       = useState<Newsletter | null>(null)
  const [name,     setName]     = useState('')
  const [desc,     setDesc]     = useState('')
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [error,    setError]    = useState('')
  const [confirm,  setConfirm]  = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('newsletters')
        .select('id, name, description, slug, status')
        .eq('id', id)
        .single()
      if (data) {
        setNl(data)
        setName(data.name)
        setDesc(data.description ?? '')
      }
      setLoading(false)
    }
    load()
  }, [id])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setError('')
    setSaving(true)

    const newSlug = slugify(name)
    const { error: updateError } = await supabase
      .from('newsletters')
      .update({ name: name.trim(), description: desc.trim() || null, slug: newSlug })
      .eq('id', id)

    setSaving(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setNl(prev => prev ? { ...prev, name: name.trim(), description: desc.trim() || null, slug: newSlug } : prev)
    toast.success('Settings saved')
  }

  async function handleArchive() {
    setArchiving(true)
    const { error: updateError } = await supabase
      .from('newsletters')
      .update({ status: 'archived' })
      .eq('id', id)

    setArchiving(false)

    if (updateError) {
      toast.error('Archive failed', updateError.message)
      return
    }

    toast.info('Newsletter archived')
    router.push('/newsletters')
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        <Loader2 className="h-6 w-6 animate-spin text-ink-muted" />
      </div>
    )
  }

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

      {/* General */}
      <div className="rounded-lg border border-line bg-white overflow-hidden mb-6 animate-fade-up delay-100">
        <div className="px-5 py-4 border-b border-line">
          <h2 className="text-xs font-700 uppercase tracking-widest text-ink-muted">General</h2>
        </div>
        <form onSubmit={handleSave} className="p-5 space-y-4">
          <Input
            id="name"
            label="Newsletter name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            placeholder="The Weekly Byte"
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-700 uppercase tracking-widest text-ink-muted">
              Description
            </label>
            <textarea
              value={desc}
              onChange={e => setDesc(e.target.value)}
              rows={3}
              placeholder="What this newsletter is about…"
              className="w-full rounded-sm border border-line bg-white px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-cyan focus:border-cyan resize-none"
            />
          </div>
          {name && (
            <p className="text-xs text-ink-muted font-mono">
              slug: {slugify(name)}
            </p>
          )}
          {error && (
            <p className="text-red-500 text-xs bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </p>
          )}
          <div className="flex justify-end pt-1">
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</> : 'Save changes'}
            </Button>
          </div>
        </form>
      </div>

      {/* Danger zone */}
      <div className="rounded-lg border border-red-200 bg-white overflow-hidden animate-fade-up delay-150">
        <div className="px-5 py-4 border-b border-red-200 bg-red-50/50">
          <h2 className="text-xs font-700 uppercase tracking-widest text-red-600 flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5" />
            Danger zone
          </h2>
        </div>
        <div className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-600 text-ink">Archive newsletter</p>
              <p className="text-xs text-ink-muted mt-0.5">
                Hides this newsletter from active views. Issues are preserved.
              </p>
            </div>
            {!confirm ? (
              <Button variant="outline" size="sm" onClick={() => setConfirm(true)}
                className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400">
                Archive
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-ink-muted">Are you sure?</span>
                <Button variant="outline" size="sm" onClick={() => setConfirm(false)}>Cancel</Button>
                <Button variant="primary" size="sm" disabled={archiving}
                  className="bg-red-600 hover:bg-red-700 border-red-600"
                  onClick={handleArchive}>
                  {archiving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Confirm archive'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
