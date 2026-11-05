'use client'

import { useState, useTransition } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
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
      <div className="grid grid-cols-[1fr_50px_90px_90px_24px] gap-2 px-1">
        {['Description', 'Qty', 'Unit $', 'Amount', ''].map((h) => (
          <span key={h} className="text-[#555050] font-mono text-[9px] uppercase tracking-widest">{h}</span>
        ))}
      </div>
      {value.map((row, i) => (
        <div key={i} className="grid grid-cols-[1fr_50px_90px_90px_24px] gap-2 items-center">
          <input
            aria-label="Description"
            value={row.description}
            onChange={(e) => updateRow(i, 'description', e.target.value)}
            placeholder="Service description"
            className="bg-[#111111] text-[#F5F0E8] border border-[#2A2A2A] font-mono text-xs px-2 py-1.5 outline-none focus:border-[#C9963A] transition-colors"
          />
          <input
            aria-label="Quantity"
            type="number"
            value={row.quantity}
            min={0}
            step="any"
            onChange={(e) => updateRow(i, 'quantity', e.target.value)}
            className="bg-[#111111] text-[#F5F0E8] border border-[#2A2A2A] font-mono text-xs px-2 py-1.5 outline-none focus:border-[#C9963A] transition-colors text-right"
          />
          <input
            aria-label="Unit price in dollars"
            type="number"
            value={row.unitPrice}
            min={0}
            step="0.01"
            placeholder="0.00"
            onChange={(e) => updateRow(i, 'unitPrice', e.target.value)}
            className="bg-[#111111] text-[#F5F0E8] border border-[#2A2A2A] font-mono text-xs px-2 py-1.5 outline-none focus:border-[#C9963A] transition-colors text-right"
          />
          <span className="text-[#8A8580] font-mono text-xs text-right">{formatNZD(toLineItem(row).amount)}</span>
          <button
            type="button"
            aria-label="Remove line"
            onClick={() => removeRow(i)}
            className="text-[#555050] hover:text-[#E05252] font-mono text-xs cursor-pointer"
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
        <p className="text-[#8A8580] font-mono text-xs uppercase tracking-wide mb-2">Line items</p>
        <LineItemEditor value={rows} onChange={setRows} />
      </div>
      <div className="flex items-center justify-between border border-[#1A1A1A] px-3 py-2">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="gst"
            name="gst_included"
            checked={gst}
            onChange={(e) => setGst(e.target.checked)}
            className="accent-[#C9963A]"
          />
          <label htmlFor="gst" className="text-[#8A8580] font-mono text-xs cursor-pointer">
            GST included (15%)
          </label>
        </div>
        <div className="text-right">
          {gst && <p className="text-[#555050] font-mono text-xs">Includes GST: {formatNZD(gstIncludedIn(total))}</p>}
          <p className="text-[#F5F0E8] font-mono text-sm font-medium">Total: {formatNZD(total)}</p>
        </div>
      </div>
      <Input label="Due date" name="due_date" type="date" />
      {error && (
        <p className="text-[#E05252] font-mono text-xs border border-[#E0525233] bg-[#E0525211] px-3 py-2">{error}</p>
      )}
      <Button type="submit" loading={pending} className="mt-2">
        Create invoice
      </Button>
    </form>
  )
}

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
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Revenue MTD', value: formatNZD(data.revenueMTD), color: 'text-[#4CAF7D]' },
          { label: 'Outstanding', value: formatNZD(data.outstanding), color: 'text-[#C9963A]' },
          { label: 'Overdue', value: formatNZD(data.overdue), color: 'text-[#E05252]' },
        ].map(({ label, value, color }) => (
          <div key={label} className="border border-[#1A1A1A] px-4 py-4">
            <p className="text-[#555050] font-mono text-[10px] uppercase tracking-widest mb-2">{label}</p>
            <p className={`font-mono text-xl font-semibold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-[#555050] font-mono text-xs">
          {data.invoices.length} invoice{data.invoices.length !== 1 ? 's' : ''}
        </p>
        <Button size="sm" onClick={() => setOpen(true)}>+ New Invoice</Button>
      </div>

      {sendError && (
        <p className="text-[#E05252] font-mono text-xs border border-[#E0525233] bg-[#E0525211] px-3 py-2 mb-4">
          Invoice not sent: {sendError}
        </p>
      )}

      {/* Invoices table */}
      {data.invoices.length === 0 ? (
        <div className="border border-[#1A1A1A] px-6 py-12 text-center">
          <p className="text-[#555050] font-mono text-sm">No invoices yet.</p>
        </div>
      ) : (
        <div className="border border-[#1A1A1A]">
          <div className="grid grid-cols-[140px_1fr_100px_100px_100px_150px] gap-4 px-4 py-2 border-b border-[#1A1A1A] bg-[#0A0A0A]">
            {['Invoice #', 'Client', 'Amount', 'Due', 'Status', ''].map((h) => (
              <span key={h} className="text-[#555050] font-mono text-[10px] uppercase tracking-widest">{h}</span>
            ))}
          </div>
          {data.invoices.map((inv) => {
            const client = clientMap[inv.client_id]
            const status = displayStatus(inv)
            return (
              <div
                key={inv.id}
                className="grid grid-cols-[140px_1fr_100px_100px_100px_150px] gap-4 px-4 py-3 border-b border-[#1A1A1A] last:border-b-0 hover:bg-[#111111] transition-colors items-center"
              >
                <p className="text-[#F5F0E8] font-mono text-sm">{inv.invoice_number}</p>
                <div>
                  <p className="text-[#F5F0E8] font-mono text-sm truncate">{client?.name ?? '—'}</p>
                  {client?.company && (
                    <p className="text-[#555050] font-mono text-xs truncate">{client.company}</p>
                  )}
                </div>
                <p className="text-[#F5F0E8] font-mono text-sm">{formatNZD(inv.amount)}</p>
                <p className="text-[#8A8580] font-mono text-xs">
                  {inv.due_date ? formatDate(inv.due_date) : '—'}
                </p>
                <Badge variant={status}>{status}</Badge>
                <div className="flex items-center gap-2">
                  {inv.status === 'draft' && (
                    <button
                      onClick={() => handleSend(inv.id)}
                      disabled={sendingId !== null}
                      className="text-[#555050] hover:text-[#C9963A] disabled:opacity-40 font-mono text-[10px] cursor-pointer transition-colors"
                    >
                      {sendingId === inv.id ? 'Sending…' : '✉ Send'}
                    </button>
                  )}
                  {inv.status !== 'paid' && (
                    <button
                      onClick={() => startTransition(() => markInvoicePaidAction(inv.id))}
                      className="text-[#555050] hover:text-[#4CAF7D] font-mono text-[10px] cursor-pointer transition-colors"
                    >
                      ✓ Paid
                    </button>
                  )}
                  <a
                    href={`/finances/invoices/${inv.id}/pdf`}
                    className="text-[#555050] hover:text-[#F5F0E8] font-mono text-[10px] cursor-pointer transition-colors"
                  >
                    PDF
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <SlideOver open={open} onClose={() => setOpen(false)} title="New Invoice" width="lg">
        <NewInvoiceForm
          clients={data.clients}
          projects={data.projects}
          onSuccess={() => setOpen(false)}
        />
      </SlideOver>
    </>
  )
}
