'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'

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

const TYPE_ICON: Record<string, string> = {
  email: '◇',
  audit: '◈',
  change: '◧',
}

const TYPE_COLOUR: Record<string, string> = {
  email: 'text-[#C9963A]',
  audit: 'text-[#4CAF7D]',
  change: 'text-[#8A8580]',
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
      className="text-[#2A2A2A] hover:text-[#C9963A] font-mono text-[10px] ml-2 transition-colors duration-150 cursor-pointer"
      title="Copy to clipboard"
    >
      [copy]
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
  const absoluteTime = new Date(log.created_at).toLocaleString('en-NZ', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className="flex gap-4 px-4 py-3 border-b border-[#1A1A1A] hover:bg-[#0D0D0D] transition-colors duration-100">
      {/* Icon */}
      <span className={`font-mono text-base w-4 flex-shrink-0 mt-0.5 ${TYPE_COLOUR[log.type]}`}>
        {TYPE_ICON[log.type]}
      </span>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-[#F5F0E8] font-mono text-sm">
            {log.action ?? '—'}
          </span>
          {log.entity && (
            <span className="text-[#555050] font-mono text-xs">
              {log.entity}
              {log.entity_id && (
                <span className="text-[#2A2A2A] ml-1">
                  {log.entity_id.slice(0, 8)}…
                </span>
              )}
            </span>
          )}
        </div>

        {/* Email meta */}
        {isEmail ? (
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5">
            {emailTo ? (
              <span className="text-[#8A8580] font-mono text-xs">
                to: <span className="text-[#F5F0E8]">{emailTo}</span>
              </span>
            ) : null}
            {emailSubject ? (
              <span className="text-[#8A8580] font-mono text-xs truncate max-w-xs">
                {emailSubject}
              </span>
            ) : null}
            {resendId ? (
              <span className="text-[#555050] font-mono text-xs">
                id: {resendId}
                <CopyButton value={resendId} />
              </span>
            ) : null}
          </div>
        ) : null}

        {/* Change meta */}
        {log.type === 'change' && changeField ? (
          <div className="mt-1">
            <span className="text-[#555050] font-mono text-xs">
              {changeField}:{' '}
              <span className="text-[#E05252]">{changeOld}</span>
              {' → '}
              <span className="text-[#4CAF7D]">{changeNew}</span>
            </span>
          </div>
        ) : null}

        {/* Performer */}
        {log.performed_by && (
          <span className="text-[#2A2A2A] font-mono text-[10px] mt-0.5 block">
            {log.performed_by.slice(0, 8)}…
          </span>
        )}
      </div>

      {/* Timestamp */}
      <div className="flex-shrink-0 text-right" title={absoluteTime}>
        <span className="text-[#555050] font-mono text-xs cursor-default">
          {relativeTime(log.created_at)}
        </span>
      </div>
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
      <div className="flex gap-0 border-b border-[#1A1A1A]">
        {TABS.map(({ label, value }) => {
          const isActive = activeType === value
          return (
            <button
              key={label}
              onClick={() => navigate(value, 1)}
              className={[
                'px-4 py-2.5 font-mono text-xs uppercase tracking-widest transition-colors duration-150 border-b-2 -mb-px cursor-pointer',
                isActive
                  ? 'text-[#F5F0E8] border-[#C9963A]'
                  : 'text-[#555050] border-transparent hover:text-[#8A8580]',
              ].join(' ')}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Feed */}
      <div className="border border-[#1A1A1A]">
        {logs.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-[#555050] font-mono text-sm">No activity yet.</p>
          </div>
        ) : (
          logs.map((log) => <LogRow key={log.id} log={log} />)
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(activeType, currentPage - 1)}
            disabled={currentPage <= 1}
            className="text-[#555050] hover:text-[#F5F0E8] disabled:opacity-20 font-mono text-xs uppercase tracking-widest transition-colors duration-150 cursor-pointer disabled:cursor-default"
          >
            ← Prev
          </button>
          <span className="text-[#555050] font-mono text-xs">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => navigate(activeType, currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="text-[#555050] hover:text-[#F5F0E8] disabled:opacity-20 font-mono text-xs uppercase tracking-widest transition-colors duration-150 cursor-pointer disabled:cursor-default"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
