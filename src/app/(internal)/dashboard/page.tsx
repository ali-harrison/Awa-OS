import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Card, CardHeader, CardTitle, EmptyState, Stat } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { RiverMap } from '@/components/river/RiverMap'
import { NEXT_ACTIONS, type InvoiceStatus, type ProjectStatus } from '@/types'
import { daysSince, formatCompactNZD, formatDate, nzDate, nzGreeting } from '@/lib/format'
import { displayStatus } from '@/lib/invoices'

function isStale(status: string, stageUpdatedAt: string) {
  const days = daysSince(stageUpdatedAt)
  return (status === 'questionnaire_sent' && days > 5) || (status === 'proposal_sent' && days > 3)
}

function firstName(email: string | undefined) {
  const name = email?.split('@')[0].split(/[._-]/)[0] ?? ''
  return name.charAt(0).toUpperCase() + name.slice(1)
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const [
    { data: { user } },
    { data: projects },
    { data: invoices },
    { data: clients },
    { data: events },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('projects')
      .select('*, client:clients(id, name, company)')
      .neq('status', 'complete')
      .order('stage_updated_at', { ascending: true }),
    supabase.from('invoices').select('amount, status, paid_at, due_date'),
    supabase.from('clients').select('id, status'),
    supabase
      .from('calendar_events')
      .select('id, title, type, start_at')
      .gte('start_at', new Date().toISOString())
      .order('start_at')
      .limit(5),
  ])

  // ── Stats ──────────────────────────────────────────────────────────────────

  const thisMonth = nzDate().slice(0, 7)
  const revenueMTD = (invoices ?? [])
    .filter((i) => i.status === 'paid' && i.paid_at && nzDate(i.paid_at).startsWith(thisMonth))
    .reduce((s, i) => s + i.amount, 0)

  const unpaid = (invoices ?? []).filter((i) =>
    ['sent', 'overdue'].includes(displayStatus({ status: i.status as InvoiceStatus, due_date: i.due_date }))
  )
  const outstanding = unpaid.reduce((s, i) => s + i.amount, 0)
  const outstandingCount = unpaid.length

  const allProjects = (projects ?? []).map((p) => {
    const client = p.client as { id: string; name: string; company: string | null } | null
    return { ...p, clientName: client?.company ?? client?.name ?? '—', stale: isStale(p.status, p.stage_updated_at) }
  })

  const activeProjects = allProjects.filter((p) =>
    ['in_progress', 'review', 'deposit_paid'].includes(p.status)
  )
  const staleCount = allProjects.filter((p) => p.stale).length

  const pipeline = (clients ?? [])
    .filter((c) => ['lead', 'prospect'].includes(c.status))
    .length

  const stats = [
    { label: 'Revenue this month', value: formatCompactNZD(revenueMTD), note: 'NZD incl. GST', tone: 'text-pounamu' },
    {
      label: 'Active projects',
      value: String(activeProjects.length),
      note: `${activeProjects.filter((p) => p.status === 'in_progress').length} in progress`,
    },
    {
      label: 'Outstanding',
      value: formatCompactNZD(outstanding),
      note: `${outstandingCount} invoice${outstandingCount !== 1 ? 's' : ''}`,
      tone: outstanding > 0 ? 'text-amber' : 'text-bone',
    },
    { label: 'Pipeline', value: String(pipeline), note: `lead${pipeline !== 1 ? 's' : ''} + prospects` },
  ]

  return (
    <PageWrapper className="!pt-6 md:!pt-9">
      {/* Greeting */}
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">{formatDate(new Date(), 'full')}</p>
          <h1 className="font-display text-[44px] leading-[1.05] text-bone md:text-[52px]">
            {nzGreeting()}{user?.email ? `, ${firstName(user.email)}` : ''}.
          </h1>
          <p className="mt-2 text-muted">
            {staleCount > 0
              ? `${staleCount} project${staleCount !== 1 ? 's have' : ' has'} gone quiet and could use a nudge.`
              : 'Everything is flowing.'}
          </p>
        </div>
        <Link href="/clients">
          <Button variant="secondary">+ New client</Button>
        </Link>
      </div>

      {/* Te awa: the pipeline as a river */}
      <Card className="mb-4 overflow-hidden" padding="none">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 px-5 pt-4">
          <h2 className="font-display text-2xl text-bone">Te awa</h2>
          <p className="text-[13px] text-dim">
            {allProjects.length} project{allProjects.length !== 1 ? 's' : ''} on the river, from first contact to complete
          </p>
        </div>
        <div className="px-5 pb-3">
          <RiverMap projects={allProjects} />
        </div>
      </Card>

      {/* Stats */}
      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <Stat key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_320px]">
        {/* Active projects */}
        <Card padding="none">
          <CardHeader>
            <CardTitle>Active projects</CardTitle>
            <Link href="/projects">
              <Button size="sm" variant="ghost">View all</Button>
            </Link>
          </CardHeader>

          {allProjects.length === 0 ? (
            <div className="p-5">
              <EmptyState title="No active projects">
                <Link href="/projects">
                  <Button size="sm" variant="secondary">Create your first project</Button>
                </Link>
              </EmptyState>
            </div>
          ) : (
            <div className="divide-y divide-line">
              {allProjects.map((p) => (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}`}
                  className="flex items-center gap-3.5 px-5 py-3.5 transition-colors duration-150 hover:bg-bone/[0.03]"
                >
                  <Avatar name={p.clientName} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-bone">{p.name}</p>
                    <p className="truncate text-[13px] text-dim">
                      {p.clientName} · {NEXT_ACTIONS[p.status as ProjectStatus]}
                    </p>
                  </div>
                  <div className="hidden shrink-0 items-center gap-2 sm:flex">
                    {p.stale && <Badge variant="red" className="normal-case">{daysSince(p.stage_updated_at)} days quiet</Badge>}
                    <Badge variant={p.status as ProjectStatus} dot>{p.status.replace(/_/g, ' ')}</Badge>
                  </div>
                  {p.value != null && (
                    <p className="w-14 shrink-0 text-right font-mono text-sm text-bone">{formatCompactNZD(p.value * 100)}</p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Coming up */}
        <Card padding="none">
          <CardHeader>
            <CardTitle>Coming up</CardTitle>
            <Link href="/calendar">
              <Button size="sm" variant="ghost">Calendar</Button>
            </Link>
          </CardHeader>
          {(events ?? []).length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-dim">Nothing scheduled.</p>
          ) : (
            <div className="divide-y divide-line">
              {(events ?? []).map((event) => (
                <div key={event.id} className="flex items-center gap-3.5 px-5 py-3">
                  <p className="w-14 shrink-0 font-mono text-xs text-amber">{formatDate(event.start_at)}</p>
                  <p className="min-w-0 truncate text-sm text-bone">{event.title}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </PageWrapper>
  )
}
