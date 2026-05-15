import { getSettingsStatus } from '../settings-actions'
import { SettingsPanel } from '../settings-panel'
import { Settings, Info } from 'lucide-react'

export const metadata = { title: 'Platform Settings' }

export default async function SettingsPage() {
  const statuses = await getSettingsStatus()

  return (
    <div className="p-4 sm:p-8 max-w-2xl">
      <div className="mb-6">
        <p className="text-xs font-700 uppercase tracking-widest text-ink/40 mb-1">Configuration</p>
        <div className="flex items-center gap-3">
          <Settings className="h-5 w-5 text-ink/40" />
          <h1 className="text-2xl font-display font-700 text-ink">Platform Settings</h1>
        </div>
        <p className="text-xs text-ink/40 mt-1">
          API keys configured here are stored encrypted in the database. Environment variables always take precedence.
        </p>
      </div>

      <div className="mb-3 flex items-start gap-2.5 bg-accent/5 border border-accent/15 rounded-xl px-4 py-3">
        <Info className="h-4 w-4 text-accent shrink-0 mt-0.5" />
        <p className="text-xs text-ink/60">
          <span className="font-600 text-ink/80">Supabase and Vercel keys</span> must remain in your Vercel environment variables — they cannot be stored here as they are needed before the app can connect to the database.
        </p>
      </div>

      <div className="mb-6 flex items-start gap-2.5 bg-warning/5 border border-warning/20 rounded-xl px-4 py-3">
        <Info className="h-4 w-4 text-warning shrink-0 mt-0.5" />
        <div className="text-xs text-ink/60 space-y-1">
          <p><span className="font-600 text-ink/80">Encryption required before saving keys.</span> All secrets are encrypted with AES-256-GCM before being stored in the database.</p>
          <p>Add <code className="font-mono bg-elevated px-1 rounded">SETTINGS_ENCRYPTION_KEY</code> to your environment variables. Generate one with:</p>
          <code className="block font-mono bg-elevated px-2 py-1 rounded text-ink/70 mt-1">node -e &quot;console.log(require(&apos;crypto&apos;).randomBytes(32).toString(&apos;hex&apos;))&quot;</code>
        </div>
      </div>

      <SettingsPanel statuses={statuses} />
    </div>
  )
}
