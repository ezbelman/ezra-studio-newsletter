'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

interface Newsletter { id: string; name: string }

const RANGES = [
  { value: '30d',  label: '30 days' },
  { value: '90d',  label: '90 days' },
  { value: 'all',  label: 'All time' },
] as const

export function AnalyticsFilters({ newsletters }: { newsletters: Newsletter[] }) {
  const router      = useRouter()
  const pathname    = usePathname()
  const searchParams = useSearchParams()

  const currentRange = searchParams.get('range') ?? '30d'
  const currentNl    = searchParams.get('nl') ?? ''

  const update = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`${pathname}?${params.toString()}`)
  }, [router, pathname, searchParams])

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1 bg-elevated border border-line rounded-lg p-1">
        {RANGES.map(r => (
          <button
            key={r.value}
            onClick={() => update('range', r.value === '30d' ? '' : r.value)}
            className={`px-3 py-1 rounded-md text-sm font-500 transition-colors ${
              currentRange === r.value
                ? 'bg-surface text-ink shadow-sm'
                : 'text-ink/40 hover:text-ink'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {newsletters.length > 1 && (
        <select
          value={currentNl}
          onChange={e => update('nl', e.target.value)}
          className="px-3 py-2 bg-surface border border-line rounded-lg text-sm text-ink/60 focus:outline-none focus:border-accent/50 transition-colors"
        >
          <option value="">All newsletters</option>
          {newsletters.map(nl => (
            <option key={nl.id} value={nl.id}>{nl.name}</option>
          ))}
        </select>
      )}
    </div>
  )
}
