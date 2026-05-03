import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-xs font-700 uppercase tracking-widest text-ink-muted">
          {label}
        </label>
      )}
      <input
        id={id}
        ref={ref}
        className={cn(
          'h-10 w-full rounded-sm border border-line bg-white px-3 text-sm text-ink placeholder:text-ink-muted/50',
          'focus:outline-none focus:ring-2 focus:ring-cyan focus:border-cyan',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error && 'border-red-400 focus:ring-red-400',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
)
Input.displayName = 'Input'

export { Input }
