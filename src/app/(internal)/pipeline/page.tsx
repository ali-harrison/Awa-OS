import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { River } from '@/components/river/River'
import { pointOnRiver } from '@/components/river/geometry'
import { daysSince, formatDollars } from '@/lib/format'
import { NEXT_ACTIONS, PROJECT_STAGES, STAGE_LABELS } from '@/types'
import type { Client, Project } from '@/types'

type ProjectRow = Project & { client: Pick<Client, 'id' | 'name' | 'company'> }

export default async function PipelinePage() {
  const supabase = await createClient()

  const { data: projects } = await supabase
    .from('projects')
    .select('*, client:clients(id, name, company)')
    .order('stage_updated_at', { ascending: true })

  const all = (projects ?? []) as ProjectRow[]
  const activeCount = all.filter((p) => p.status !== 'complete').length
  const activeValue = all.filter((p) => p.status !== 'complete').reduce((s, p) => s + (p.value ?? 0), 0)

  return (
    <div className="flex h-full flex-col">
      <Header
        title="Pipeline"
        subtitle={`${activeCount} active project${activeCount !== 1 ? 's' : ''} · ${formatDollars(activeValue)} on the river`}
      />

      <div className="flex-1 overflow-auto px-5 pb-6 md:px-8">
        <div className="relative min-w-max">
          {/* The river runs along the top of the board, and each stage hangs off it */}
          <div className="absolute inset-x-0 top-0 h-[84px]">
            <River />
          </div>

          <div className="flex gap-3">
            {PROJECT_STAGES.map((status, i) => {
              const cards = all.filter((p) => p.status === status)
              const columnValue = cards.reduce((s, p) => s + (p.value ?? 0), 0)
              const { top } = pointOnRiver((i + 0.5) / PROJECT_STAGES.length)

              return (
                <div key={status} className="flex w-60 shrink-0 flex-col">
                  <div className="relative h-[100px]">
                    <span
                      aria-hidden
                      className="absolute left-1/2 w-px bg-line-strong"
                      style={{ top: `${top * 0.84}%`, bottom: 0 }}
                    />
                    <span
                      aria-hidden
                      className="absolute left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-bone"
                      style={{ top: `${top * 0.84}%` }}
                    />
                  </div>

                  <div className="mb-2.5 flex items-center justify-between gap-2 rounded-xl bg-bone/[0.04] px-3 py-2">
                    <Badge variant={status} dot className="!bg-transparent !px-0">{STAGE_LABELS[status]}</Badge>
                    <span className="flex items-baseline gap-2 font-mono text-xs">
                      {columnValue > 0 && <span className="text-dim">{formatDollars(columnValue)}</span>}
                      <span className="text-bone">{cards.length}</span>
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    {cards.map((p) => {
                      const days = daysSince(p.stage_updated_at)
                      const isStale =
                        (p.status === 'questionnaire_sent' && days > 5) ||
                        (p.status === 'proposal_sent' && days > 3)
                      const clientName = p.client?.company ?? p.client?.name ?? '—'

                      return (
                        <Link
                          key={p.id}
                          href={`/projects/${p.id}`}
                          className="block rounded-xl border border-line bg-surface p-3.5 transition-all duration-150 hover:-translate-y-0.5 hover:border-line-strong"
                        >
                          <div className="mb-2 flex items-center gap-2.5">
                            <Avatar name={clientName} size="sm" />
                            <p className="truncate text-[13px] text-dim">{clientName}</p>
                          </div>
                          <p className="text-sm leading-snug font-medium text-bone">{p.name}</p>
                          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-dim">{NEXT_ACTIONS[p.status]}</p>
                          <div className="mt-2.5 flex items-center justify-between">
                            <span className="font-mono text-[13px] text-muted">
                              {p.value != null ? formatDollars(p.value) : ''}
                            </span>
                            {isStale && <Badge variant="red" className="normal-case">{days}d quiet</Badge>}
                          </div>
                        </Link>
                      )
                    })}

                    {cards.length === 0 && (
                      <div className="rounded-xl border border-dashed border-line px-3 py-6 text-center text-xs text-dim/60">
                        Nothing here
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
