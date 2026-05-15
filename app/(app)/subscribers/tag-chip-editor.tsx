'use client'

import { useState, useRef, useTransition } from 'react'
import { X, Plus, Loader2 } from 'lucide-react'
import { updateSubscriberTags } from './tag-actions'

interface Props {
  subscriberId: string
  initialTags: string[]
}

export function TagChipEditor({ subscriberId, initialTags }: Props) {
  const [tags,    setTags]    = useState<string[]>(initialTags)
  const [input,   setInput]   = useState('')
  const [editing, setEditing] = useState(false)
  const [error,   setError]   = useState('')
  const [pending, startTransition] = useTransition()
  const inputRef  = useRef<HTMLInputElement>(null)
  const escapeRef = useRef(false)

  async function save(nextTags: string[]) {
    setError('')
    startTransition(async () => {
      const res = await updateSubscriberTags(subscriberId, nextTags)
      if (res.error) setError(res.error)
      else setTags(nextTags)
    })
  }

  function addTag() {
    const tag = input.trim().toLowerCase()
    if (!tag || tags.includes(tag)) { setInput(''); return }
    const next = [...tags, tag]
    setInput('')
    save(next)
  }

  function removeTag(tag: string) {
    save(tags.filter(t => t !== tag))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag() }
    if (e.key === 'Escape') { escapeRef.current = true; setEditing(false); setInput('') }
    if (e.key === 'Backspace' && !input && tags.length > 0) removeTag(tags[tags.length - 1]!)
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      {tags.map(tag => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-500 bg-accent/10 text-accent border border-accent/20"
        >
          {tag}
          <button
            onClick={() => removeTag(tag)}
            className="text-accent/50 hover:text-accent transition-colors"
            aria-label={`Remove tag ${tag}`}
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </span>
      ))}

      {pending && <Loader2 className="h-3 w-3 animate-spin text-ink/30" />}

      {editing ? (
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => { addTag(); setEditing(false) }}
          placeholder="add tag…"
          className="text-[11px] text-ink placeholder:text-ink/20 bg-transparent focus:outline-none w-20 border-b border-accent/50"
          autoFocus
        />
      ) : (
        <button
          onClick={() => { setEditing(true); setTimeout(() => inputRef.current?.focus(), 0) }}
          className="inline-flex items-center gap-0.5 text-[11px] text-ink/30 hover:text-accent transition-colors"
          aria-label="Add tag"
        >
          <Plus className="h-3 w-3" />
        </button>
      )}

      {error && <span className="text-[10px] text-danger">{error}</span>}
    </div>
  )
}
