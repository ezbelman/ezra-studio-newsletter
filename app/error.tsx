'use client'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html>
      <body className="bg-bg font-sans">
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center max-w-sm">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <h1 className="text-xl font-display font-700 text-ink mb-2">Something went wrong</h1>
            <p className="text-sm text-ink-muted mb-6">
              An unexpected error occurred. Try refreshing the page.
            </p>
            <Button variant="primary" onClick={reset}>Try again</Button>
          </div>
        </div>
      </body>
    </html>
  )
}
