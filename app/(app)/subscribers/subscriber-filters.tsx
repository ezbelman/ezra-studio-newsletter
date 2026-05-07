'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { Search } from 'lucide-react'

interface Newsletter { id: string; name: string }

export function SubscriberFilters({ newsletters }: { newsletters: Newsletter[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const updateParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    params.delete('cursor')
    router.push(`${pathname}?${params.toString()}`)
  }, [router, pathname, searchParams])

  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink/30" />
        <input
          type="text"
          placeholder="Search by email or name…"
          defaultValue={searchParams.get('q') ?? ''}
          onChange={e => updateParam('q', e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-surface border border-line rounded-lg text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:border-accent/50 transition-colors"
        />
      </div>

      <select
        defaultValue={searchParams.get('newsletter') ?? ''}
        onChange={e => updateParam('newsletter', e.target.value)}
        className="px-3 py-2 bg-surface border border-line rounded-lg text-sm text-ink/60 focus:outline-none focus:border-accent/50 transition-colors"
      >
        <option value="">All newsletters</option>
        {newsletters.map(nl => (
          <option key={nl.id} value={nl.id}>{nl.name}</option>
        ))}
      </select>

      <select
        defaultValue={searchParams.get('status') ?? ''}
        onChange={e => updateParam('status', e.target.value)}
        className="px-3 py-2 bg-surface border border-line rounded-lg text-sm text-ink/60 focus:outline-none focus:border-accent/50 transition-colors"
      >
        <option value="">All statuses</option>
        <option value="active">Active</option>
        <option value="unsubscribed">Unsubscribed</option>
        <option value="bounced">Bounced</option>
      </select>
    </div>
  )
}
