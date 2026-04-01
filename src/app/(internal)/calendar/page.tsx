import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { CalendarClient } from './CalendarClient'
import type { CalendarEvent, Project } from '@/types'

export default async function CalendarPage() {
  const supabase = await createClient()

  const [{ data: events }, { data: projects }] = await Promise.all([
    supabase
      .from('calendar_events')
      .select('*, project:projects(id, name)')
      .order('start_at'),
    supabase.from('projects').select('id, name, client_id').order('name'),
  ])

  return (
    <>
      <Header title="Calendar" subtitle="Events & deadlines" />
      <PageWrapper>
        <CalendarClient
          events={(events ?? []) as (CalendarEvent & { project?: Pick<Project, 'id' | 'name'> | null })[]}
          projects={(projects ?? []) as Project[]}
        />
      </PageWrapper>
    </>
  )
}
