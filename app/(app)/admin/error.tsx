'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function AdminError({ error, reset }: Props) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-8">
      <div className="text-center max-w-sm animate-fade-up">
        <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="h-5 w-5 text-red-500" />
        </div>
        <h1 className="text-xl font-display font-700 text-ink mb-2">Something went wrong</h1>
        <p className="text-sm text-ink-muted mb-6">
          An unexpected error occurred in the admin panel.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={reset}>Try again</Button>
          <Button variant="primary" asChild>
            <Link href="/admin">Admin home</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
