import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { ClientsClient } from './ClientsClient'
import type { Client } from '@/types'

export default async function ClientsPage() {
  const supabase = await createClient()
  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <>
      <Header title="Clients" subtitle={`${clients?.length ?? 0} total`} />
      <PageWrapper>
        <ClientsClient clients={(clients ?? []) as Client[]} />
      </PageWrapper>
    </>
  )
}
