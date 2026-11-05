import { createServiceClient } from '@/lib/supabase/server'
import { requirePortalClient } from '@/lib/portal/auth'
import { formatDate, formatNZD } from '@/lib/format'
import { displayStatus } from '@/lib/invoices'
import type { Invoice } from '@/types'

const card = {
  background: '#0f0f0f',
  border: '1px solid #1f1f1f',
  borderRadius: 6,
  boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
} as const

const STATUS_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  sent:    { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.2)' },
  overdue: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)' },
  paid:    { color: '#10b981', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.2)' },
  draft:   { color: '#555555', bg: 'rgba(85,85,85,0.08)',    border: 'rgba(85,85,85,0.2)' },
}

export default async function PortalInvoicesPage({
  params,
}: {
  params: Promise<{ clientSlug: string }>
}) {
  const { clientSlug } = await params
  const client = await requirePortalClient(clientSlug)

  const { data } = await createServiceClient()
    .from('invoices')
    .select('*')
    .eq('client_id', client.id)
    .neq('status', 'draft')
    .order('created_at', { ascending: false })

  const invoices = (data ?? []) as Invoice[]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-mono text-lg font-semibold mb-1" style={{ color: '#f0ece3' }}>Invoices</h1>
        <p className="font-mono text-sm" style={{ color: '#555555' }}>Your invoices from Te Wairama Digital</p>
      </div>

      {invoices.length === 0 ? (
        <div style={{ ...card, padding: '40px 24px', textAlign: 'center' }}>
          <p className="font-mono text-sm" style={{ color: '#555555' }}>No invoices yet.</p>
        </div>
      ) : (
        <div style={{ ...card, overflow: 'hidden' }}>
          {invoices.map((inv, i) => {
            const status = displayStatus(inv)
            const st = STATUS_STYLE[status] ?? STATUS_STYLE.draft
            return (
              <div
                key={inv.id}
                className="flex items-center gap-4 px-5 py-4"
                style={{ borderBottom: i < (invoices.length - 1) ? '1px solid #1f1f1f' : 'none' }}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm font-medium mb-0.5" style={{ color: '#f0ece3' }}>{inv.invoice_number}</p>
                  {inv.due_date && (
                    <p className="font-mono text-xs" style={{ color: '#555555' }}>
                      Due {formatDate(inv.due_date, 'long')}
                    </p>
                  )}
                  {inv.status === 'paid' && inv.paid_at && (
                    <p className="font-mono text-xs" style={{ color: '#10b981' }}>
                      Paid {formatDate(inv.paid_at, 'medium')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <p className="font-mono text-base font-medium" style={{ color: '#f0ece3' }}>{formatNZD(inv.amount)}</p>
                  <span
                    className="font-mono uppercase"
                    style={{ fontSize: 10, letterSpacing: '0.08em', padding: '2px 8px', borderRadius: 3, color: st.color, background: st.bg, border: `1px solid ${st.border}` }}
                  >
                    {status}
                  </span>
                  <a
                    href={`/portal/${clientSlug}/invoices/${inv.id}/pdf`}
                    className="font-mono text-xs transition-colors"
                    style={{ color: '#f59e0b' }}
                  >
                    PDF
                  </a>
                  {(status === 'sent' || status === 'overdue') && (
                    inv.stripe_payment_link ? (
                      <a
                        href={inv.stripe_payment_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs font-bold px-3 py-1.5 transition-colors"
                        style={{ background: '#f59e0b', color: '#0a0a0a', borderRadius: 4 }}
                      >
                        Pay now →
                      </a>
                    ) : (
                      <span className="font-mono text-xs" style={{ color: '#555555' }}>Awaiting payment link</span>
                    )
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
