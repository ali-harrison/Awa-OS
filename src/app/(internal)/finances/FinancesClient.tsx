'use client'

import { useState, useTransition } from 'react'
import { Header } from '@/components/layout/Header'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, EmptyState, Stat } from '@/components/ui/Card'
import { FormError, Input, Select } from '@/components/ui/Input'
import { SlideOver } from '@/components/ui/SlideOver'
import { createInvoiceAction, markInvoicePaidAction, sendInvoiceAction } from './actions'
import { useFormSubmit } from '@/lib/use-form-submit'
import { formatDate, formatNZD } from '@/lib/format'
import { displayStatus, gstIncludedIn } from '@/lib/invoices'
import type { Client, Project, Invoice, LineItem } from '@/types'

// ─── Line item editor ─────────────────────────────────────────────────────────

/** What's in the inputs: raw text, in dollars, so "12." can be typed on the way to "12.50". */
interface LineItemRow {
  description: string
  quantity: string
  unitPrice: string
}

const EMPTY_ROW: LineItemRow = { description: '', quantity: '1', unitPrice: '' }

/** Invoices store cents; the form works in dollars. This is the one place they meet. */
function toLineItem(row: LineItemRow): LineItem {
  const quantity = parseFloat(row.quantity) || 0
  const unit_price = Math.round((parseFloat(row.unitPrice) || 0) * 100)
  return {
    description: row.description.trim(),
    quantity,
    unit_price,
    amount: Math.round(quantity * unit_price),
  }
}

function LineItemEditor({
  value,
  onChange,
}: {
  value: LineItemRow[]
  onChange: (rows: LineItemRow[]) => void
}) {
  function updateRow(i: number, field: keyof LineItemRow, text: string) {
    onChange(value.map((row, idx) => (idx === i ? { ...row, [field]: text } : row)))
  }

  function addRow() {
    onChange([...value, EMPTY_ROW])
  }

  function removeRow(i: number) {
    onChange(value.filter((_, idx) => idx !== i))
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-[1fr_52px_96px_88px_20px] gap-2 px-1">
        {['Description', 'Qty', 'Unit $', 'Amount', ''].map((h) => (
          <span key={h} className={`eyebrow ${h === 'Amount' ? 'text-right' : ''}`}>{h}</span>
        ))}
      </div>
      {value.map((row, i) => (
        <div key={i} className="grid grid-cols-[1fr_52px_96px_88px_20px] items-center gap-2">
          <input
            aria-label="Description"
            value={row.description}
            onChange={(e) => updateRow(i, 'description', e.target.value)}
            placeholder="Service description"
            className="h-9 rounded-lg border border-line-strong bg-ink px-2 text-[13px] text-bone outline-none transition-colors focus:border-amber"
          />
          <input
            aria-label="Quantity"
            type="number"
            value={row.quantity}
            min={0}
            step="any"
            onChange={(e) => updateRow(i, 'quantity', e.target.value)}
            className="h-9 rounded-lg border border-line-strong bg-ink px-2 text-[13px] text-bone outline-none transition-colors focus:border-amber text-right font-mono"
          />
          <input
            aria-label="Unit price in dollars"
            type="number"
            value={row.unitPrice}
            min={0}
            step="0.01"
            placeholder="0.00"
            onChange={(e) => updateRow(i, 'unitPrice', e.target.value)}
            className="h-9 rounded-lg border border-line-strong bg-ink px-2 text-[13px] text-bone outline-none transition-colors focus:border-amber text-right font-mono"
          />
          <span className="text-right font-mono text-xs text-muted">{formatNZD(toLineItem(row).amount)}</span>
          <button
            type="button"
            aria-label="Remove line"
            onClick={() => removeRow(i)}
            className="cursor-pointer text-xs text-dim transition-colors hover:text-coral"
          >
            ✕
          </button>
        </div>
      ))}
      <Button type="button" size="sm" variant="ghost" onClick={addRow}>
        + Add line
      </Button>
    </div>
  )
}

// ─── New invoice form ─────────────────────────────────────────────────────────

function NewInvoiceForm({
  clients,
  projects,
  onSuccess,
}: {
  clients: Client[]
  projects: Project[]
  onSuccess: () => void
}) {
  const [selectedClientId, setSelectedClientId] = useState('')
  const [rows, setRows] = useState<LineItemRow[]>([EMPTY_ROW])
  const [gst, setGst] = useState(true)

  const lineItems = rows.map(toLineItem)
  const total = lineItems.reduce((s, li) => s + li.amount, 0)

  const { onSubmit, error, pending } = useFormSubmit(async (fd) => {
    if (lineItems.length === 0) return { error: 'Add at least one line item.' }
    if (lineItems.some((li) => !li.description)) return { error: 'All line items need a description.' }
    if (lineItems.some((li) => li.amount <= 0)) return { error: 'All line items need a quantity and a price.' }
    fd.set('line_items', JSON.stringify(lineItems))
    return createInvoiceAction(fd)
  }, onSuccess)

  const filteredProjects = projects.filter((p) => p.client_id === selectedClientId)

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Select
        label="Client"
        name="client_id"
        required
        value={selectedClientId}
        onChange={(e) => setSelectedClientId(e.target.value)}
        options={[
          { value: '', label: 'Select client…' },
          ...clients.map((c) => ({ value: c.id, label: `${c.name}${c.company ? ` — ${c.company}` : ''}` })),
        ]}
      />
      <Select
        label="Project (optional)"
        name="project_id"
        options={[
          { value: '', label: 'No project' },
          ...filteredProjects.map((p) => ({ value: p.id, label: p.name })),
        ]}
      />
      <div>
        <p className="mb-2 text-[13px] font-medium text-muted">Line items</p>
        <LineItemEditor value={rows} onChange={setRows} />
      </div>
      <div className="flex items-center justify-between rounded-[10px] bg-bone/[0.04] px-3.5 py-3">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="gst"
            name="gst_included"
            checked={gst}
            onChange={(e) => setGst(e.target.checked)}
            className="accent-amber"
          />
          <label htmlFor="gst" className="cursor-pointer text-[13px] text-muted">
            GST included (15%)
          </label>
        </div>
        <div className="text-right">
          {gst && <p className="font-mono text-xs text-dim">Includes GST: {formatNZD(gstIncludedIn(total))}</p>}
          <p className="font-mono text-[15px] font-medium text-bone">Total: {formatNZD(total)}</p>
        </div>
      </div>
      <Input label="Due date" name="due_date" type="date" />
      {error && <FormError>{error}</FormError>}
      <Button type="submit" loading={pending} className="mt-2">
        Create invoice
      </Button>
    </form>
  )
}

const COLUMNS = 'grid grid-cols-[130px_minmax(0,1fr)_110px_70px_100px_170px] items-center gap-4 px-5'

// ─── Main component ───────────────────────────────────────────────────────────

interface FinancesData {
  revenueMTD: number
  outstanding: number
  overdue: number
  invoices: Invoice[]
  clients: Client[]
  projects: Project[]
}

export function FinancesClient({ data }: { data: FinancesData }) {
  const [open, setOpen] = useState(false)
  const [, startTransition] = useTransition()
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [sendError, setSendError] = useState<string | null>(null)

  const clientMap = Object.fromEntries(data.clients.map((c) => [c.id, c]))

  async function handleSend(invoiceId: string) {
    setSendingId(invoiceId)
    setSendError(null)
    const result = await sendInvoiceAction(invoiceId)
    setSendingId(null)
    if (result.error) setSendError(result.error)
  }

  return (
    <>
      <Header
        title="Finances"
        subtitle={`${data.invoices.length} invoice${data.invoices.length !== 1 ? 's' : ''}`}
        actions={<Button size="sm" onClick={() => setOpen(true)}>+ New Invoice</Button>}
      />
      <PageWrapper>
        <div className="mb-4 grid gap-4 sm:grid-cols-3">
          <Stat label="Revenue this month" value={formatNZD(data.revenueMTD)} tone="text-pounamu" />
          <Stat label="Outstanding" value={formatNZD(data.outstanding)} tone="text-amber" />
          <Stat label="Overdue" value={formatNZD(data.overdue)} tone={data.overdue > 0 ? 'text-coral' : 'text-bone'} />
        </div>

        {sendError && (
          <div className="mb-4">
            <FormError>Invoice not sent: {sendError}</FormError>
          </div>
        )}

        {data.invoices.length === 0 ? (
          <EmptyState title="No invoices yet" />
        ) : (
          <Card padding="none" className="overflow-x-auto">
            <div className="min-w-[760px]">
              <div className={`${COLUMNS} border-b border-line py-2.5`}>
                {['Invoice', 'Client', 'Amount', 'Due', 'Status', ''].map((h) => (
                  <span key={h} className="eyebrow">{h}</span>
                ))}
              </div>
              <div className="divide-y divide-line">
                {data.invoices.map((inv) => {
                  const client = clientMap[inv.client_id]
                  const status = displayStatus(inv)
                  return (
                    <div key={inv.id} className={`${COLUMNS} py-3 transition-colors duration-150 hover:bg-bone/[0.03]`}>
                      <p className="font-mono text-[13px] text-muted">{inv.invoice_number}</p>
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar name={client?.company ?? client?.name ?? '?'} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-bone">{client?.name ?? '—'}</p>
                          {client?.company && <p className="truncate text-[13px] text-dim">{client.company}</p>}
                        </div>
                      </div>
                      <p className="font-mono text-sm text-bone">{formatNZD(inv.amount)}</p>
                      <p className="font-mono text-xs text-dim">{inv.due_date ? formatDate(inv.due_date) : '—'}</p>
                      <Badge variant={status} dot>{status}</Badge>
                      <div className="flex items-center justify-end gap-3 text-[13px]">
                        {inv.status === 'draft' && (
                          <button
                            onClick={() => handleSend(inv.id)}
                            disabled={sendingId !== null}
                            className="cursor-pointer text-amber transition-colors hover:text-bone disabled:opacity-40"
                          >
                            {sendingId === inv.id ? 'Sending…' : 'Send'}
                          </button>
                        )}
                        {inv.status !== 'paid' && (
                          <button
                            onClick={() => startTransition(() => markInvoicePaidAction(inv.id))}
                            className="cursor-pointer text-dim transition-colors hover:text-pounamu"
                          >
                            Mark paid
                          </button>
                        )}
                        <a
                          href={`/finances/invoices/${inv.id}/pdf`}
                          className="cursor-pointer text-dim transition-colors hover:text-bone"
                        >
                          PDF
                        </a>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </Card>
        )}
      </PageWrapper>

      <SlideOver open={open} onClose={() => setOpen(false)} title="New invoice" width="lg">
        <NewInvoiceForm
          clients={data.clients}
          projects={data.projects}
          onSuccess={() => setOpen(false)}
        />
      </SlideOver>
    </>
  )
}
