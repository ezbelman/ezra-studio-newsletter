'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Newspaper, Users, FileText, Loader2, X } from 'lucide-react'

interface SearchResults {
  issues:      { id: string; title: string; status: string; newsletter_id: string; newsletters: { name: string; slug: string } | null }[]
  subscribers: { id: string; email: string; name: string | null; status: string }[]
  newsletters: { id: string; name: string; slug: string; status: string }[]
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

const STATUS_BADGE: Record<string, string> = {
  draft:         'bg-ink/10 text-ink/50',
  published:     'bg-success/10 text-success',
  active:        'bg-success/10 text-success',
  bounced:       'bg-danger/10 text-danger',
  unsubscribed:  'bg-ink/10 text-ink/50',
  pending_approval: 'bg-amber-500/10 text-amber-500',
  needs_revision:   'bg-orange-500/10 text-orange-500',
}

function ResultGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="px-4 pt-3 pb-1 text-[10px] font-700 uppercase tracking-widest text-ink/30">{label}</p>
      {children}
    </div>
  )
}

function ResultItem({
  icon: Icon,
  primary,
  secondary,
  badge,
  onClick,
}: {
  icon: React.ElementType
  primary: string
  secondary?: string
  badge?: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-elevated transition-colors text-left"
    >
      <div className="h-7 w-7 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
        <Icon className="h-3.5 w-3.5 text-accent/70" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-500 text-ink truncate">{primary}</p>
        {secondary && <p className="text-xs text-ink/40 truncate">{secondary}</p>}
      </div>
      {badge && (
        <span className={`text-[10px] font-600 px-2 py-0.5 rounded-full shrink-0 ${STATUS_BADGE[badge] ?? 'bg-ink/10 text-ink/50'}`}>
          {badge}
        </span>
      )}
    </button>
  )
}

export function SearchModal() {
  const [open, setOpen]       = useState(false)
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const inputRef              = useRef<HTMLInputElement>(null)
  const router                = useRouter()
  const debouncedQuery        = useDebounce(query, 300)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(o => !o)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    function onOpen() { setOpen(true) }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('search:open', onOpen)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('search:open', onOpen)
    }
  }, [])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery('')
      setResults(null)
    }
  }, [open])

  useEffect(() => {
    if (debouncedQuery.length < 2) { setResults(null); return }
    setLoading(true)
    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then(r => r.json())
      .then((data: SearchResults) => { setResults(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [debouncedQuery])

  function navigate(href: string) {
    setOpen(false)
    router.push(href)
  }

  const hasResults = results && (
    results.issues.length > 0 ||
    results.subscribers.length > 0 ||
    results.newsletters.length > 0
  )

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative z-10 w-full max-w-xl rounded-xl border border-line bg-surface shadow-2xl animate-scale-in overflow-hidden">

        {/* Input */}
        <div className="flex items-center gap-3 px-4 border-b border-line">
          {loading
            ? <Loader2 className="h-4 w-4 text-ink/30 shrink-0 animate-spin" />
            : <Search className="h-4 w-4 text-ink/30 shrink-0" />
          }
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search issues, subscribers, newsletters…"
            className="flex-1 py-4 bg-transparent text-sm text-ink placeholder:text-ink/30 focus:outline-none"
          />
          <button onClick={() => setOpen(false)} className="p-1 text-ink/20 hover:text-ink/50 transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Results */}
        {results ? (
          <div className="max-h-[55vh] overflow-y-auto">
            {!hasResults ? (
              <p className="text-center text-xs text-ink/30 py-8">No results for &ldquo;{query}&rdquo;</p>
            ) : (
              <>
                {results.newsletters.length > 0 && (
                  <ResultGroup label="Newsletters">
                    {results.newsletters.map(nl => (
                      <ResultItem
                        key={nl.id}
                        icon={Newspaper}
                        primary={nl.name}
                        secondary={nl.slug}
                        badge={nl.status}
                        onClick={() => navigate('/newsletters')}
                      />
                    ))}
                  </ResultGroup>
                )}
                {results.issues.length > 0 && (
                  <ResultGroup label="Issues">
                    {results.issues.map(issue => (
                      <ResultItem
                        key={issue.id}
                        icon={FileText}
                        primary={issue.title}
                        secondary={issue.newsletters?.name ?? ''}
                        badge={issue.status}
                        onClick={() => navigate(`/newsletters/${issue.newsletter_id}/issues/${issue.id}`)}
                      />
                    ))}
                  </ResultGroup>
                )}
                {results.subscribers.length > 0 && (
                  <ResultGroup label="Subscribers">
                    {results.subscribers.map(sub => (
                      <ResultItem
                        key={sub.id}
                        icon={Users}
                        primary={sub.email}
                        secondary={sub.name ?? undefined}
                        badge={sub.status}
                        onClick={() => navigate('/subscribers')}
                      />
                    ))}
                  </ResultGroup>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="px-4 py-8 text-center">
            <p className="text-xs text-ink/30">Type at least 2 characters to search</p>
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-line bg-elevated/30 flex items-center gap-3">
          <span className="text-[10px] text-ink/30">
            <kbd className="px-1.5 py-0.5 bg-surface border border-line rounded text-[9px] font-mono">Esc</kbd>{' '}close
          </span>
          <span className="text-[10px] text-ink/30">
            <kbd className="px-1.5 py-0.5 bg-surface border border-line rounded text-[9px] font-mono">↵</kbd>{' '}open
          </span>
        </div>

      </div>
    </div>
  )
}
