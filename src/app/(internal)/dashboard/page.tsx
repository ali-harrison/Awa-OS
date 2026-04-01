import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { NEXT_ACTIONS, type ProjectStatus } from '@/types'
import { signOut } from '@/lib/supabase/actions'

function formatNZD(value: number) {
  const dollars = value / 100
  if (dollars >= 1000) {
    const k = dollars / 1000
    return `$${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`
  }
  return `$${Math.round(dollars)}`
}

function daysSince(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}

function todayLabel() {
  return new Date().toLocaleDateString('en-NZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [
    { data: projects },
    { data: invoices },
    { data: clients },
  ] = await Promise.all([
    supabase
      .from('projects')
      .select('*, client:clients(id, name, company)')
      .neq('status', 'complete')
      .order('stage_updated_at', { ascending: true }),
    supabase.from('invoices').select('amount, status, paid_at, due_date'),
    supabase.from('clients').select('id, status'),
  ])

  // ── Stats ──────────────────────────────────────────────────────────────────

  const revenueMTD = (invoices ?? [])
    .filter((i) => i.status === 'paid' && i.paid_at && i.paid_at >= startOfMonth)
    .reduce((s, i) => s + i.amount, 0)

  const outstanding = (invoices ?? [])
    .filter((i) => i.status === 'sent')
    .reduce((s, i) => s + i.amount, 0)

  const outstandingCount = (invoices ?? []).filter((i) => i.status === 'sent').length

  const activeProjects = (projects ?? []).filter((p) =>
    ['in_progress', 'review', 'deposit_paid'].includes(p.status)
  )

  const pipeline = (clients ?? [])
    .filter((c) => ['lead', 'prospect'].includes(c.status))
    .length

  const stats = [
    {
      label: 'Revenue MTD',
      value: formatNZD(revenueMTD),
      sub: 'NZD inc. GST',
    },
    {
      label: 'Active Projects',
      value: String(activeProjects.length),
      sub: `${activeProjects.filter((p) => p.status === 'in_progress').length} in progress`,
    },
    {
      label: 'Outstanding',
      value: formatNZD(outstanding),
      sub: `${outstandingCount} invoice${outstandingCount !== 1 ? 's' : ''}`,
    },
    {
      label: 'Pipeline',
      value: String(pipeline),
      sub: `lead${pipeline !== 1 ? 's' : ''} + prospects`,
    },
  ]

  return (
    <>
      <Header
        title="Dashboard"
        subtitle={todayLabel()}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/clients">
              <Button size="sm" variant="secondary">+ New Client</Button>
            </Link>
            <form action={signOut}>
              <Button size="sm" variant="ghost" type="submit">Sign out</Button>
            </form>
          </div>
        }
      />
      <PageWrapper>
        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {stats.map((stat) => (
            <Card key={stat.label} surface={1} padding="md">
              <p className="text-[#555050] text-[10px] font-mono uppercase tracking-widest mb-2">
                {stat.label}
              </p>
              <p className="text-[#F5F0E8] text-2xl font-mono font-semibold tracking-tight">
                {stat.value}
              </p>
              <p className="text-[#555050] text-xs font-mono mt-1">{stat.sub}</p>
            </Card>
          ))}
        </div>

        {/* Active projects */}
        <Card surface={1} padding="none">
          <CardHeader className="px-4 pt-4 pb-3 border-b border-[#1A1A1A]">
            <CardTitle>Active Projects</CardTitle>
            <Link href="/projects">
              <Button size="sm" variant="ghost">View all</Button>
            </Link>
          </CardHeader>

          {(projects ?? []).length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="text-[#555050] font-mono text-sm">No active projects.</p>
              <Link href="/projects">
                <Button size="sm" variant="secondary" className="mt-4">Create your first project</Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[#1A1A1A]">
              {(projects ?? []).map((p) => {
                const days = daysSince(p.stage_updated_at)
                const isStale =
                  (p.status === 'questionnaire_sent' && days > 5) ||
                  (p.status === 'proposal_sent' && days > 3)
                const client = p.client as { id: string; name: string; company: string | null } | null

                return (
                  <div key={p.id} className="px-4 py-3 flex items-start gap-4 hover:bg-[#111111] transition-colors duration-100">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={p.status as ProjectStatus}>{p.status.replace(/_/g, ' ')}</Badge>
                        {isStale && <Badge variant="amber">{days}d</Badge>}
                      </div>
                      <p className="text-[#F5F0E8] text-sm font-mono truncate">{p.name}</p>
                      <p className="text-[#555050] text-xs font-mono mt-0.5">
                        {client?.company ?? client?.name ?? '—'}
                      </p>
                    </div>

                    <div className="flex-1 min-w-0 hidden md:block">
                      <p className="text-[#8A8580] text-xs font-mono leading-relaxed">
                        → {NEXT_ACTIONS[p.status as ProjectStatus]}
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      {p.value != null && (
                        <p className="text-[#F5F0E8] text-sm font-mono">{formatNZD(p.value)}</p>
                      )}
                      <Link href={`/projects/${p.id}`}>
                        <Button size="sm" variant="ghost" className="mt-1 text-[10px]">
                          Open →
                        </Button>
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </PageWrapper>
    </>
  )
}
