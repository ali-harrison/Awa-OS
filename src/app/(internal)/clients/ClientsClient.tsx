'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, EmptyState } from '@/components/ui/Card'
import { FormError, Input, Select } from '@/components/ui/Input'
import { SlideOver } from '@/components/ui/SlideOver'
import { createClientAction } from './actions'
import { useFormSubmit } from '@/lib/use-form-submit'
import { formatDate } from '@/lib/format'
import { CLIENT_STATUS_OPTIONS, CLIENT_TYPE_OPTIONS, type Client, type ClientType } from '@/types'

const COLUMNS =
  'grid grid-cols-[minmax(0,1fr)_auto] lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_120px_120px_70px_80px] items-center gap-4 px-5'

function NewClientForm({ onSuccess }: { onSuccess: () => void }) {
  const { onSubmit, error, pending } = useFormSubmit(createClientAction, onSuccess)

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Input label="Name" name="name" required placeholder="Aroha Ngata" />
      <Input label="Email" name="email" type="email" required placeholder="aroha@example.co.nz" />
      <Input label="Phone" name="phone" type="tel" placeholder="+64 21 000 0000" />
      <Input label="Company" name="company" placeholder="Kōwhai Community Trust" />
      <Select label="Type" name="type" defaultValue="other" options={CLIENT_TYPE_OPTIONS} />
      <Select label="Status" name="status" defaultValue="lead" options={CLIENT_STATUS_OPTIONS} />
      {error && <FormError>{error}</FormError>}
      <Button type="submit" loading={pending} className="mt-2">
        Create client
      </Button>
    </form>
  )
}

export function ClientsClient({ clients }: { clients: Client[] }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Header
        title="Clients"
        subtitle={`${clients.length} client${clients.length !== 1 ? 's' : ''}`}
        actions={<Button size="sm" onClick={() => setOpen(true)}>+ New Client</Button>}
      />
      <PageWrapper>
        {clients.length === 0 ? (
          <EmptyState title="No clients yet">
            <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
              Add your first client
            </Button>
          </EmptyState>
        ) : (
          <Card padding="none" className="overflow-hidden">
            <div className={`${COLUMNS} border-b border-line py-2.5`}>
              <span className="eyebrow">Name</span>
              <span className="eyebrow hidden lg:block">Company</span>
              <span className="eyebrow hidden lg:block">Type</span>
              <span className="eyebrow">Status</span>
              <span className="eyebrow hidden lg:block">Portal</span>
              <span className="eyebrow hidden lg:block">Added</span>
            </div>
            <div className="divide-y divide-line">
              {clients.map((client) => (
                <Link
                  key={client.id}
                  href={`/clients/${client.id}`}
                  className={`${COLUMNS} py-3 transition-colors duration-150 hover:bg-bone/[0.03]`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={client.name} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-bone">{client.name}</p>
                      <p className="truncate text-[13px] text-dim">{client.email}</p>
                    </div>
                  </div>
                  <p className="hidden truncate text-sm text-muted lg:block">{client.company ?? '—'}</p>
                  <span className="hidden lg:block">
                    <Badge variant={client.type as ClientType}>{client.type}</Badge>
                  </span>
                  <Badge variant={client.status} dot>{client.status}</Badge>
                  <span className="hidden items-center gap-1.5 text-[13px] lg:flex">
                    <span className={`size-1.5 rounded-full ${client.portal_access ? 'bg-pounamu' : 'bg-dim/50'}`} />
                    <span className={client.portal_access ? 'text-muted' : 'text-dim'}>
                      {client.portal_access ? 'On' : 'Off'}
                    </span>
                  </span>
                  <p className="hidden font-mono text-xs text-dim lg:block">{formatDate(client.created_at)}</p>
                </Link>
              ))}
            </div>
          </Card>
        )}
      </PageWrapper>

      <SlideOver open={open} onClose={() => setOpen(false)} title="New client">
        <NewClientForm onSuccess={() => setOpen(false)} />
      </SlideOver>
    </>
  )
}
