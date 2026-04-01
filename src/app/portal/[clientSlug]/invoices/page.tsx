import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/Badge'
import { PORTAL_COOKIE } from '@/lib/portal/auth'
import type { InvoiceStatus } from '@/types'

function formatNZD(cents: number) {
  return new Intl.NumberFormat('en-NZ', { style: 'currency', currency: 'NZD', minimumFractionDigits: 2 }).format(cents / 100)
}

export default async function PortalInvoicesPage({
  params,
}: {
  params: Promise<{ clientSlug: string }>
}) {
  await params
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
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[#F5F0E8] font-mono text-lg font-semibold mb-1">Invoices</h1>
        <p className="text-[#555050] font-mono text-sm">Your invoices from Te Wairama Digital</p>
      </div>

      {(invoices?.length ?? 0) === 0 ? (
        <div className="border border-[#1A1A1A] px-6 py-10 text-center">
          <p className="text-[#555050] font-mono text-sm">No invoices yet.</p>
        </div>
      ) : (
        <div className="border border-[#1A1A1A] divide-y divide-[#1A1A1A]">
          {invoices?.map((inv) => (
            <div key={inv.id} className="flex items-center gap-4 px-4 py-4">
              <div className="flex-1 min-w-0">
                <p className="text-[#F5F0E8] font-mono text-sm font-medium">{inv.invoice_number}</p>
                {inv.due_date && (
                  <p className="text-[#555050] font-mono text-xs mt-0.5">
                    Due {new Date(inv.due_date).toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                )}
                {inv.status === 'paid' && inv.paid_at && (
                  <p className="text-[#4CAF7D] font-mono text-xs mt-0.5">
                    Paid {new Date(inv.paid_at).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <p className="text-[#F5F0E8] font-mono text-sm font-medium">{formatNZD(inv.amount)}</p>
                <Badge variant={inv.status as InvoiceStatus}>{inv.status}</Badge>
                {inv.status === 'sent' && (
                  inv.stripe_payment_link ? (
                    <a
                      href={inv.stripe_payment_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#F5F0E8] text-[#0A0A0A] font-mono text-xs px-3 py-1.5 hover:bg-[#E8E3DB] transition-colors duration-150"
                    >
                      Pay now →
                    </a>
                  ) : (
                    <span className="text-[#555050] font-mono text-xs">Awaiting payment link</span>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
