'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { CalendarEventType } from '@/types'

export async function createCalendarEventAction(
  _prev: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const title = formData.get('title') as string
  const type = formData.get('type') as CalendarEventType
  const projectId = (formData.get('project_id') as string) || null
  const startAt = formData.get('start_at') as string
  const endAt = formData.get('end_at') as string
  const visibleToClient = formData.get('visible_to_client') === 'on'
  const description = (formData.get('description') as string) || null

  if (!title || !startAt || !endAt) return { error: 'Title and dates are required.' }

  const supabase = await createClient()
  const { error } = await supabase.from('calendar_events').insert({
    title, type, project_id: projectId, start_at: startAt, end_at: endAt,
    visible_to_client: visibleToClient, description,
  })

  if (error) return { error: error.message }
  revalidatePath('/calendar')
  return null
}

export async function deleteCalendarEventAction(id: string) {
  const supabase = await createClient()
  await supabase.from('calendar_events').delete().eq('id', id)
  revalidatePath('/calendar')
}
