'use client'

import { useState, useActionState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { SlideOver } from '@/components/ui/SlideOver'
import { createProjectAction } from './actions'
import { NEXT_ACTIONS } from '@/types'
import type { Client, Project, ProjectStatus, ProjectTier } from '@/types'

const TIER_OPTIONS: { value: ProjectTier; label: string }[] = [
  { value: 'tier1', label: 'Tier 1' },
  { value: 'tier2', label: 'Tier 2' },
  { value: 'tier3', label: 'Tier 3' },
]

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'questionnaire_sent', label: 'Questionnaire Sent' },
  { value: 'questionnaire_received', label: 'Questionnaire Received' },
  { value: 'proposal_sent', label: 'Proposal Sent' },
  { value: 'contract_sent', label: 'Contract Sent' },
  { value: 'deposit_pending', label: 'Deposit Pending' },
  { value: 'deposit_paid', label: 'Deposit Paid' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'complete', label: 'Complete' },
]

const PIPELINE_COLUMNS: ProjectStatus[] = [
  'onboarding', 'questionnaire_sent', 'questionnaire_received',
  'proposal_sent', 'contract_sent', 'deposit_pending',
  'deposit_paid', 'in_progress', 'review', 'complete',
]

function formatNZD(value: number) {
  return new Intl.NumberFormat('en-NZ', { style: 'currency', currency: 'NZD', minimumFractionDigits: 0 }).format(value)
}

function daysSince(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}

function NewProjectForm({ clients, defaultClientId, onSuccess }: {
  clients: Client[]
  defaultClientId?: string
  onSuccess: () => void
}) {
  const [, , pending] = useActionState(createProjectAction, null)

  return (
    <form
      action={async (fd) => {
        const result = await createProjectAction(null, fd)
        if (!result) onSuccess()
      }}
      className="flex flex-col gap-4"
    >
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
        options={STATUS_OPTIONS}
      />
      <p className="text-[#555050] font-mono text-xs border border-[#1A1A1A] px-3 py-2">
        If status is set to <span className="text-[#C9963A]">onboarding</span>, welcome &amp; questionnaire emails will be sent automatically.
      </p>
      <Button type="submit" loading={pending} className="mt-2">
        Create project
      </Button>
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
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<ViewMode>('table')

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <p className="text-[#555050] font-mono text-xs">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
          <div className="flex border border-[#2A2A2A] ml-4">
            {(['table', 'pipeline'] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={[
                  'px-3 py-1 font-mono text-xs uppercase tracking-wide transition-colors duration-100 cursor-pointer',
                  view === v
                    ? 'bg-[#1A1A1A] text-[#F5F0E8]'
                    : 'text-[#555050] hover:text-[#F5F0E8]',
                ].join(' ')}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}>+ New Project</Button>
      </div>

      {view === 'table' ? (
        <TableView projects={projects} />
      ) : (
        <PipelineView projects={projects} />
      )}

      <SlideOver open={open} onClose={() => setOpen(false)} title="New Project">
        <NewProjectForm
          clients={clients}
          defaultClientId={defaultClientId}
          onSuccess={() => setOpen(false)}
        />
      </SlideOver>
    </>
  )
}

function TableView({ projects }: { projects: (Project & { client: Pick<Client, 'id' | 'name' | 'company'> })[] }) {
  if (projects.length === 0) {
    return (
      <div className="border border-[#1A1A1A] px-6 py-12 text-center">
        <p className="text-[#555050] font-mono text-sm">No projects yet.</p>
      </div>
    )
  }

  return (
    <div className="border border-[#1A1A1A]">
      <div className="grid grid-cols-[1fr_140px_100px_80px_100px_120px] gap-4 px-4 py-2 border-b border-[#1A1A1A] bg-[#0A0A0A]">
        {['Project', 'Status', 'Tier', 'Value', 'Due', 'Next action'].map((h) => (
          <span key={h} className="text-[#555050] font-mono text-[10px] uppercase tracking-widest">{h}</span>
        ))}
      </div>
      {projects.map((p) => {
        const days = daysSince(p.stage_updated_at)
        const isStale = (p.status === 'questionnaire_sent' && days > 5) ||
          (p.status === 'proposal_sent' && days > 3)
        return (
          <Link
            key={p.id}
            href={`/projects/${p.id}`}
            className="grid grid-cols-[1fr_140px_100px_80px_100px_120px] gap-4 px-4 py-3 border-b border-[#1A1A1A] last:border-b-0 hover:bg-[#111111] transition-colors duration-100 items-center"
          >
            <div>
              <p className="text-[#F5F0E8] font-mono text-sm truncate">{p.name}</p>
              <p className="text-[#555050] font-mono text-xs">{p.client.name}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge variant={p.status}>{p.status.replace(/_/g, ' ')}</Badge>
              {isStale && <Badge variant="amber">{days}d</Badge>}
            </div>
            <Badge variant="muted">{p.tier ?? '—'}</Badge>
            <span className="text-[#F5F0E8] font-mono text-sm">{p.value != null ? formatNZD(p.value) : '—'}</span>
            <span className="text-[#8A8580] font-mono text-xs">
              {p.estimated_completion
                ? new Date(p.estimated_completion).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' })
                : '—'}
            </span>
            <span className="text-[#555050] font-mono text-[10px] truncate">
              {NEXT_ACTIONS[p.status].split(' ')[0]}…
            </span>
          </Link>
        )
      })}
    </div>
  )
}

function PipelineView({ projects }: { projects: (Project & { client: Pick<Client, 'id' | 'name' | 'company'> })[] }) {
  const byStatus = Object.fromEntries(
    PIPELINE_COLUMNS.map((s) => [s, projects.filter((p) => p.status === s)])
  )

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-3 min-w-max pb-4">
        {PIPELINE_COLUMNS.map((status) => {
          const col = byStatus[status]
          return (
            <div key={status} className="w-52 flex-shrink-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#555050] font-mono text-[9px] uppercase tracking-widest">
                  {status.replace(/_/g, ' ')}
                </span>
                <span className="text-[#2A2A2A] font-mono text-[9px]">{col.length}</span>
              </div>
              <div className="flex flex-col gap-2">
                {col.map((p) => (
                  <Link
                    key={p.id}
                    href={`/projects/${p.id}`}
                    className="border border-[#1A1A1A] hover:border-[#2A2A2A] bg-[#111111] hover:bg-[#1A1A1A] px-3 py-2.5 block transition-colors duration-100"
                  >
                    <p className="text-[#F5F0E8] font-mono text-xs truncate mb-0.5">{p.name}</p>
                    <p className="text-[#555050] font-mono text-[10px]">{p.client.name}</p>
                    {p.value != null && (
                      <p className="text-[#8A8580] font-mono text-[10px] mt-1">{formatNZD(p.value)}</p>
                    )}
                  </Link>
                ))}
                {col.length === 0 && (
                  <div className="border border-dashed border-[#1A1A1A] px-3 py-4 text-center">
                    <p className="text-[#2A2A2A] font-mono text-[10px]">empty</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
