import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { PORTAL_COOKIE } from '@/lib/portal/auth'

const card = {
  background: '#0f0f0f',
  border: '1px solid #1f1f1f',
  borderRadius: 6,
  boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
} as const

function formatNZD(cents: number) {
  return new Intl.NumberFormat('en-NZ', { style: 'currency', currency: 'NZD', minimumFractionDigits: 2 }).format(cents / 100)
}

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
  const cookieStore = await cookies()
  const raw = cookieStore.get(PORTAL_COOKIE)?.value
  if (!raw) notFound()

  let session: { clientId: string }
  try { session = JSON.parse(raw) } catch { notFound() }

  const supabase = await createServiceClient()

  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .eq('client_id', session.clientId)
    .neq('status', 'draft')
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-mono text-lg font-semibold mb-1" style={{ color: '#f0ece3' }}>Invoices</h1>
        <p className="font-mono text-sm" style={{ color: '#555555' }}>Your invoices from Te Wairama Digital</p>
      </div>

      {(invoices?.length ?? 0) === 0 ? (
        <div style={{ ...card, padding: '40px 24px', textAlign: 'center' }}>
          <p className="font-mono text-sm" style={{ color: '#555555' }}>No invoices yet.</p>
        </div>
      ) : (
        <div style={{ ...card, overflow: 'hidden' }}>
          {invoices?.map((inv, i) => {
            const st = STATUS_STYLE[inv.status] ?? STATUS_STYLE.draft
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
                      Due {new Date(inv.due_date).toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  )}
                  {inv.status === 'paid' && inv.paid_at && (
                    <p className="font-mono text-xs" style={{ color: '#10b981' }}>
                      Paid {new Date(inv.paid_at).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <p className="font-mono text-base font-medium" style={{ color: '#f0ece3' }}>{formatNZD(inv.amount)}</p>
                  <span
                    className="font-mono uppercase"
                    style={{ fontSize: 10, letterSpacing: '0.08em', padding: '2px 8px', borderRadius: 3, color: st.color, background: st.bg, border: `1px solid ${st.border}` }}
                  >
                    {inv.status}
                  </span>
                  <a
                    href={`/portal/${clientSlug}/invoices/${inv.id}/pdf`}
                    className="font-mono text-xs transition-colors"
                    style={{ color: '#f59e0b' }}
                  >
                    PDF
                  </a>
                  {(inv.status === 'sent' || inv.status === 'overdue') && (
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
