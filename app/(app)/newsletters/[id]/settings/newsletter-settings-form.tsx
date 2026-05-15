'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, AlertTriangle, Code2, ExternalLink, Mail } from 'lucide-react'
import { slugify } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { EMAIL_TEMPLATES } from '@/lib/email/template'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://yourapp.com'

interface Newsletter {
  id: string
  name: string
  description: string | null
  slug: string
  status: string
  email_template?: string | null
  custom_sending_domain?: string | null
}

export function NewsletterSettingsForm({ newsletter }: { newsletter: Newsletter }) {
  const supabase = createClient()
  const router   = useRouter()

  const [name,         setName]         = useState(newsletter.name)
  const [desc,         setDesc]         = useState(newsletter.description ?? '')
  const [template,     setTemplate]     = useState(newsletter.email_template ?? 'dark')
  const [customDomain, setCustomDomain] = useState(newsletter.custom_sending_domain ?? '')
  const [saving,       setSaving]       = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [error,     setError]     = useState('')
  const [isConfirmingArchive, setIsConfirmingArchive] = useState(false)
  const [copied,    setCopied]    = useState(false)

  const publicUrl  = `${APP_URL}/s/${newsletter.slug}`
  const embedUrl   = `${APP_URL}/embed/${newsletter.slug}`
  const embedSnippet = `<iframe src="${embedUrl}" width="100%" height="320" frameborder="0" style="border-radius:12px;"></iframe>`

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setError('')
    setSaving(true)

    const newSlug = slugify(name)
    const domain  = customDomain.trim().toLowerCase().replace(/^https?:\/\//, '')
    const { error: updateError } = await supabase
      .from('newsletters')
      .update({
        name:                 name.trim(),
        description:          desc.trim() || null,
        slug:                 newSlug,
        email_template:       template,
        custom_sending_domain: domain || null,
      })
      .eq('id', newsletter.id)

    setSaving(false)
    if (updateError) { setError(updateError.message); return }
    toast.success('Settings saved')
  }

  async function handleArchive() {
    setArchiving(true)
    const { error: updateError } = await supabase
      .from('newsletters')
      .update({ status: 'archived' })
      .eq('id', newsletter.id)

    setArchiving(false)
    if (updateError) { toast.error('Archive failed', updateError.message); return }
    toast.info('Newsletter archived')
    router.push('/newsletters')
  }

  return (
    <>
      {/* General */}
      <div className="rounded-lg border border-line bg-surface overflow-hidden mb-6 animate-fade-up delay-100">
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
              className="w-full rounded-sm border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent resize-none"
            />
          </div>
          {name && (
            <p className="text-xs text-ink-muted font-mono">slug: {slugify(name)}</p>
          )}

          {/* Email template selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-700 uppercase tracking-widest text-ink-muted">
              Email layout
            </label>
            <div className="grid grid-cols-3 gap-2">
              {EMAIL_TEMPLATES.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTemplate(t.id)}
                  className={`px-3 py-2 rounded-lg border text-sm font-500 transition-colors ${
                    template === t.id
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-line text-ink/60 hover:border-ink/20 hover:text-ink'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom sending domain */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-700 uppercase tracking-widest text-ink-muted flex items-center gap-1.5">
              <Mail className="h-3 w-3" />
              Custom sending domain
            </label>
            <input
              type="text"
              value={customDomain}
              onChange={e => setCustomDomain(e.target.value)}
              placeholder="yourcompany.com"
              className="w-full rounded-sm border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent font-mono"
            />
            <p className="text-xs text-ink-muted">
              Leave blank to use the default <code className="bg-elevated px-1 rounded text-[11px]">resend.dev</code> address.
              Domain must be verified in your Resend account first.
            </p>
            {customDomain.trim() && (
              <p className="text-xs text-accent font-mono">
                From: newsletter@{customDomain.trim().toLowerCase().replace(/^https?:\/\//, '')}
              </p>
            )}
          </div>

          {error && (
            <p className="text-red-500 text-xs bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </p>
          )}
          <div className="flex justify-end pt-1">
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> Saving…</> : 'Save changes'}
            </Button>
          </div>
        </form>
      </div>

      {/* Subscribe widget */}
      <div className="rounded-lg border border-line bg-surface overflow-hidden mb-6 animate-fade-up delay-150">
        <div className="px-5 py-4 border-b border-line flex items-center gap-2">
          <Code2 className="h-3.5 w-3.5 text-ink-muted" />
          <h2 className="text-xs font-700 uppercase tracking-widest text-ink-muted">Subscribe widget</h2>
        </div>
        <div className="p-5 space-y-4">
          {/* Direct link */}
          <div>
            <label className="block text-xs font-700 uppercase tracking-widest text-ink-muted mb-1.5">Public subscribe page</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-elevated border border-line rounded px-3 py-2 text-ink-muted truncate font-mono">{publicUrl}</code>
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 p-2 rounded-lg border border-line text-ink/40 hover:text-ink hover:border-ink/20 transition-colors"
                title="Open public subscribe page"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          {/* Embed snippet */}
          <div>
            <label className="block text-xs font-700 uppercase tracking-widest text-ink-muted mb-1.5">Embed snippet</label>
            <p className="text-xs text-ink-muted mb-2">
              Paste this into any website to embed a subscribe form.
            </p>
            <div className="relative">
              <pre className="bg-elevated border border-line rounded text-[11px] font-mono text-ink-muted p-3 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
                {embedSnippet}
              </pre>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(embedSnippet)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                }}
                className="absolute top-2 right-2 px-2 py-1 rounded border border-line bg-surface text-[10px] font-600 text-ink/50 hover:text-ink hover:border-ink/20 transition-colors"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="rounded-lg border border-red-200 bg-surface overflow-hidden animate-fade-up delay-150">
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
            {!isConfirmingArchive ? (
              <Button variant="outline" size="sm" onClick={() => setIsConfirmingArchive(true)}
                className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400">
                Archive
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-ink-muted">Are you sure?</span>
                <Button variant="outline" size="sm" onClick={() => setIsConfirmingArchive(false)}>Cancel</Button>
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
    </>
  )
}
