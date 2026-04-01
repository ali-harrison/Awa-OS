import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { EmailsClient } from './EmailsClient'
import type { Client, Project, EmailLog } from '@/types'

export default async function EmailsPage() {
  const supabase = await createClient()

  const [{ data: clients }, { data: projects }, { data: emailLog }] = await Promise.all([
    supabase.from('clients').select('*').order('name'),
    supabase.from('projects').select('id, name, client_id').order('name'),
    supabase
      .from('email_log')
      .select('*, client:clients(name)')
      .order('sent_at', { ascending: false })
      .limit(100),
  ])

  return (
    <>
      <Header title="Emails" subtitle="Templates & sent log" />
      <PageWrapper>
        <EmailsClient
          clients={(clients ?? []) as Client[]}
          projects={(projects ?? []) as Project[]}
          emailLog={(emailLog ?? []) as (EmailLog & { client: Pick<Client, 'name'> | null })[]}
        />
      </PageWrapper>
    </>
  )
}
