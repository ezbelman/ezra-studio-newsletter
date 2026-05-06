'use client'
import * as RadixToast from '@radix-ui/react-toast'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { useToastStore, removeToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

export function Toaster() {
  const { toasts } = useToastStore()

  return (
    <RadixToast.Provider swipeDirection="right" duration={4000}>
      {toasts.map(t => (
        <RadixToast.Root
          key={t.id}
          open
          onOpenChange={open => { if (!open) removeToast(t.id) }}
          className={cn(
            'flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg w-80',
            'animate-scale-in',
            t.variant === 'success'     && 'bg-elevated border-success/40',
            t.variant === 'destructive' && 'bg-elevated border-danger/40',
            t.variant === 'default'     && 'bg-elevated border-line',
            !t.variant                  && 'bg-elevated border-line',
          )}
        >
          <span className="shrink-0 mt-0.5">
            {t.variant === 'success'     && <CheckCircle className="h-4 w-4 text-lime" />}
            {t.variant === 'destructive' && <AlertCircle className="h-4 w-4 text-red-500" />}
            {(t.variant === 'default' || !t.variant) && <Info className="h-4 w-4 text-cyan" />}
          </span>
          <div className="flex-1 min-w-0">
            <RadixToast.Title className="text-sm font-700 text-ink leading-snug">
              {t.title}
            </RadixToast.Title>
            {t.description && (
              <RadixToast.Description className="text-xs text-ink-muted mt-0.5 leading-snug">
                {t.description}
              </RadixToast.Description>
            )}
          </div>
          <RadixToast.Close
            onClick={() => removeToast(t.id)}
            className="shrink-0 mt-0.5 text-ink-muted hover:text-ink transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </RadixToast.Close>
        </RadixToast.Root>
      ))}
      <RadixToast.Viewport className="fixed bottom-4 right-4 flex flex-col gap-2 z-50 outline-none" />
    </RadixToast.Provider>
  )
}
