import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { EmailsClient } from './EmailsClient'
import type { Client, Project, EmailLog, Invoice } from '@/types'

export default async function EmailsPage() {
  const supabase = await createClient()

  const [{ data: clients }, { data: projects }, { data: emailLog }, { data: invoices }] = await Promise.all([
    supabase.from('clients').select('*').order('name'),
    supabase.from('projects').select('id, name, client_id').order('name'),
    supabase
      .from('email_log')
      .select('*, client:clients(name)')
      .order('sent_at', { ascending: false })
      .limit(100),
    supabase
      .from('invoices')
      .select('id, client_id, invoice_number, amount, due_date, stripe_payment_link, gst_included, status')
      .in('status', ['draft', 'sent', 'overdue'])
      .order('created_at', { ascending: false }),
  ])

  // Latest invoice per client (first match wins due to descending order)
  const latestInvoiceByClient: Record<string, Invoice> = {}
  for (const inv of (invoices ?? [])) {
    if (!latestInvoiceByClient[inv.client_id]) {
      latestInvoiceByClient[inv.client_id] = inv as Invoice
    }
  }

  return (
    <>
      <Header title="Emails" subtitle="Templates & sent log" />
      <PageWrapper>
        <EmailsClient
          clients={(clients ?? []) as Client[]}
          projects={(projects ?? []) as Project[]}
          emailLog={(emailLog ?? []) as (EmailLog & { client: Pick<Client, 'name'> | null })[]}
          latestInvoiceByClient={latestInvoiceByClient}
        />
      </PageWrapper>
    </>
  )
}
