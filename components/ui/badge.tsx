import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-700 uppercase tracking-wider',
  {
    variants: {
      variant: {
        default:   'bg-navy/10 text-navy',
        cyan:      'bg-cyan/15 text-navy-soft',
        lime:      'bg-lime/30 text-navy-deep',
        draft:     'bg-gray-100 text-gray-600',
        pending:   'bg-amber-100 text-amber-700',
        approved:  'bg-blue-100 text-blue-700',
        published: 'bg-lime/30 text-navy-deep',
        scheduled: 'bg-purple-100 text-purple-700',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
