import { createServiceClient } from '@/lib/supabase/server'
import { requirePortalClient } from '@/lib/portal/auth'
import { formatDate, formatNZD } from '@/lib/format'
import { displayStatus } from '@/lib/invoices'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, EmptyState } from '@/components/ui/Card'
import type { Invoice } from '@/types'

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
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-[36px] leading-tight text-bone">Invoices</h1>
        <p className="mt-1 text-muted">Your invoices from Te Wairama Digital</p>
      </div>

      {invoices.length === 0 ? (
        <EmptyState title="No invoices yet" />
      ) : (
        <Card padding="none" className="divide-y divide-line overflow-hidden">
          {invoices.map((inv) => {
            const status = displayStatus(inv)
            return (
              <div key={inv.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-sm text-bone">{inv.invoice_number}</p>
                  {inv.status === 'paid' && inv.paid_at ? (
                    <p className="text-[13px] text-pounamu">Paid {formatDate(inv.paid_at, 'medium')}</p>
                  ) : inv.due_date ? (
                    <p className="text-[13px] text-dim">Due {formatDate(inv.due_date, 'long')}</p>
                  ) : null}
                </div>
                <p className="font-mono text-base font-medium text-bone">{formatNZD(inv.amount)}</p>
                <Badge variant={status} dot>{status}</Badge>
                <div className="flex items-center gap-3">
                  <a
                    href={`/portal/${clientSlug}/invoices/${inv.id}/pdf`}
                    className="text-[13px] text-muted transition-colors hover:text-bone"
                  >
                    PDF
                  </a>
                  {(status === 'sent' || status === 'overdue') && inv.stripe_payment_link && (
                    <a href={inv.stripe_payment_link} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="amber">Pay now →</Button>
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </Card>
      )}
    </div>
  )
}
