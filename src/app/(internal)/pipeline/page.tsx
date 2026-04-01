import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'
import { Badge } from '@/components/ui/Badge'
import { NEXT_ACTIONS, type ProjectStatus } from '@/types'
import type { Client, Project } from '@/types'

const PIPELINE_COLUMNS: { status: ProjectStatus; label: string }[] = [
  { status: 'onboarding', label: 'Onboarding' },
  { status: 'questionnaire_sent', label: 'Questionnaire' },
  { status: 'questionnaire_received', label: 'Q. Received' },
  { status: 'proposal_sent', label: 'Proposal' },
  { status: 'contract_sent', label: 'Contract' },
  { status: 'deposit_pending', label: 'Deposit' },
  { status: 'deposit_paid', label: 'Dep. Paid' },
  { status: 'in_progress', label: 'In Progress' },
  { status: 'review', label: 'Review' },
  { status: 'complete', label: 'Complete' },
]

function formatNZD(value: number) {
  return new Intl.NumberFormat('en-NZ', { style: 'currency', currency: 'NZD', minimumFractionDigits: 0 }).format(value)
}

function daysSince(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}

type ProjectWithClient = Project & { client: Pick<Client, 'id' | 'name' | 'company'> }

export default async function PipelinePage() {
  const supabase = await createClient()

  const { data: projects } = await supabase
    .from('projects')
    .select('*, client:clients(id, name, company)')
    .order('stage_updated_at', { ascending: true })

  const all = (projects ?? []) as ProjectWithClient[]

  const byStatus = Object.fromEntries(
    PIPELINE_COLUMNS.map(({ status }) => [
      status,
      all.filter((p) => p.status === status),
    ])
  )

  const activeCount = all.filter((p) => p.status !== 'complete').length

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Pipeline"
        subtitle={`${activeCount} active project${activeCount !== 1 ? 's' : ''}`}
      />

      {/* Full-width scrollable board — no PageWrapper so it fills the screen */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden px-6 py-5">
        <div className="flex gap-3 h-full min-w-max">
          {PIPELINE_COLUMNS.map(({ status, label }) => {
            const cards = byStatus[status] ?? []
            const colValue = cards.reduce((s, p) => s + (p.value ?? 0), 0)

            return (
              <div key={status} className="flex flex-col w-56 flex-shrink-0">
                {/* Column header */}
                <div className="flex items-center justify-between mb-2 px-0.5">
                  <div className="flex items-center gap-2">
                    <Badge variant={status}>{label}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {colValue > 0 && (
                      <span className="text-[#555050] font-mono text-[9px]">
                        {formatNZD(colValue)}
                      </span>
                    )}
                    <span className="text-[#2A2A2A] font-mono text-[9px] border border-[#2A2A2A] px-1">
                      {cards.length}
                    </span>
                  </div>
                </div>

                {/* Cards */}
                <div className="flex flex-col gap-2 overflow-y-auto flex-1 pb-2">
                  {cards.map((p) => {
                    const days = daysSince(p.stage_updated_at)
                    const isStale =
                      (p.status === 'questionnaire_sent' && days > 5) ||
                      (p.status === 'proposal_sent' && days > 3)

                    return (
                      <Link
                        key={p.id}
                        href={`/projects/${p.id}`}
                        className="block border border-[#1A1A1A] hover:border-[#2A2A2A] bg-[#111111] hover:bg-[#1A1A1A] px-3 py-3 transition-colors duration-100 group"
                      >
                        <p className="text-[#F5F0E8] font-mono text-xs font-medium truncate mb-0.5">
                          {p.name}
                        </p>
                        <p className="text-[#555050] font-mono text-[10px] truncate mb-2">
                          {p.client?.company ?? p.client?.name ?? '—'}
                        </p>

                        {/* Next action */}
                        <p className="text-[#555050] font-mono text-[9px] leading-relaxed mb-2 line-clamp-2">
                          → {NEXT_ACTIONS[p.status]}
                        </p>

                        <div className="flex items-center justify-between">
                          {p.value != null ? (
                            <span className="text-[#8A8580] font-mono text-[10px]">
                              {formatNZD(p.value)}
                            </span>
                          ) : (
                            <span />
                          )}
                          {isStale && (
                            <Badge variant="amber">{days}d</Badge>
                          )}
                        </div>
                      </Link>
                    )
                  })}

                  {cards.length === 0 && (
                    <div className="border border-dashed border-[#1A1A1A] px-3 py-6 text-center">
                      <p className="text-[#2A2A2A] font-mono text-[10px]">—</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
