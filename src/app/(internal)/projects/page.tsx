import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { ProjectsClient } from './ProjectsClient'
import { CLIENT_COLUMNS, type Client, type Project } from '@/types'

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>
}) {
  const { client: defaultClientId } = await searchParams
  const supabase = await createClient()

  const [{ data: projects }, { data: clients }] = await Promise.all([
    supabase
      .from('projects')
      .select('*, client:clients(id, name, company)')
      .order('created_at', { ascending: false }),
    supabase.from('clients').select(CLIENT_COLUMNS).order('name'),
  ])

  return (
    <>
      <Header title="Projects" subtitle={`${projects?.length ?? 0} total`} />
      <PageWrapper>
        <ProjectsClient
          projects={(projects ?? []) as (Project & { client: Pick<Client, 'id' | 'name' | 'company'> })[]}
          clients={(clients ?? []) as Client[]}
          defaultClientId={defaultClientId}
        />
      </PageWrapper>
    </>
  )
}
