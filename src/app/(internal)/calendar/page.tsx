import { createClient } from '@/lib/supabase/server'
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
    <CalendarClient
      events={(events ?? []) as (CalendarEvent & { project?: Pick<Project, 'id' | 'name'> | null })[]}
      projects={(projects ?? []) as Project[]}
    />
  )
}
