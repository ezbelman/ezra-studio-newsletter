'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface Props {
  orgId: string
  initialApiKey: string
}

export function SettingsForm({ orgId, initialApiKey }: Props) {
  const supabase = createClient()
  const [apiKey,  setApiKey]  = useState(initialApiKey)
  const [showKey, setShowKey] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const { error: updateError } = await supabase
        .from('organizations')
        .update({ anthropic_api_key: apiKey.trim() || null })
        .eq('id', orgId)

      if (updateError) { setError(updateError.message); return }
      toast.success('API key saved')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Keys</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-700 uppercase tracking-widest text-ink-muted">
              Anthropic API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="sk-ant-..."
                className="w-full rounded-sm border border-line bg-white px-3 py-2.5 pr-10 text-sm text-ink placeholder:text-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-cyan focus:border-cyan font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-ink-muted">
              Used to run Claude AI polish. Get yours at console.anthropic.com.
            </p>
          </div>

          {error && (
            <p className="text-red-500 text-xs bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </p>
          )}

          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> Saving…</> : 'Save'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
