import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Calendar, ChevronLeft, ChevronRight, Plus } from 'lucide-react'

export const metadata = { title: 'Calendar' }

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  return { firstDay, daysInMonth }
}

const STATUS_COLORS: Record<string, string> = {
  draft:            'bg-ink/10 text-ink/50',
  pending_approval: 'bg-warning/15 text-warning',
  approved:         'bg-accent-blue/15 text-accent-blue',
  scheduled:        'bg-accent/15 text-accent',
  published:        'bg-success/15 text-success',
}

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .single()

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const { firstDay, daysInMonth } = getMonthDays(year, month)

  const monthStart = new Date(year, month, 1).toISOString()
  const monthEnd   = new Date(year, month + 1, 0, 23, 59, 59).toISOString()

  const { data: issues } = membership ? await supabase
    .from('issues')
    .select('id, title, status, issue_date, scheduled_at, newsletter_id, newsletters(name)')
    .eq('org_id', membership.org_id)
    .or(`issue_date.gte.${monthStart},scheduled_at.gte.${monthStart}`)
    .or(`issue_date.lte.${monthEnd},scheduled_at.lte.${monthEnd}`)
    .order('issue_date', { ascending: true }) : { data: [] }

  const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  function getIssuesForDay(day: number) {
    const date = new Date(year, month, day)
    return (issues ?? []).filter(issue => {
      const d = issue.scheduled_at ?? issue.issue_date
      if (!d) return false
      const issueDate = new Date(d)
      return issueDate.getFullYear() === date.getFullYear() &&
        issueDate.getMonth() === date.getMonth() &&
        issueDate.getDate() === date.getDate()
    })
  }

  const cells: (number | null)[] = [
    ...Array(firstDay === 0 ? 0 : firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="p-4 sm:p-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl font-600 text-ink">Calendar</h1>
          <p className="text-ink/50 text-sm mt-0.5">Schedule and track all newsletter issues</p>
        </div>
        <a
          href="/newsletters"
          className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-accent text-white text-sm font-500 hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          New Issue
        </a>
      </div>

      {/* Month nav */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg hover:bg-elevated transition-colors text-ink/40 hover:text-ink">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h2 className="text-lg font-600 text-ink min-w-[200px] text-center">{monthName}</h2>
          <button className="p-2 rounded-lg hover:bg-elevated transition-colors text-ink/40 hover:text-ink">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <button className="px-3 py-1.5 text-sm text-ink/50 hover:text-ink border border-line rounded-lg hover:bg-elevated transition-colors">
          Today
        </button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 flex-wrap mb-4">
        {Object.entries(STATUS_COLORS).map(([status, cls]) => (
          <div key={status} className="flex items-center gap-1.5">
            <span className={`inline-block w-2 h-2 rounded-full ${cls.split(' ')[0]}`} />
            <span className="text-xs text-ink/40 capitalize">{status.replace('_', ' ')}</span>
          </div>
        ))}
      </div>

      {/* Grid — horizontally scrollable on small screens */}
      <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
      <div className="border border-line rounded-xl overflow-hidden min-w-[560px]">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-line bg-elevated">
          {DAYS.map(d => (
            <div key={d} className="px-3 py-2 text-xs font-600 text-ink/40 uppercase tracking-wide">
              {d}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {Array.from({ length: cells.length / 7 }, (_, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b border-line last:border-b-0">
            {cells.slice(wi * 7, wi * 7 + 7).map((day, di) => {
              const isToday = day === now.getDate()
              const dayIssues = day ? getIssuesForDay(day) : []
              return (
                <div
                  key={di}
                  className={`min-h-[100px] p-2 border-r border-line last:border-r-0 ${
                    day ? 'bg-surface hover:bg-elevated/50' : 'bg-bg/50'
                  } transition-colors`}
                >
                  {day && (
                    <>
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-500 mb-1 ${
                        isToday
                          ? 'gradient-accent text-white'
                          : 'text-ink/60'
                      }`}>
                        {day}
                      </span>
                      <div className="space-y-1">
                        {dayIssues.map(issue => (
                          <a
                            key={issue.id}
                            href={`/newsletters/${(issue as any).newsletter_id}/issues/${issue.id}`}
                            className={`block px-1.5 py-0.5 rounded text-[11px] font-500 truncate ${STATUS_COLORS[issue.status] ?? 'bg-ink/10 text-ink/50'}`}
                          >
                            {issue.title}
                          </a>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      </div>
      {(!issues || issues.length === 0) && (
        <div className="text-center py-12 mt-4">
          <Calendar className="h-10 w-10 text-ink/20 mx-auto mb-3" />
          <p className="text-ink/40 text-sm">No issues scheduled this month</p>
        </div>
      )}
    </div>
  )
}
