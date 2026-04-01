'use client'

import { useState, useActionState, useTransition } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { SlideOver } from '@/components/ui/SlideOver'
import { updateClientAction, togglePortalAccessAction } from '../actions'
import { generatePortalLinkAction } from './actions'
import { NEXT_ACTIONS } from '@/types'
import type { Client, Project, ClientType, ClientStatus } from '@/types'

const TYPE_OPTIONS = [
  { value: 'charity', label: 'Charity / NFP' },
  { value: 'gym', label: 'Gym / Fitness' },
  { value: 'consultant', label: 'Consultant' },
  { value: 'ecom', label: 'E-Commerce' },
  { value: 'other', label: 'Other' },
]

const STATUS_OPTIONS = [
  { value: 'lead', label: 'Lead' },
  { value: 'prospect', label: 'Prospect' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'paused', label: 'Paused' },
]

function formatNZD(value: number) {
  return new Intl.NumberFormat('en-NZ', { style: 'currency', currency: 'NZD', minimumFractionDigits: 0 }).format(value)
}

export function ClientDetailClient({
  client,
  projects,
}: {
  client: Client
  projects: Project[]
}) {
  const [editOpen, setEditOpen] = useState(false)
  const [editState, editAction, editPending] = useActionState(updateClientAction, null)
  const [portalPending, startPortalTransition] = useTransition()
  const [portalLink, setPortalLink] = useState<string | null>(null)
  const [linkGenerating, setLinkGenerating] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  async function handleGenerateLink() {
    setLinkGenerating(true)
    const link = await generatePortalLinkAction(client.id)
    setPortalLink(link)
    setLinkGenerating(false)
  }

  async function handleCopy() {
    if (!portalLink) return
    await navigator.clipboard.writeText(portalLink)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  return (
    <>
      {/* Info card */}
      <div className="border border-[#1A1A1A] mb-6">
        <div className="px-4 py-3 border-b border-[#1A1A1A] flex items-center justify-between bg-[#111111]">
          <span className="text-[#555050] font-mono text-[10px] uppercase tracking-widest">Client info</span>
          <Button size="sm" variant="secondary" onClick={() => setEditOpen(true)}>
            Edit
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-0 divide-x divide-[#1A1A1A]">
          {[
            { label: 'Email', value: client.email },
            { label: 'Phone', value: client.phone ?? '—' },
            { label: 'Company', value: client.company ?? '—' },
          ].map(({ label, value }) => (
            <div key={label} className="px-4 py-3">
              <p className="text-[#555050] font-mono text-[10px] uppercase tracking-widest mb-1">{label}</p>
              <p className="text-[#F5F0E8] font-mono text-sm">{value}</p>
            </div>
          ))}
        </div>
        <div className="border-t border-[#1A1A1A] grid grid-cols-2 md:grid-cols-3 gap-0 divide-x divide-[#1A1A1A]">
          <div className="px-4 py-3">
            <p className="text-[#555050] font-mono text-[10px] uppercase tracking-widest mb-1">Type</p>
            <Badge variant={client.type as ClientType}>{client.type}</Badge>
          </div>
          <div className="px-4 py-3">
            <p className="text-[#555050] font-mono text-[10px] uppercase tracking-widest mb-1">Status</p>
            <Badge variant={client.status as ClientStatus}>{client.status}</Badge>
          </div>
          <div className="px-4 py-3">
            <p className="text-[#555050] font-mono text-[10px] uppercase tracking-widest mb-1">Portal access</p>
            <button
              onClick={() => startPortalTransition(() => togglePortalAccessAction(client.id, client.portal_access))}
              disabled={portalPending}
              className="text-sm font-mono cursor-pointer disabled:opacity-40"
            >
              {client.portal_access
                ? <span className="text-[#4CAF7D]">Enabled</span>
                : <span className="text-[#555050]">Disabled</span>}
              <span className="text-[#555050] ml-2 text-xs">(toggle)</span>
            </button>
          </div>
        </div>

        {/* Portal link generator */}
        <div className="border-t border-[#1A1A1A] px-4 py-3">
          <p className="text-[#555050] font-mono text-[10px] uppercase tracking-widest mb-2">Portal link</p>
          {!client.portal_access && (
            <p className="text-[#555050] font-mono text-xs mb-2">Enable portal access above before generating a link.</p>
          )}
          {!portalLink ? (
            <Button
              size="sm"
              variant="secondary"
              loading={linkGenerating}
              disabled={!client.portal_access}
              onClick={handleGenerateLink}
            >
              Generate link
            </Button>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-[#0A0A0A] border border-[#2A2A2A] text-[#C9963A] font-mono text-[10px] px-3 py-2 truncate">
                  {portalLink}
                </code>
                <Button size="sm" variant={linkCopied ? 'ghost' : 'secondary'} onClick={handleCopy}>
                  {linkCopied ? 'Copied ✓' : 'Copy'}
                </Button>
              </div>
              <p className="text-[#555050] font-mono text-[10px]">Expires in 7 days. Send this to your client — they click it once to access their portal.</p>
              <button onClick={() => setPortalLink(null)} className="text-[#555050] hover:text-[#F5F0E8] font-mono text-[10px] text-left cursor-pointer transition-colors duration-150">
                Generate new link →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Projects */}
      <div className="border border-[#1A1A1A]">
        <div className="px-4 py-3 border-b border-[#1A1A1A] bg-[#0A0A0A] flex items-center justify-between">
          <span className="text-[#555050] font-mono text-[10px] uppercase tracking-widest">
            Projects ({projects.length})
          </span>
          <Link href={`/projects?client=${client.id}`}>
            <Button size="sm" variant="ghost">+ New project</Button>
          </Link>
        </div>
        {projects.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-[#555050] font-mono text-sm">No projects yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#1A1A1A]">
            {projects.map((p) => (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="flex items-center gap-4 px-4 py-3 hover:bg-[#111111] transition-colors duration-100"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[#F5F0E8] font-mono text-sm truncate">{p.name}</p>
                  <p className="text-[#8A8580] font-mono text-xs mt-0.5 truncate">
                    → {NEXT_ACTIONS[p.status]}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <Badge variant={p.status}>{p.status.replace(/_/g, ' ')}</Badge>
                  {p.value != null && (
                    <span className="text-[#F5F0E8] font-mono text-sm">{formatNZD(p.value)}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Edit slide-over */}
      <SlideOver open={editOpen} onClose={() => setEditOpen(false)} title="Edit Client">
        <form
          action={async (fd) => {
            fd.append('id', client.id)
            const result = await updateClientAction(null, fd)
            if (!result) setEditOpen(false)
          }}
          className="flex flex-col gap-4"
        >
          <Input label="Name" name="name" required defaultValue={client.name} />
          <Input label="Email" name="email" type="email" required defaultValue={client.email} />
          <Input label="Phone" name="phone" type="tel" defaultValue={client.phone ?? ''} />
          <Input label="Company" name="company" defaultValue={client.company ?? ''} />
          <Select
            label="Type"
            name="type"
            defaultValue={client.type}
            options={TYPE_OPTIONS}
          />
          <Select
            label="Status"
            name="status"
            defaultValue={client.status}
            options={STATUS_OPTIONS}
          />
          {editState?.error && (
            <p className="text-[#E05252] font-mono text-xs border border-[#E0525233] bg-[#E0525211] px-3 py-2">
              {editState.error}
            </p>
          )}
          <Button type="submit" loading={editPending} className="mt-2">
            Save changes
          </Button>
        </form>
      </SlideOver>
    </>
  )
}
