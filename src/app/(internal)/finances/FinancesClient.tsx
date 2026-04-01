'use client'

import { useState, useActionState, useTransition } from 'react'
import dynamic from 'next/dynamic'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { SlideOver } from '@/components/ui/SlideOver'
import { createInvoiceAction, markInvoicePaidAction } from './actions'
import type { Client, Project, Invoice, InvoiceStatus, LineItem } from '@/types'

// Lazy-load PDF button — react-pdf must never touch SSR bundling
const PDFButton = dynamic(() => import('./PDFButton'), {
  ssr: false,
  loading: () => <span className="text-[#555050] font-mono text-xs">…</span>,
})

function formatNZD(cents: number) {
  return new Intl.NumberFormat('en-NZ', { style: 'currency', currency: 'NZD', minimumFractionDigits: 2 }).format(cents / 100)
}

// ─── Line item editor ─────────────────────────────────────────────────────────

function LineItemEditor({
  value,
  onChange,
}: {
  value: LineItem[]
  onChange: (items: LineItem[]) => void
}) {
  function updateItem(i: number, field: keyof LineItem, raw: string) {
    const updated = value.map((li, idx) => {
      if (idx !== i) return li
      const next = { ...li, [field]: field === 'description' ? raw : parseFloat(raw) || 0 }
      next.amount = Math.round(next.quantity * next.unit_price)
      return next
    })
    onChange(updated)
  }

  function addItem() {
    onChange([...value, { description: '', quantity: 1, unit_price: 0, amount: 0 }])
  }

  function removeItem(i: number) {
    onChange(value.filter((_, idx) => idx !== i))
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-[1fr_50px_80px_80px_24px] gap-2 px-1">
        {['Description', 'Qty', 'Unit $', 'Amount', ''].map((h) => (
          <span key={h} className="text-[#555050] font-mono text-[9px] uppercase tracking-widest">{h}</span>
        ))}
      </div>
      {value.map((li, i) => (
        <div key={i} className="grid grid-cols-[1fr_50px_80px_80px_24px] gap-2 items-center">
          <input
            value={li.description}
            onChange={(e) => updateItem(i, 'description', e.target.value)}
            placeholder="Service description"
            className="bg-[#111111] text-[#F5F0E8] border border-[#2A2A2A] font-mono text-xs px-2 py-1.5 outline-none focus:border-[#C9963A] transition-colors"
          />
          <input
            type="number"
            value={li.quantity}
            min={1}
            onChange={(e) => updateItem(i, 'quantity', e.target.value)}
            className="bg-[#111111] text-[#F5F0E8] border border-[#2A2A2A] font-mono text-xs px-2 py-1.5 outline-none focus:border-[#C9963A] transition-colors text-right"
          />
          <input
            type="number"
            value={li.unit_price}
            min={0}
            onChange={(e) => updateItem(i, 'unit_price', e.target.value)}
            className="bg-[#111111] text-[#F5F0E8] border border-[#2A2A2A] font-mono text-xs px-2 py-1.5 outline-none focus:border-[#C9963A] transition-colors text-right"
          />
          <span className="text-[#8A8580] font-mono text-xs text-right">{formatNZD(li.amount)}</span>
          <button
            type="button"
            onClick={() => removeItem(i)}
            className="text-[#555050] hover:text-[#E05252] font-mono text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      ))}
      <Button type="button" size="sm" variant="ghost" onClick={addItem}>
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
  const [, , pending] = useActionState(createInvoiceAction, null)
  const [selectedClientId, setSelectedClientId] = useState('')
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: '', quantity: 1, unit_price: 0, amount: 0 },
  ])
  const [gst, setGst] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const subtotal = lineItems.reduce((s, li) => s + li.amount, 0)
  const gstAmount = gst ? Math.round(subtotal * (15 / 115)) : 0

  const filteredProjects = projects.filter((p) => p.client_id === selectedClientId)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (lineItems.some((li) => !li.description)) {
      setError('All line items need a description.')
      return
    }
    const fd = new FormData(e.currentTarget)
    fd.set('line_items', JSON.stringify(lineItems))
    setError(null)
    const result = await createInvoiceAction(null, fd)
    if (!result) onSuccess()
    else setError(result.error)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
        <LineItemEditor value={lineItems} onChange={setLineItems} />
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
          {gst && <p className="text-[#555050] font-mono text-xs">GST: {formatNZD(gstAmount)}</p>}
          <p className="text-[#F5F0E8] font-mono text-sm font-medium">Total: {formatNZD(subtotal)}</p>
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
  invoices: (Invoice & { client: Pick<Client, 'id' | 'name' | 'company'> })[]
  clients: Client[]
  projects: Project[]
}

export function FinancesClient({ data }: { data: FinancesData }) {
  const [open, setOpen] = useState(false)
  const [, startTransition] = useTransition()

  const clientMap = Object.fromEntries(data.clients.map((c) => [c.id, c]))

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

      {/* Invoices table */}
      {data.invoices.length === 0 ? (
        <div className="border border-[#1A1A1A] px-6 py-12 text-center">
          <p className="text-[#555050] font-mono text-sm">No invoices yet.</p>
        </div>
      ) : (
        <div className="border border-[#1A1A1A]">
          <div className="grid grid-cols-[140px_1fr_100px_100px_100px_80px] gap-4 px-4 py-2 border-b border-[#1A1A1A] bg-[#0A0A0A]">
            {['Invoice #', 'Client', 'Amount', 'Due', 'Status', ''].map((h) => (
              <span key={h} className="text-[#555050] font-mono text-[10px] uppercase tracking-widest">{h}</span>
            ))}
          </div>
          {data.invoices.map((inv) => {
            const client = clientMap[inv.client_id]
            return (
              <div
                key={inv.id}
                className="grid grid-cols-[140px_1fr_100px_100px_100px_80px] gap-4 px-4 py-3 border-b border-[#1A1A1A] last:border-b-0 hover:bg-[#111111] transition-colors items-center"
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
                  {inv.due_date
                    ? new Date(inv.due_date).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' })
                    : '—'}
                </p>
                <Badge variant={inv.status as InvoiceStatus}>{inv.status}</Badge>
                <div className="flex items-center gap-2">
                  {inv.status !== 'paid' && (
                    <button
                      onClick={() => startTransition(() => markInvoicePaidAction(inv.id))}
                      className="text-[#555050] hover:text-[#4CAF7D] font-mono text-[10px] cursor-pointer transition-colors"
                    >
                      ✓ Paid
                    </button>
                  )}
                  {client && (
                    <PDFButton invoice={inv} client={client} />
                  )}
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
