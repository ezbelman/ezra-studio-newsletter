'use client'
import { useState } from 'react'
import { Shield, Download, Trash2 } from 'lucide-react'
import { deleteAccount } from '@/lib/actions/account-actions'

export function GdprPanel() {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting]     = useState(false)
  const [error, setError]           = useState<string | null>(null)

  async function handleDelete() {
    setDeleting(true)
    setError(null)
    const result = await deleteAccount()
    if ('error' in result) {
      setError(result.error ?? 'An error occurred')
      setDeleting(false)
      setConfirming(false)
      return
    }
    window.location.href = '/login'
  }

  return (
    <div className="bg-surface border border-line rounded-xl p-6">
      <div className="flex items-center gap-2 mb-5">
        <Shield className="h-4 w-4 text-ink/40" />
        <h2 className="text-sm font-600 text-ink">Privacy & Data</h2>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between py-3 border-b border-line">
          <div>
            <p className="text-sm font-500 text-ink">Export my data</p>
            <p className="text-xs text-ink/40 mt-0.5">Download a JSON archive of your account data</p>
          </div>
          <a
            href="/api/account/export"
            download="my-data.json"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line text-sm text-ink/60 hover:text-ink hover:border-accent/40 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </a>
        </div>

        <div className="flex items-center justify-between py-3">
          <div>
            <p className="text-sm font-500 text-red-500">Delete account</p>
            <p className="text-xs text-ink/40 mt-0.5">Permanently delete your account and all associated data</p>
          </div>
          {!confirming ? (
            <button
              onClick={() => setConfirming(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-xs text-ink/50">Are you sure?</p>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-sm font-500 disabled:opacity-50 hover:bg-red-600 transition-colors"
              >
                {deleting ? 'Deleting…' : 'Yes, delete'}
              </button>
              <button
                onClick={() => { setConfirming(false); setError(null) }}
                className="px-3 py-1.5 rounded-lg border border-line text-sm text-ink/50 hover:text-ink transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
      </div>
    </div>
  )
}
