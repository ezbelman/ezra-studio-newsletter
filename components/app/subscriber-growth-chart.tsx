import { TrendingUp } from 'lucide-react'

interface DayData {
  label: string
  value: number
}

interface Props {
  data:  DayData[]
  total: number
  added: number
}

function MiniAreaChart({ data }: { data: DayData[] }) {
  if (data.length < 2) {
    return <div className="h-16 flex items-center justify-center text-xs text-ink/20">No data yet</div>
  }
  const W   = 320
  const H   = 56
  const max = Math.max(...data.map(d => d.value), 1)
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * W
    const y = H - 4 - (d.value / max) * (H - 8)
    return `${x},${y}`
  })
  const polyline = pts.join(' ')
  const first    = pts[0]!.split(',')
  const last     = pts[pts.length - 1]!.split(',')
  const area     = `${first[0]},${H} ` + polyline + ` ${last[0]},${H}`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-14" preserveAspectRatio="none">
      <defs>
        <linearGradient id="growth-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#7B5CF0" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#7B5CF0" stopOpacity="0"   />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#growth-grad)" />
      <polyline
        points={polyline}
        fill="none"
        stroke="#7B5CF0"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function SubscriberGrowthChart({ data, total, added }: Props) {
  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-elevated">
            <TrendingUp className="h-3.5 w-3.5 text-ink-muted/60" />
          </div>
          <p className="text-[11px] font-600 uppercase tracking-wider text-ink-muted">
            Subscriber growth
          </p>
        </div>
        {added > 0 && (
          <span className="text-[11px] font-600 text-green-500">+{added} this month</span>
        )}
      </div>
      <p className="font-display text-3xl font-700 leading-none text-ink mb-3">
        {total.toLocaleString()}
      </p>
      <MiniAreaChart data={data} />
      <p className="text-[10px] text-ink-muted/40 mt-1.5 text-right">Last 30 days</p>
    </div>
  )
}
