import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { FinancesClient } from './FinancesClient'
import type { Client, Invoice, Project } from '@/types'

export default async function FinancesPage() {
  const supabase = await createClient()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [{ data: invoices }, { data: clients }, { data: projects }] = await Promise.all([
    supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase.from('clients').select('*').order('name'),
    supabase.from('projects').select('id, name, client_id').order('name'),
  ])

  const inv = (invoices ?? []) as Invoice[]

  const revenueMTD = inv
    .filter((i) => i.status === 'paid' && i.paid_at && i.paid_at >= startOfMonth)
    .reduce((s, i) => s + i.amount, 0)

  const outstanding = inv
    .filter((i) => i.status === 'sent')
    .reduce((s, i) => s + i.amount, 0)

  const overdue = inv
    .filter((i) => i.status === 'sent' && i.due_date && i.due_date < now.toISOString())
    .reduce((s, i) => s + i.amount, 0)

  return (
    <>
      <Header title="Finances" subtitle="Invoices & revenue" />
      <PageWrapper>
        <FinancesClient
          data={{
            revenueMTD,
            outstanding,
            overdue,
            invoices: inv as (Invoice & { client: Pick<Client, 'id' | 'name' | 'company'> })[],
            clients: (clients ?? []) as Client[],
            projects: (projects ?? []) as Project[],
          }}
        />
      </PageWrapper>
    </>
  )
}
