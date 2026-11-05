'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { FormError, Input, Select } from '@/components/ui/Input'
import { SlideOver } from '@/components/ui/SlideOver'
import { updateClientAction, togglePortalAccessAction } from '../actions'
import { generatePortalLinkAction } from './actions'
import { useFormSubmit } from '@/lib/use-form-submit'
import { formatDollars } from '@/lib/format'
import { CLIENT_STATUS_OPTIONS, CLIENT_TYPE_OPTIONS, NEXT_ACTIONS } from '@/types'
import type { Client, Project, ClientType, ClientStatus } from '@/types'

export function ClientDetailClient({
  client,
  projects,
}: {
  client: Client
  projects: Project[]
}) {
  const [editOpen, setEditOpen] = useState(false)
  const edit = useFormSubmit(updateClientAction, () => setEditOpen(false))
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
      <div className="px-5 pt-6 pb-5 md:px-8 md:pt-8">
        <Link
          href="/clients"
          className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-dim transition-colors hover:text-bone"
        >
          <ArrowLeft size={14} /> Clients
        </Link>
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name={client.name} size="lg" />
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-[32px] leading-tight text-bone">{client.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {client.company && <span className="text-sm text-muted">{client.company}</span>}
              <Badge variant={client.type as ClientType}>{client.type}</Badge>
              <Badge variant={client.status as ClientStatus} dot>{client.status}</Badge>
            </div>
          </div>
          <Button size="sm" variant="secondary" onClick={() => setEditOpen(true)}>
            Edit
          </Button>
        </div>
      </div>

      <PageWrapper>
        <div className="grid items-start gap-4 lg:grid-cols-[1fr_340px]">
          {/* Projects */}
          <Card padding="none">
            <CardHeader>
              <CardTitle>Projects ({projects.length})</CardTitle>
              <Link href={`/projects?client=${client.id}`}>
                <Button size="sm" variant="ghost">+ New project</Button>
              </Link>
            </CardHeader>
            {projects.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-dim">No projects yet.</p>
            ) : (
              <div className="divide-y divide-line">
                {projects.map((p) => (
                  <Link
                    key={p.id}
                    href={`/projects/${p.id}`}
                    className="flex items-center gap-4 px-5 py-3.5 transition-colors duration-150 hover:bg-bone/[0.03]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-bone">{p.name}</p>
                      <p className="mt-0.5 truncate text-[13px] text-dim">{NEXT_ACTIONS[p.status]}</p>
                    </div>
                    <Badge variant={p.status} dot className="hidden sm:inline-flex">{p.status.replace(/_/g, ' ')}</Badge>
                    {p.value != null && <span className="font-mono text-sm text-bone">{formatDollars(p.value)}</span>}
                  </Link>
                ))}
              </div>
            )}
          </Card>

          <div className="flex flex-col gap-4">
            {/* Contact */}
            <Card>
              <p className="eyebrow mb-3">Contact</p>
              <a href={`mailto:${client.email}`} className="block truncate text-sm text-bone transition-colors hover:text-amber">
                {client.email}
              </a>
              <p className="mt-1 text-sm text-muted">{client.phone ?? 'No phone number'}</p>
            </Card>

            {/* Portal */}
            <Card>
              <div className="mb-3 flex items-center justify-between">
                <p className="eyebrow">Client portal</p>
                <button
                  onClick={() => startPortalTransition(() => togglePortalAccessAction(client.id, client.portal_access))}
                  disabled={portalPending}
                  aria-pressed={client.portal_access}
                  aria-label="Toggle portal access"
                  className={`relative h-6 w-10 cursor-pointer rounded-full transition-colors duration-200 disabled:opacity-40 ${
                    client.portal_access ? 'bg-pounamu' : 'bg-line-strong'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 size-4 rounded-full bg-ink transition-transform duration-200 ${
                      client.portal_access ? 'translate-x-4' : ''
                    }`}
                  />
                </button>
              </div>
              <p className="mb-3 text-sm text-muted">
                {client.portal_access ? 'Enabled' : 'Disabled'}
                {!client.portal_access && ' — turn it on before generating a link.'}
              </p>

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
                    <code className="min-w-0 flex-1 truncate rounded-lg bg-ink px-3 py-2 font-mono text-[11px] text-amber">
                      {portalLink}
                    </code>
                    <Button size="sm" variant={linkCopied ? 'ghost' : 'secondary'} onClick={handleCopy}>
                      {linkCopied ? 'Copied ✓' : 'Copy'}
                    </Button>
                  </div>
                  <p className="text-xs text-dim">Expires in 7 days. Send this to your client — they click it once to access their portal.</p>
                  <button
                    onClick={() => setPortalLink(null)}
                    className="cursor-pointer text-left text-xs text-dim transition-colors hover:text-bone"
                  >
                    Generate new link →
                  </button>
                </div>
              )}
            </Card>
          </div>
        </div>
      </PageWrapper>

      <SlideOver open={editOpen} onClose={() => setEditOpen(false)} title="Edit client">
        <form onSubmit={edit.onSubmit} className="flex flex-col gap-4">
          <input type="hidden" name="id" value={client.id} />
          <Input label="Name" name="name" required defaultValue={client.name} />
          <Input label="Email" name="email" type="email" required defaultValue={client.email} />
          <Input label="Phone" name="phone" type="tel" defaultValue={client.phone ?? ''} />
          <Input label="Company" name="company" defaultValue={client.company ?? ''} />
          <Select label="Type" name="type" defaultValue={client.type} options={CLIENT_TYPE_OPTIONS} />
          <Select label="Status" name="status" defaultValue={client.status} options={CLIENT_STATUS_OPTIONS} />
          {edit.error && <FormError>{edit.error}</FormError>}
          <Button type="submit" loading={edit.pending} className="mt-2">
            Save changes
          </Button>
        </form>
      </SlideOver>
    </>
  )
}
