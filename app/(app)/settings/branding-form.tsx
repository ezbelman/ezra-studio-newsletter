'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { saveBrandingSettings } from './actions'
import { Button } from '@/components/ui/button'
import { Loader2, Check, X, Upload, Image as ImageIcon } from 'lucide-react'

interface Props {
  canEdit:            boolean
  orgId:              string
  currentLogoUrl:     string | null
  currentPrimary:     string
  currentAccent:      string
}

export function BrandingForm({ canEdit, orgId, currentLogoUrl, currentPrimary, currentAccent }: Props) {
  const router  = useRouter()
  const supabase = createClient()

  const [pending,      startTransition] = useTransition()
  const [logoUrl,      setLogoUrl]      = useState(currentLogoUrl ?? '')
  const [primary,      setPrimary]      = useState(currentPrimary)
  const [accent,       setAccent]       = useState(currentAccent)
  const [uploading,    setUploading]    = useState(false)
  const [result,       setResult]       = useState<{ error?: string; success?: boolean } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { setResult({ error: 'Logo must be under 2 MB.' }); return }

    setUploading(true)
    setResult(null)

    const ext  = file.name.split('.').pop() ?? 'png'
    const path = `${orgId}/logo.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('org-logos')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (uploadError) {
      setResult({ error: `Upload failed: ${uploadError.message}. Make sure the "org-logos" bucket exists in Supabase Storage.` })
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from('org-logos').getPublicUrl(path)
    // Bust cache with timestamp so the browser doesn't show the old logo
    setLogoUrl(`${data.publicUrl}?t=${Date.now()}`)
    setUploading(false)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData()
    fd.set('logo_url',      logoUrl)
    fd.set('primary_color', primary)
    fd.set('accent_color',  accent)
    startTransition(async () => {
      const res = await saveBrandingSettings(fd)
      setResult(res)
      if (res.success) router.refresh()
    })
  }

  if (!canEdit) {
    return (
      <div className="rounded-xl border border-line bg-surface">
        <div className="border-b border-line px-6 py-5">
          <h3 className="text-base font-700 text-ink">Branding</h3>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center gap-4">
            {currentLogoUrl ? (
              <img src={currentLogoUrl} alt="Logo" className="h-12 w-12 rounded-xl object-contain bg-elevated border border-line p-1" />
            ) : (
              <div className="h-12 w-12 rounded-xl bg-elevated flex items-center justify-center border border-line">
                <ImageIcon className="h-5 w-5 text-ink/20" />
              </div>
            )}
            <div>
              <p className="text-sm font-500 text-ink">Organization logo</p>
              <p className="text-xs text-ink/40">{currentLogoUrl ? 'Logo set' : 'No logo uploaded'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded border border-line" style={{ backgroundColor: currentPrimary }} />
              <span className="text-xs font-mono text-ink/50">{currentPrimary}</span>
              <span className="text-[10px] text-ink/30">Primary</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded border border-line" style={{ backgroundColor: currentAccent }} />
              <span className="text-xs font-mono text-ink/50">{currentAccent}</span>
              <span className="text-[10px] text-ink/30">Accent</span>
            </div>
          </div>
          <p className="text-xs text-ink-muted">Only org owners and admins can change branding.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-line bg-surface">
      <div className="border-b border-line px-6 py-5">
        <h3 className="text-base font-700 text-ink">Branding</h3>
        <p className="text-xs text-ink-muted mt-1">
          Logo and colors appear in your emails, subscribe page, and web archive.
        </p>
      </div>

      <div className="px-6 py-5">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Logo */}
          <div>
            <label className="block text-xs font-600 text-ink-muted mb-3">Organization logo</label>
            <div className="flex items-start gap-4">
              {/* Preview box */}
              <div className="relative shrink-0">
                {logoUrl ? (
                  <>
                    <img
                      src={logoUrl}
                      alt="Logo"
                      className="h-16 w-16 rounded-xl object-contain bg-elevated border border-line p-1"
                    />
                    <button
                      type="button"
                      onClick={() => { setLogoUrl(''); setResult(null) }}
                      className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-danger flex items-center justify-center hover:bg-danger/80 transition-colors"
                    >
                      <X className="h-3 w-3 text-white" />
                    </button>
                  </>
                ) : (
                  <div className="h-16 w-16 rounded-xl bg-elevated border border-dashed border-line flex items-center justify-center">
                    {uploading
                      ? <Loader2 className="h-5 w-5 text-ink/30 animate-spin" />
                      : <ImageIcon className="h-5 w-5 text-ink/20" />
                    }
                  </div>
                )}
              </div>

              {/* Upload controls */}
              <div className="space-y-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload className="h-3.5 w-3.5" />
                  {uploading ? 'Uploading…' : logoUrl ? 'Replace logo' : 'Upload logo'}
                </Button>
                <p className="text-[11px] text-ink/30 leading-relaxed">
                  PNG, SVG, JPEG or WebP · max 2 MB<br />
                  Square format recommended (e.g. 256×256)
                </p>
              </div>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              className="hidden"
              onChange={handleLogoUpload}
            />

            {/* Logo URL fallback */}
            <div className="mt-3">
              <label className="block text-[11px] text-ink/40 mb-1">Or paste a logo URL</label>
              <input
                type="url"
                value={logoUrl}
                onChange={e => setLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
                className="w-full h-9 rounded-md border border-line bg-elevated px-3 text-xs text-ink placeholder:text-ink-muted/30 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
              />
            </div>
          </div>

          {/* Colors */}
          <div>
            <label className="block text-xs font-600 text-ink-muted mb-3">Brand colors</label>
            <div className="grid grid-cols-2 gap-4">
              <ColorField
                label="Primary color"
                hint="Email header, buttons, highlights"
                value={primary}
                onChange={setPrimary}
              />
              <ColorField
                label="Accent color"
                hint="Links and secondary elements"
                value={accent}
                onChange={setAccent}
              />
            </div>
          </div>

          {/* Live email preview */}
          <div>
            <label className="block text-xs font-600 text-ink-muted mb-2">Email preview</label>
            <div className="rounded-xl border border-line overflow-hidden" style={{ backgroundColor: '#0A0A0F' }}>
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: '#2A2A38' }}>
                <div className="flex items-center gap-2.5">
                  {logoUrl ? (
                    <img src={logoUrl} alt="" className="h-7 w-7 rounded-lg object-contain" />
                  ) : (
                    <div
                      className="h-7 w-7 rounded-lg flex items-center justify-center text-white text-[9px] font-black"
                      style={{ background: `linear-gradient(135deg, ${primary}, ${accent})` }}
                    >
                      NS
                    </div>
                  )}
                  <span className="text-sm font-600" style={{ color: '#F0F0F5' }}>Your Newsletter</span>
                </div>
                <span className="text-xs" style={{ color: '#55556A' }}>View in browser</span>
              </div>

              {/* Color gradient bar */}
              <div className="h-0.5" style={{ background: `linear-gradient(90deg, ${primary}, ${accent})` }} />

              {/* Body mock */}
              <div className="px-5 py-5">
                <div className="h-5 rounded-md mb-3" style={{ backgroundColor: '#1E1E2E', width: '65%' }} />
                <div className="space-y-1.5 mb-5">
                  <div className="h-3 rounded" style={{ backgroundColor: '#1A1A28', width: '90%' }} />
                  <div className="h-3 rounded" style={{ backgroundColor: '#1A1A28', width: '75%' }} />
                  <div className="h-3 rounded" style={{ backgroundColor: '#1A1A28', width: '82%' }} />
                </div>
                <div
                  className="inline-flex items-center px-4 py-1.5 rounded-lg text-xs font-600 text-white"
                  style={{ backgroundColor: primary }}
                >
                  Read more →
                </div>
              </div>

              {/* Footer mock */}
              <div className="px-5 py-3 border-t text-center" style={{ borderColor: '#2A2A38' }}>
                <span className="text-[11px]" style={{ color: '#55556A' }}>Unsubscribe</span>
              </div>
            </div>
          </div>

          {result?.error && (
            <p className="text-danger text-xs bg-danger/10 border border-danger/20 rounded-md px-3 py-2 flex items-start gap-2">
              <X className="h-3.5 w-3.5 mt-0.5 shrink-0" /> {result.error}
            </p>
          )}
          {result?.success && (
            <p className="text-success text-xs bg-success/10 border border-success/20 rounded-md px-3 py-2 flex items-center gap-2">
              <Check className="h-3.5 w-3.5 shrink-0" /> Branding saved.
            </p>
          )}

          <div className="flex justify-end">
            <Button type="submit" variant="primary" disabled={pending || uploading}>
              {pending ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</> : 'Save branding'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ColorField({
  label, hint, value, onChange,
}: {
  label: string; hint: string; value: string; onChange: (v: string) => void
}) {
  return (
    <div>
      <label className="block text-xs text-ink/50 mb-1.5">{label}</label>
      <div className="flex items-center gap-2 h-10 rounded-md border border-line bg-elevated px-3">
        <input
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="h-6 w-6 rounded cursor-pointer shrink-0 border-0 bg-transparent p-0"
        />
        <input
          type="text"
          value={value}
          onChange={e => {
            const v = e.target.value
            if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) onChange(v)
          }}
          className="flex-1 text-sm font-mono text-ink bg-transparent outline-none min-w-0"
          maxLength={7}
          spellCheck={false}
        />
      </div>
      <p className="text-[11px] text-ink/30 mt-1">{hint}</p>
    </div>
  )
}
