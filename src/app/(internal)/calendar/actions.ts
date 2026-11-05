'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/supabase/server'
import type { CalendarEventType } from '@/types'

/** Used by both the calendar and a project's timeline tab. Expects `start_at`/`end_at` as ISO strings. */
export async function createCalendarEventAction(formData: FormData): Promise<{ error: string } | null> {
  const { supabase } = await requireUser()

  const title = formData.get('title') as string
  const type = formData.get('type') as CalendarEventType
  const projectId = (formData.get('project_id') as string) || null
  const startAt = formData.get('start_at') as string
  const endAt = formData.get('end_at') as string
  const visibleToClient = formData.get('visible_to_client') === 'on'
  const description = (formData.get('description') as string) || null

  if (!title || !startAt || !endAt) return { error: 'Title and dates are required.' }
  if (new Date(endAt) < new Date(startAt)) return { error: 'The event can\'t end before it starts.' }

  const { error } = await supabase.from('calendar_events').insert({
    title, type, project_id: projectId, start_at: startAt, end_at: endAt,
    visible_to_client: visibleToClient, description,
  })

  if (error) return { error: error.message }
  revalidatePath('/calendar')
  if (projectId) revalidatePath(`/projects/${projectId}`)
  return null
}

export async function deleteCalendarEventAction(id: string) {
  const { supabase } = await requireUser()
  await supabase.from('calendar_events').delete().eq('id', id)
  revalidatePath('/calendar')
}
