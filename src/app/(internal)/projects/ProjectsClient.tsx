'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, EmptyState } from '@/components/ui/Card'
import { FormError, Input, Select } from '@/components/ui/Input'
import { SlideOver } from '@/components/ui/SlideOver'
import { createProjectAction, type CreateProjectResult } from './actions'
import { daysSince, formatDate, formatDollars } from '@/lib/format'
import { NEXT_ACTIONS, PROJECT_STAGES, PROJECT_STATUS_OPTIONS, STAGE_LABELS } from '@/types'
import type { Client, Project, ProjectTier } from '@/types'

const TIER_OPTIONS: { value: ProjectTier; label: string }[] = [
  { value: 'tier1', label: 'Tier 1' },
  { value: 'tier2', label: 'Tier 2' },
  { value: 'tier3', label: 'Tier 3' },
]

function NewProjectForm({ clients, defaultClientId, onClose }: {
  clients: Client[]
  defaultClientId?: string
  onClose: () => void
}) {
  const [result, setResult] = useState<CreateProjectResult>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    startTransition(async () => {
      const outcome = await createProjectAction(formData)
      setResult(outcome)
      if (!outcome) onClose()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Select
        label="Client"
        name="client_id"
        required
        defaultValue={defaultClientId ?? ''}
        options={[
          { value: '', label: 'Select client…' },
          ...clients.map((c) => ({ value: c.id, label: `${c.name}${c.company ? ` — ${c.company}` : ''}` })),
        ]}
      />
      <Input label="Project name" name="name" required placeholder="Website redesign" />
      <Select
        label="Tier"
        name="tier"
        defaultValue="tier1"
        options={[{ value: '', label: 'No tier' }, ...TIER_OPTIONS]}
      />
      <Input label="Value (NZD)" name="value" type="number" min="0" step="0.01" placeholder="3500" />
      <Input label="Start date" name="start_date" type="date" />
      <Input label="Estimated completion" name="estimated_completion" type="date" />
      <Select
        label="Initial status"
        name="status"
        defaultValue="onboarding"
        options={PROJECT_STATUS_OPTIONS}
      />
      <p className="rounded-[10px] bg-amber/8 px-3 py-2.5 text-[13px] text-muted">
        If status is set to <span className="font-medium text-amber">Onboarding</span>, welcome &amp; questionnaire emails will be sent automatically.
      </p>
      {result?.error && <FormError>{result.error}</FormError>}
      {result?.created ? (
        <Button type="button" variant="secondary" className="mt-2" onClick={onClose}>
          Close
        </Button>
      ) : (
        <Button type="submit" loading={pending} className="mt-2">
          Create project
        </Button>
      )}
    </form>
  )
}

type ViewMode = 'table' | 'pipeline'

export function ProjectsClient({
  projects,
  clients,
  defaultClientId,
}: {
  projects: (Project & { client: Pick<Client, 'id' | 'name' | 'company'> })[]
  clients: Client[]
  defaultClientId?: string
}) {
  // Arriving from a client's "+ New project" link
  const [open, setOpen] = useState(Boolean(defaultClientId))
  const [view, setView] = useState<ViewMode>('table')

  return (
    <>
      <Header
        title="Projects"
        subtitle={`${projects.length} project${projects.length !== 1 ? 's' : ''}`}
        actions={
          <>
            <div className="flex rounded-lg bg-bone/[0.06] p-0.5">
              {(['table', 'pipeline'] as ViewMode[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={[
                    'cursor-pointer rounded-md px-3 py-1 text-[13px] capitalize transition-colors duration-150',
                    view === v ? 'bg-overlay font-medium text-bone' : 'text-dim hover:text-bone',
                  ].join(' ')}
                >
                  {v}
                </button>
              ))}
            </div>
            <Button size="sm" onClick={() => setOpen(true)}>+ New Project</Button>
          </>
        }
      />
      <PageWrapper>
        {view === 'table' ? <TableView projects={projects} /> : <PipelineView projects={projects} />}
      </PageWrapper>

      <SlideOver open={open} onClose={() => setOpen(false)} title="New project">
        <NewProjectForm
          clients={clients}
          defaultClientId={defaultClientId}
          onClose={() => setOpen(false)}
        />
      </SlideOver>
    </>
  )
}

const COLUMNS =
  'grid grid-cols-[minmax(0,1fr)_auto] lg:grid-cols-[minmax(0,1.4fr)_190px_60px_90px_70px_minmax(0,1.2fr)] items-center gap-4 px-5'

type ProjectRow = Project & { client: Pick<Client, 'id' | 'name' | 'company'> }

function TableView({ projects }: { projects: ProjectRow[] }) {
  if (projects.length === 0) return <EmptyState title="No projects yet" />

  return (
    <Card padding="none" className="overflow-hidden">
      <div className={`${COLUMNS} border-b border-line py-2.5`}>
        <span className="eyebrow">Project</span>
        <span className="eyebrow">Status</span>
        <span className="eyebrow hidden lg:block">Tier</span>
        <span className="eyebrow hidden lg:block">Value</span>
        <span className="eyebrow hidden lg:block">Due</span>
        <span className="eyebrow hidden lg:block">Next action</span>
      </div>
      <div className="divide-y divide-line">
        {projects.map((p) => {
          const days = daysSince(p.stage_updated_at)
          const isStale = (p.status === 'questionnaire_sent' && days > 5) || (p.status === 'proposal_sent' && days > 3)
          return (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className={`${COLUMNS} py-3 transition-colors duration-150 hover:bg-bone/[0.03]`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <Avatar name={p.client.company ?? p.client.name} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-bone">{p.name}</p>
                  <p className="truncate text-[13px] text-dim">{p.client.company ?? p.client.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Badge variant={p.status} dot>{STAGE_LABELS[p.status]}</Badge>
                {isStale && <Badge variant="red" className="normal-case">{days}d</Badge>}
              </div>
              <span className="hidden font-mono text-xs text-dim lg:block">{p.tier?.replace('tier', 'T') ?? '—'}</span>
              <span className="hidden font-mono text-sm text-bone lg:block">{p.value != null ? formatDollars(p.value) : '—'}</span>
              <span className="hidden font-mono text-xs text-dim lg:block">
                {p.estimated_completion ? formatDate(p.estimated_completion) : '—'}
              </span>
              <span className="hidden truncate text-[13px] text-dim lg:block" title={NEXT_ACTIONS[p.status]}>
                {NEXT_ACTIONS[p.status]}
              </span>
            </Link>
          )
        })}
      </div>
    </Card>
  )
}

function PipelineView({ projects }: { projects: ProjectRow[] }) {
  return (
    <div className="-mx-5 overflow-x-auto px-5 md:-mx-8 md:px-8">
      <div className="flex min-w-max gap-3 pb-4">
        {PROJECT_STAGES.map((status) => {
          const col = projects.filter((p) => p.status === status)
          return (
            <div key={status} className="w-56 shrink-0">
              <div className="mb-2 flex items-center justify-between px-1">
                <Badge variant={status} dot>{STAGE_LABELS[status]}</Badge>
                <span className="font-mono text-xs text-dim">{col.length}</span>
              </div>
              <div className="flex flex-col gap-2">
                {col.map((p) => (
                  <Link
                    key={p.id}
                    href={`/projects/${p.id}`}
                    className="block rounded-xl border border-line bg-surface p-3 transition-all duration-150 hover:-translate-y-0.5 hover:border-line-strong"
                  >
                    <p className="truncate text-sm font-medium text-bone">{p.name}</p>
                    <p className="truncate text-[13px] text-dim">{p.client.company ?? p.client.name}</p>
                    {p.value != null && <p className="mt-1.5 font-mono text-xs text-muted">{formatDollars(p.value)}</p>}
                  </Link>
                ))}
                {col.length === 0 && (
                  <div className="rounded-xl border border-dashed border-line px-3 py-5 text-center text-xs text-dim/60">Empty</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
