'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { ArrowLeftRight, Mail, ShieldCheck } from 'lucide-react'
import { Card, EmptyState } from '@/components/ui/Card'
import { formatDateTime } from '@/lib/format'

type LogEntry = {
  id: string
  created_at: string
  type: 'email' | 'audit' | 'change'
  entity: string | null
  entity_id: string | null
  action: string | null
  meta: Record<string, unknown>
  performed_by: string | null
}

const TYPE_STYLE = {
  email: { icon: Mail, tint: 'bg-amber/12 text-amber' },
  audit: { icon: ShieldCheck, tint: 'bg-pounamu/12 text-pounamu' },
  change: { icon: ArrowLeftRight, tint: 'bg-water/12 text-water' },
}

const TABS = [
  { label: 'All', value: null },
  { label: 'Emails', value: 'email' },
  { label: 'Audit', value: 'audit' },
  { label: 'Changes', value: 'change' },
] as const

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function CopyButton({ value }: { value: string }) {
  return (
    <button
      onClick={() => navigator.clipboard.writeText(value)}
      className="ml-2 cursor-pointer text-[11px] text-dim transition-colors duration-150 hover:text-amber"
      title="Copy to clipboard"
    >
      Copy
    </button>
  )
}

function LogRow({ log }: { log: LogEntry }) {
  const isEmail: boolean = log.type === 'email'
  const meta = log.meta ?? {}
  const emailTo = meta.to != null ? String(meta.to) : null
  const emailSubject = meta.subject != null ? String(meta.subject) : null
  const resendId = meta.resend_id != null ? String(meta.resend_id) : null
  const changeField = meta.field != null ? String(meta.field) : null
  const changeOld = meta.old_value != null ? String(meta.old_value) : '—'
  const changeNew = meta.new_value != null ? String(meta.new_value) : '—'
  const absoluteTime = formatDateTime(log.created_at)

  const { icon: Icon, tint } = TYPE_STYLE[log.type]

  return (
    <div className="flex gap-3.5 px-5 py-3.5">
      <span className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ${tint}`}>
        <Icon size={15} strokeWidth={1.75} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-sm font-medium text-bone">{log.action?.replace(/_/g, ' ') ?? '—'}</span>
          {log.entity && <span className="text-[13px] text-dim">{log.entity}</span>}
        </div>

        {isEmail ? (
          <div className="mt-0.5 flex flex-wrap gap-x-3 text-[13px] text-dim">
            {emailTo ? <span>to {emailTo}</span> : null}
            {emailSubject ? <span className="max-w-sm truncate">{emailSubject}</span> : null}
            {resendId ? (
              <span className="font-mono text-xs">
                {resendId}
                <CopyButton value={resendId} />
              </span>
            ) : null}
          </div>
        ) : null}

        {log.type === 'change' && changeField ? (
          <p className="mt-0.5 text-[13px] text-dim">
            {changeField}: <span className="text-muted">{changeOld}</span> → <span className="text-bone">{changeNew}</span>
          </p>
        ) : null}
      </div>

      <span
        className="shrink-0 cursor-default font-mono text-xs text-dim"
        title={absoluteTime}
        suppressHydrationWarning
      >
        {relativeTime(log.created_at)}
      </span>
    </div>
  )
}

export function ActivityFeed({
  logs,
  activeType,
  currentPage,
  totalPages,
}: {
  logs: LogEntry[]
  activeType: 'email' | 'audit' | 'change' | null
  currentPage: number
  totalPages: number
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function navigate(type: string | null, page: number) {
    const params = new URLSearchParams(searchParams.toString())
    if (type) params.set('type', type)
    else params.delete('type')
    if (page > 1) params.set('page', String(page))
    else params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-line">
        {TABS.map(({ label, value }) => {
          const isActive = activeType === value
          return (
            <button
              key={label}
              onClick={() => navigate(value, 1)}
              className={[
                '-mb-px cursor-pointer border-b-2 px-3 py-2.5 text-sm transition-colors duration-150',
                isActive ? 'border-amber font-medium text-bone' : 'border-transparent text-dim hover:text-muted',
              ].join(' ')}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Feed */}
      {logs.length === 0 ? (
        <EmptyState title="No activity yet" />
      ) : (
        <Card padding="none" className="divide-y divide-line overflow-hidden">
          {logs.map((log) => <LogRow key={log.id} log={log} />)}
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <button
            onClick={() => navigate(activeType, currentPage - 1)}
            disabled={currentPage <= 1}
            className="cursor-pointer text-dim transition-colors duration-150 hover:text-bone disabled:cursor-default disabled:opacity-30"
          >
            ← Newer
          </button>
          <span className="font-mono text-xs text-dim">{currentPage} / {totalPages}</span>
          <button
            onClick={() => navigate(activeType, currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="cursor-pointer text-dim transition-colors duration-150 hover:text-bone disabled:cursor-default disabled:opacity-30"
          >
            Older →
          </button>
        </div>
      )}
    </div>
  )
}
