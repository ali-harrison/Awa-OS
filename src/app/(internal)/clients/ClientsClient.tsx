'use client'

import { useState, useActionState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { SlideOver } from '@/components/ui/SlideOver'
import { createClientAction } from './actions'
import type { Client, ClientType, ClientStatus } from '@/types'

const TYPE_OPTIONS: { value: ClientType; label: string }[] = [
  { value: 'charity', label: 'Charity / NFP' },
  { value: 'gym', label: 'Gym / Fitness' },
  { value: 'consultant', label: 'Consultant' },
  { value: 'ecom', label: 'E-Commerce' },
  { value: 'other', label: 'Other' },
]

const STATUS_OPTIONS: { value: ClientStatus; label: string }[] = [
  { value: 'lead', label: 'Lead' },
  { value: 'prospect', label: 'Prospect' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'paused', label: 'Paused' },
]

function NewClientForm({ onSuccess }: { onSuccess: () => void }) {
  const [state, formAction, pending] = useActionState(createClientAction, null)

  // Close on successful submission
  if (state === null && !pending) {
    // State is null = no error = success after first render — handled by redirect/revalidate
  }

  return (
    <form
      action={async (fd) => {
        const result = await createClientAction(null, fd)
        if (!result) onSuccess()
      }}
      className="flex flex-col gap-4"
    >
      <Input label="Name" name="name" required placeholder="Aroha Ngata" />
      <Input label="Email" name="email" type="email" required placeholder="aroha@example.co.nz" />
      <Input label="Phone" name="phone" type="tel" placeholder="+64 21 000 0000" />
      <Input label="Company" name="company" placeholder="KIHI Charitable Trust" />
      <Select
        label="Type"
        name="type"
        defaultValue="other"
        options={[{ value: '', label: 'Select type…' }, ...TYPE_OPTIONS]}
      />
      <Select
        label="Status"
        name="status"
        defaultValue="lead"
        options={STATUS_OPTIONS}
      />
      {state?.error && (
        <p className="text-[#E05252] font-mono text-xs border border-[#E0525233] bg-[#E0525211] px-3 py-2">
          {state.error}
        </p>
      )}
      <div className="pt-2 flex gap-2">
        <Button type="submit" loading={pending} className="flex-1">
          Create client
        </Button>
      </div>
    </form>
  )
}

export function ClientsClient({ clients }: { clients: Client[] }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Header actions */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-[#555050] font-mono text-xs">{clients.length} client{clients.length !== 1 ? 's' : ''}</p>
        <Button size="sm" onClick={() => setOpen(true)}>+ New Client</Button>
      </div>

      {/* Table */}
      {clients.length === 0 ? (
        <div className="border border-[#1A1A1A] px-6 py-12 text-center">
          <p className="text-[#555050] font-mono text-sm">No clients yet.</p>
          <Button size="sm" variant="secondary" className="mt-4" onClick={() => setOpen(true)}>
            Add your first client
          </Button>
        </div>
      ) : (
        <div className="border border-[#1A1A1A]">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_1fr_120px_120px_80px_100px] gap-4 px-4 py-2 border-b border-[#1A1A1A] bg-[#0A0A0A]">
            {['Name', 'Company', 'Type', 'Status', 'Portal', 'Added'].map((h) => (
              <span key={h} className="text-[#555050] font-mono text-[10px] uppercase tracking-widest">
                {h}
              </span>
            ))}
          </div>
          {/* Rows */}
          {clients.map((client) => (
            <Link
              key={client.id}
              href={`/clients/${client.id}`}
              className="grid grid-cols-[1fr_1fr_120px_120px_80px_100px] gap-4 px-4 py-3 border-b border-[#1A1A1A] last:border-b-0 hover:bg-[#111111] transition-colors duration-100 items-center"
            >
              <div>
                <p className="text-[#F5F0E8] font-mono text-sm truncate">{client.name}</p>
                <p className="text-[#555050] font-mono text-xs truncate">{client.email}</p>
              </div>
              <p className="text-[#8A8580] font-mono text-sm truncate">{client.company ?? '—'}</p>
              <Badge variant={client.type as ClientType}>{client.type}</Badge>
              <Badge variant={client.status}>{client.status}</Badge>
              <span className="font-mono text-xs">
                {client.portal_access
                  ? <span className="text-[#4CAF7D]">on</span>
                  : <span className="text-[#555050]">off</span>}
              </span>
              <p className="text-[#555050] font-mono text-xs">
                {new Date(client.created_at).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' })}
              </p>
            </Link>
          ))}
        </div>
      )}

      {/* Slide-over */}
      <SlideOver open={open} onClose={() => setOpen(false)} title="New Client">
        <NewClientForm onSuccess={() => setOpen(false)} />
      </SlideOver>
    </>
  )
}
