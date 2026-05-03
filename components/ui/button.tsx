'use client'
import { forwardRef } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-sm text-sm font-700 transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        default:   'bg-navy text-white hover:bg-navy-soft focus-visible:ring-navy',
        primary:   'bg-cyan text-navy-deep font-bold hover:bg-cyan-bright focus-visible:ring-cyan',
        outline:   'border border-line bg-transparent text-ink hover:bg-bg focus-visible:ring-navy',
        ghost:     'text-ink-muted hover:bg-bg hover:text-ink',
        danger:    'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600',
        lime:      'bg-lime text-navy-deep font-bold hover:opacity-90 focus-visible:ring-lime',
      },
      size: {
        sm:      'h-8 px-3 text-xs',
        default: 'h-10 px-5',
        lg:      'h-12 px-7 text-base',
        icon:    'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
