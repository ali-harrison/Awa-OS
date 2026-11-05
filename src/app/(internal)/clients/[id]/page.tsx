import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { ClientDetailClient } from './ClientDetailClient'
import { CLIENT_COLUMNS, type Client, type Project } from '@/types'

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: client }, { data: projects }] = await Promise.all([
    supabase.from('clients').select(CLIENT_COLUMNS).eq('id', id).single(),
    supabase
      .from('projects')
      .select('*')
      .eq('client_id', id)
      .order('created_at', { ascending: false }),
  ])

  if (!client) notFound()

  return (
    <>
      <Header
        title={client.name}
        subtitle={client.company ?? client.email}
        backHref="/clients"
        backLabel="Clients"
      />
      <PageWrapper>
        <ClientDetailClient
          client={client as Client}
          projects={(projects ?? []) as Project[]}
        />
      </PageWrapper>
    </>
  )
}
