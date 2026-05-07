'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { importSubscribers } from './subscriber-actions'
import { Button } from '@/components/ui/button'

interface Newsletter { id: string; name: string }

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''))
  return lines.slice(1)
    .filter(l => l.trim())
    .map(line => {
      const values = line.match(/("(?:[^"]*(?:""[^"]*)*)")|([^,]+)|(?<=,)(?=,|$)/g) ?? line.split(',')
      const row: Record<string, string> = {}
      headers.forEach((h, i) => {
        row[h] = (values[i] ?? '').trim().replace(/^"|"$/g, '').replace(/""/g, '"')
      })
      return row
    })
    .filter(row => row.email?.includes('@'))
}

export function ImportCsvDialog({ newsletters }: { newsletters: Newsletter[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [newsletterId, setNewsletterId] = useState(newsletters[0]?.id ?? '')
  const [preview, setPreview] = useState<Record<string, string>[]>([])
  const [fileName, setFileName] = useState('')
  const [result, setResult] = useState<{ added?: number; total?: number; error?: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setResult(null)
    const reader = new FileReader()
    reader.onload = ev => {
      const rows = parseCSV(ev.target?.result as string)
      setPreview(rows)
    }
    reader.readAsText(file)
  }

  function reset() {
    setPreview([])
    setFileName('')
    setResult(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  function handleImport() {
    if (!newsletterId || preview.length === 0) return
    setResult(null)
    const rows = preview.map(r => ({
      email:         r.email ?? r['email address'] ?? '',
      name:          r.name ?? r['full name'] ?? r['first name'] ?? undefined,
      newsletter_id: newsletterId,
    })).filter(r => r.email.includes('@'))

    startTransition(async () => {
      const res = await importSubscribers(rows)
      if (res.error) { setResult({ error: res.error }); return }
      setResult({ added: res.added, total: res.total })
      router.refresh()
    })
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Upload className="h-4 w-4" />
        Import CSV
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setOpen(false); reset() }} />
          <div className="relative z-10 w-full max-w-lg rounded-xl border border-line bg-surface shadow-lg animate-scale-in">
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <h2 className="text-sm font-700 text-ink">Import from CSV</h2>
              <button onClick={() => { setOpen(false); reset() }} className="text-ink-muted hover:text-ink transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Newsletter selector */}
              <div>
                <label className="block text-xs font-600 text-ink-muted mb-1.5">Import into newsletter</label>
                <select
                  value={newsletterId}
                  onChange={e => setNewsletterId(e.target.value)}
                  className="w-full h-10 rounded-md border border-line bg-elevated px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                >
                  {newsletters.map(nl => <option key={nl.id} value={nl.id}>{nl.name}</option>)}
                </select>
              </div>

              {/* File input */}
              <div>
                <label className="block text-xs font-600 text-ink-muted mb-1.5">CSV file</label>
                <label className="flex items-center gap-3 h-10 rounded-md border border-dashed border-line bg-elevated px-3 cursor-pointer hover:border-accent/40 transition-colors">
                  <Upload className="h-4 w-4 text-ink-muted/60 shrink-0" />
                  <span className="text-sm text-ink-muted/60">{fileName || 'Choose file…'}</span>
                  <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
                </label>
                <p className="text-[11px] text-ink-muted/50 mt-1.5">
                  Expected columns: <span className="font-mono">email</span> (required), <span className="font-mono">name</span> (optional)
                </p>
              </div>

              {/* Preview */}
              {preview.length > 0 && (
                <div className="rounded-lg border border-line overflow-hidden">
                  <div className="bg-elevated px-4 py-2 border-b border-line">
                    <p className="text-xs font-600 text-ink-muted">
                      {preview.length} valid row{preview.length !== 1 ? 's' : ''} found
                      {preview.length > 5 ? ` — showing first 5` : ''}
                    </p>
                  </div>
                  <div className="divide-y divide-line max-h-40 overflow-y-auto">
                    {preview.slice(0, 5).map((row, i) => (
                      <div key={i} className="px-4 py-2 flex items-center gap-3">
                        <span className="text-xs font-mono text-ink/80">{row.email}</span>
                        {row.name && <span className="text-xs text-ink-muted">{row.name}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Result */}
              {result?.error && (
                <p className="text-danger text-xs bg-danger/10 border border-danger/20 rounded-md px-3 py-2 flex items-center gap-2">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {result.error}
                </p>
              )}
              {result?.added !== undefined && (
                <p className="text-success text-xs bg-success/10 border border-success/20 rounded-md px-3 py-2 flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  {result.added} new subscriber{result.added !== 1 ? 's' : ''} added
                  {result.total && result.total > result.added
                    ? ` · ${result.total - result.added} already existed (skipped)`
                    : ''}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={() => { setOpen(false); reset() }}>
                  {result?.added !== undefined ? 'Close' : 'Cancel'}
                </Button>
                {result?.added === undefined && (
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={pending || preview.length === 0 || !newsletterId}
                    onClick={handleImport}
                  >
                    {pending
                      ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Importing…</>
                      : `Import ${preview.length} subscriber${preview.length !== 1 ? 's' : ''}`}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
