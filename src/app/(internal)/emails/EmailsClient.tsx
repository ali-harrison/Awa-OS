'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, EmptyState } from '@/components/ui/Card'
import { FormError, Input, Select } from '@/components/ui/Input'
import { SlideOver } from '@/components/ui/SlideOver'
import { sendEmailAction } from './actions'
import { formatDate, formatNZD } from '@/lib/format'
import { formatDueDate } from '@/lib/invoices'
import type { Client, Project, EmailLog, Invoice } from '@/types'
import type { TemplateKey } from '@/lib/resend/templates'

// ─── Template definitions ─────────────────────────────────────────────────────

const TEMPLATE_META: {
  key: TemplateKey
  name: string
  subject: string
  vars: string[]
  previewVars: Record<string, string>
  autoVars?: string[]
}[] = [
  {
    key: 'welcome_client',
    name: 'Welcome',
    subject: 'Welcome to your project — [project name]',
    vars: ['clientName', 'projectName'],
    previewVars: { clientName: 'Aroha Ngata', projectName: 'Website Redesign' },
    autoVars: ['portalLink — a one-time setup link is generated when you send'],
  },
  {
    key: 'questionnaire_link',
    name: 'Questionnaire',
    subject: 'Your project questionnaire — [project name]',
    vars: ['clientName', 'projectName'],
    previewVars: { clientName: 'Aroha Ngata', projectName: 'Website Redesign' },
    autoVars: ['questionnaireLink — the portal link is generated when you send'],
  },
  {
    key: 'proposal_follow_up',
    name: 'Proposal follow-up',
    subject: 'Following up on your proposal — [project name]',
    vars: ['clientName', 'projectName'],
    previewVars: { clientName: 'Aroha Ngata', projectName: 'Website Redesign' },
  },
  {
    key: 'invoice_sent',
    name: 'Invoice',
    subject: 'Invoice [number] — [amount] due [date]',
    vars: ['clientName', 'invoiceNumber', 'amount', 'dueDate', 'paymentLink'],
    previewVars: { clientName: 'Aroha Ngata', invoiceNumber: 'TWD-2026-0001', amount: '$3,500.00', dueDate: '15 April 2026', paymentLink: 'https://pay.stripe.com' },
  },
  {
    key: 'testimonial_request',
    name: 'Testimonial request',
    subject: 'How did we do? — [project name]',
    vars: ['clientName', 'projectName'],
    previewVars: { clientName: 'Aroha Ngata', projectName: 'Website Redesign' },
  },
]

/** clientName → Client name */
function fieldLabel(key: string): string {
  const words = key.replace(/([A-Z])/g, ' $1').toLowerCase()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

// ─── Send slide-over ──────────────────────────────────────────────────────────

function SendSlideOver({
  template,
  clients,
  projects,
  latestInvoiceByClient,
  onClose,
}: {
  template: typeof TEMPLATE_META[number]
  clients: Client[]
  projects: Project[]
  latestInvoiceByClient: Record<string, Invoice>
  onClose: () => void
}) {
  const [selectedClientId, setSelectedClientId] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState('')
  // Starts empty: previewVars are sample data, shown as placeholders, and must never be sent
  const [vars, setVars] = useState<Record<string, string>>({})
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedClient = clients.find((c) => c.id === selectedClientId)
  const filteredProjects = projects.filter((p) => p.client_id === selectedClientId)

  function handleClientChange(id: string) {
    setSelectedClientId(id)
    setSelectedProjectId('')
    const c = clients.find((c) => c.id === id)
    if (!c) {
      setVars({})
      return
    }

    const inv = latestInvoiceByClient[id]
    const autoFill: Record<string, string> = { clientName: c.name }

    if (inv) {
      autoFill.invoiceNumber = inv.invoice_number
      autoFill.amount = formatNZD(inv.amount)
      autoFill.dueDate = formatDueDate(inv.due_date)
      autoFill.paymentLink = inv.stripe_payment_link ?? ''
    }

    // Replace rather than merge, so one client's invoice can't carry over to the next
    setVars(autoFill)
  }

  function handleProjectChange(id: string) {
    setSelectedProjectId(id)
    const p = projects.find((p) => p.id === id)
    if (p) setVars((prev) => ({ ...prev, projectName: p.name }))
  }

  async function handleSend() {
    if (!selectedClientId || !selectedClient) {
      setError('Please select a client.')
      return
    }
    // paymentLink can be blank: not every invoice has one
    const missing = template.vars.filter((v) => v !== 'paymentLink' && !vars[v]?.trim())
    if (missing.length > 0) {
      setError(`Please fill in: ${missing.map(fieldLabel).join(', ')}`)
      return
    }
    setSending(true)
    setError(null)
    const result = await sendEmailAction({
      templateKey: template.key,
      clientId: selectedClientId,
      projectId: selectedProjectId || null,
      vars,
    })
    setSending(false)
    if (result.error) setError(result.error)
    else setSent(true)
  }

  if (sent) {
    return (
      <div className="py-8 text-center">
        <p className="mb-1 font-display text-2xl text-pounamu">Email sent</p>
        <p className="mb-6 text-sm text-dim">
          Sent to {selectedClient?.email}
        </p>
        <Button size="sm" variant="secondary" onClick={onClose}>Close</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Select
        label="Client"
        value={selectedClientId}
        onChange={(e) => handleClientChange(e.target.value)}
        options={[
          { value: '', label: 'Select client…' },
          ...clients.map((c) => ({ value: c.id, label: `${c.name}${c.company ? ` — ${c.company}` : ''}` })),
        ]}
      />
      <Select
        label="Project (optional)"
        value={selectedProjectId}
        onChange={(e) => handleProjectChange(e.target.value)}
        options={[
          { value: '', label: 'No project' },
          ...filteredProjects.map((p) => ({ value: p.id, label: p.name })),
        ]}
      />

      {/* Variable overrides */}
      <div>
        <p className="eyebrow mb-3">Variables</p>
        <div className="flex flex-col gap-2">
          {template.vars.map((v) => (
            <Input
              key={v}
              label={fieldLabel(v)}
              value={vars[v] ?? ''}
              placeholder={template.previewVars[v]}
              onChange={(e) => setVars((prev) => ({ ...prev, [v]: e.target.value }))}
            />
          ))}
          {template.autoVars && template.autoVars.length > 0 && (
            <div className="mt-1 rounded-[10px] bg-pounamu/8 px-3 py-2">
              {template.autoVars.map((v) => (
                <p key={v} className="text-xs text-pounamu">{v}</p>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Subject preview */}
      <div>
        <p className="eyebrow mb-2">Subject preview</p>
        <p className="rounded-[10px] bg-bone/[0.04] px-3 py-2.5 text-sm text-muted">
          {template.subject
            .replace('[project name]', vars.projectName ?? '…')
            .replace('[number]', vars.invoiceNumber ?? '…')
            .replace('[amount]', vars.amount ?? '…')
            .replace('[date]', vars.dueDate ?? '…')}
        </p>
      </div>

      {selectedClient && (
        <p className="text-sm text-dim">
          Sending to <span className="text-bone">{selectedClient.email}</span>
        </p>
      )}

      {error && <FormError>{error}</FormError>}

      <Button onClick={handleSend} loading={sending} disabled={!selectedClientId}>
        Send email →
      </Button>
    </div>
  )
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type Tab = 'templates' | 'log'

export function EmailsClient({
  clients,
  projects,
  emailLog,
  latestInvoiceByClient,
}: {
  clients: Client[]
  projects: Project[]
  emailLog: (EmailLog & { client: Pick<Client, 'name'> | null })[]
  latestInvoiceByClient: Record<string, Invoice>
}) {
  const [tab, setTab] = useState<Tab>('templates')
  const [selectedTemplate, setSelectedTemplate] = useState<typeof TEMPLATE_META[number] | null>(null)

  return (
    <>
      {/* Tabs */}
      <div className="mb-4 flex gap-1 border-b border-line">
        {(['templates', 'log'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={[
              '-mb-px cursor-pointer border-b-2 px-3 py-2.5 text-sm transition-colors duration-150',
              tab === t ? 'border-amber font-medium text-bone' : 'border-transparent text-dim hover:text-muted',
            ].join(' ')}
          >
            {t === 'templates' ? 'Templates' : 'Sent log'}
          </button>
        ))}
      </div>

      {tab === 'templates' && (
        <div className="grid gap-4 md:grid-cols-2">
          {TEMPLATE_META.map((tpl) => (
            <Card key={tpl.key} className="flex items-start gap-4 transition-colors duration-150 hover:border-line-strong">
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg text-bone">{tpl.name}</p>
                <p className="mt-0.5 mb-3 text-[13px] text-dim">{tpl.subject}</p>
                <div className="flex flex-wrap gap-1">
                  {tpl.vars.map((v) => (
                    <Badge key={v} variant="muted" className="normal-case">{fieldLabel(v)}</Badge>
                  ))}
                  {tpl.autoVars?.map((v) => (
                    <Badge key={v} variant="green" className="normal-case">{fieldLabel(v.split(' — ')[0])} added for you</Badge>
                  ))}
                </div>
              </div>
              <Button size="sm" variant="secondary" onClick={() => setSelectedTemplate(tpl)}>
                Send
              </Button>
            </Card>
          ))}
        </div>
      )}

      {tab === 'log' && (
        emailLog.length === 0 ? (
          <EmptyState title="No emails sent yet" />
        ) : (
          <Card padding="none" className="divide-y divide-line overflow-hidden">
            {emailLog.map((log) => (
              <div key={log.id} className="flex items-center gap-4 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-bone">{log.subject}</p>
                  <p className="mt-0.5 text-[13px] text-dim">
                    {log.client?.name ?? '—'} · {log.template_key.replace(/_/g, ' ')}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Badge variant={log.status === 'sent' ? 'green' : 'red'} dot>{log.status}</Badge>
                  <span className="font-mono text-xs text-dim">{formatDate(log.sent_at)}</span>
                </div>
              </div>
            ))}
          </Card>
        )
      )}

      {selectedTemplate && (
        <SlideOver
          open={!!selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
          title={`Send: ${selectedTemplate.name}`}
        >
          <SendSlideOver
            template={selectedTemplate}
            clients={clients}
            projects={projects}
            latestInvoiceByClient={latestInvoiceByClient}
            onClose={() => setSelectedTemplate(null)}
          />
        </SlideOver>
      )}
    </>
  )
}
