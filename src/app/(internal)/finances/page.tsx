import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { FinancesClient } from './FinancesClient'
import { displayStatus } from '@/lib/invoices'
import { nzDate } from '@/lib/format'
import { CLIENT_COLUMNS, type Client, type Invoice, type Project } from '@/types'

export default async function FinancesPage() {
  const supabase = await createClient()

  const [{ data: invoices }, { data: clients }, { data: projects }] = await Promise.all([
    supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase.from('clients').select(CLIENT_COLUMNS).order('name'),
    supabase.from('projects').select('id, name, client_id').order('name'),
  ])

  const inv = (invoices ?? []) as Invoice[]
  const thisMonth = nzDate().slice(0, 7)
  const total = (list: Invoice[]) => list.reduce((s, i) => s + i.amount, 0)

  const revenueMTD = total(inv.filter((i) => i.status === 'paid' && i.paid_at && nzDate(i.paid_at).startsWith(thisMonth)))
  const outstanding = total(inv.filter((i) => ['sent', 'overdue'].includes(displayStatus(i))))
  const overdue = total(inv.filter((i) => displayStatus(i) === 'overdue'))

  return (
    <>
      <Header title="Finances" subtitle="Invoices & revenue" />
      <PageWrapper>
        <FinancesClient
          data={{
            revenueMTD,
            outstanding,
            overdue,
            invoices: inv,
            clients: (clients ?? []) as Client[],
            projects: (projects ?? []) as Project[],
          }}
        />
      </PageWrapper>
    </>
  )
}
