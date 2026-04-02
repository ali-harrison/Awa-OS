'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { SlideOver } from '@/components/ui/SlideOver'
import { sendEmailAction } from './actions'
import type { Client, Project, EmailLog, Invoice } from '@/types'
import type { TemplateKey } from '@/lib/resend/templates'

// ─── Template definitions ─────────────────────────────────────────────────────

const TEMPLATE_META: {
  key: TemplateKey
  name: string
  subject: string
  vars: string[]
  previewVars: Record<string, string>
}[] = [
  {
    key: 'welcome_client',
    name: 'Welcome',
    subject: 'Welcome to your project — [project name]',
    vars: ['clientName', 'projectName', 'portalUrl'],
    previewVars: { clientName: 'Aroha Ngata', projectName: 'Website Redesign', portalUrl: 'https://example.com/portal' },
  },
  {
    key: 'questionnaire_link',
    name: 'Questionnaire',
    subject: 'Your project questionnaire — [project name]',
    vars: ['clientName', 'projectName', 'questionnaireUrl'],
    previewVars: { clientName: 'Aroha Ngata', projectName: 'Website Redesign', questionnaireUrl: 'https://example.com/portal/questionnaire' },
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
  const [vars, setVars] = useState<Record<string, string>>(template.previewVars)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedClient = clients.find((c) => c.id === selectedClientId)
  const filteredProjects = projects.filter((p) => p.client_id === selectedClientId)

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

  function handleClientChange(id: string) {
    setSelectedClientId(id)
    setSelectedProjectId('')
    const c = clients.find((c) => c.id === id)
    if (!c) return

    const portalUrl = `${baseUrl}/portal/${c.slug}`
    const inv = latestInvoiceByClient[id]

    const autoFill: Record<string, string> = {
      clientName: c.name,
      portalUrl,
      questionnaireUrl: `${portalUrl}/questionnaire`,
    }

    // Auto-fill invoice vars from their latest open invoice
    if (inv) {
      const amount = new Intl.NumberFormat('en-NZ', {
        style: 'currency', currency: 'NZD', minimumFractionDigits: 2,
      }).format(inv.amount / 100)
      const dueDate = inv.due_date
        ? new Date(inv.due_date).toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' })
        : 'on receipt'
      autoFill.invoiceNumber = inv.invoice_number
      autoFill.amount = amount
      autoFill.dueDate = dueDate
      autoFill.paymentLink = inv.stripe_payment_link ?? ''
    }

    setVars((prev) => ({ ...prev, ...autoFill }))
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
    setSending(true)
    setError(null)
    const result = await sendEmailAction({
      templateKey: template.key,
      clientId: selectedClientId,
      projectId: selectedProjectId || null,
      to: selectedClient.email,
      vars,
    })
    setSending(false)
    if (result.error) setError(result.error)
    else setSent(true)
  }

  if (sent) {
    return (
      <div className="text-center py-8">
        <p className="text-[#4CAF7D] font-mono text-sm mb-2">Email sent</p>
        <p className="text-[#555050] font-mono text-xs mb-6">
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
        <p className="text-[#555050] font-mono text-[10px] uppercase tracking-widest mb-3">Variables</p>
        <div className="flex flex-col gap-2">
          {template.vars.map((v) => (
            <Input
              key={v}
              label={v}
              value={vars[v] ?? ''}
              onChange={(e) => setVars((prev) => ({ ...prev, [v]: e.target.value }))}
            />
          ))}
        </div>
      </div>

      {/* Subject preview */}
      <div>
        <p className="text-[#555050] font-mono text-[10px] uppercase tracking-widest mb-2">Subject preview</p>
        <p className="text-[#8A8580] font-mono text-xs border border-[#1A1A1A] px-3 py-2">
          {template.subject
            .replace('[project name]', vars.projectName ?? '…')
            .replace('[number]', vars.invoiceNumber ?? '…')
            .replace('[amount]', vars.amount ?? '…')
            .replace('[date]', vars.dueDate ?? '…')}
        </p>
      </div>

      {selectedClient && (
        <p className="text-[#555050] font-mono text-xs">
          Sending to: <span className="text-[#F5F0E8]">{selectedClient.email}</span>
        </p>
      )}

      {error && (
        <p className="text-[#E05252] font-mono text-xs border border-[#E0525233] bg-[#E0525211] px-3 py-2">{error}</p>
      )}

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
      <div className="flex border-b border-[#1A1A1A] mb-5">
        {(['templates', 'log'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={[
              'px-4 py-2.5 font-mono text-xs uppercase tracking-wide border-b-2 transition-colors duration-100 cursor-pointer',
              tab === t ? 'border-[#F5F0E8] text-[#F5F0E8]' : 'border-transparent text-[#555050] hover:text-[#8A8580]',
            ].join(' ')}
          >
            {t === 'templates' ? 'Templates' : 'Sent log'}
          </button>
        ))}
      </div>

      {tab === 'templates' && (
        <div className="flex flex-col gap-3">
          {TEMPLATE_META.map((tpl) => (
            <div key={tpl.key} className="border border-[#1A1A1A] hover:border-[#2A2A2A] transition-colors duration-100">
              <div className="px-4 py-3 flex items-start gap-4">
                <div className="flex-1">
                  <p className="text-[#F5F0E8] font-mono text-sm font-medium mb-0.5">{tpl.name}</p>
                  <p className="text-[#555050] font-mono text-xs mb-2">{tpl.subject}</p>
                  <div className="flex flex-wrap gap-1">
                    {tpl.vars.map((v) => (
                      <Badge key={v} variant="muted">{v}</Badge>
                    ))}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setSelectedTemplate(tpl)}
                >
                  Send
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'log' && (
        <div className="border border-[#1A1A1A]">
          {emailLog.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-[#555050] font-mono text-sm">No emails sent yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#1A1A1A]">
              {emailLog.map((log) => (
                <div key={log.id} className="px-4 py-3 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-[#F5F0E8] font-mono text-sm truncate">{log.subject}</p>
                    <p className="text-[#555050] font-mono text-xs mt-0.5">
                      {log.client?.name ?? '—'} · {log.template_key}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <Badge variant={log.status === 'sent' ? 'green' : 'red'}>{log.status}</Badge>
                    <span className="text-[#555050] font-mono text-xs">
                      {new Date(log.sent_at).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedTemplate && (
        <SlideOver
          open={!!selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
          title={`Send — ${selectedTemplate.name}`}
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
