'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

export default function SettingsPage() {
  const supabase = createClient()

  const [orgId,       setOrgId]       = useState('')
  const [apiKey,      setApiKey]      = useState('')
  const [showKey,     setShowKey]     = useState(false)
  const [loading,     setLoading]     = useState(true)
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: membership } = await supabase
        .from('org_members')
        .select('org_id, organizations(anthropic_api_key)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .single()

      if (membership) {
        setOrgId(membership.org_id)
        const org = membership.organizations as { anthropic_api_key: string | null } | null
        setApiKey(org?.anthropic_api_key ?? '')
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!orgId) return
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
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <p className="text-xs font-700 uppercase tracking-widest text-ink-muted mb-1">Organization</p>
        <h1 className="text-3xl font-display font-700 text-ink leading-none">Settings</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-ink-muted" />
        </div>
      ) : (
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

              <div className="flex items-center gap-3">
                <Button type="submit" variant="primary" disabled={saving}>
                  {saving ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</> : 'Save'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
