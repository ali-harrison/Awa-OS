'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { TaskStatus, ProjectStatus, FileType, CalendarEventType } from '@/types'

// ─── Tasks ────────────────────────────────────────────────────────────────────

export async function createTaskAction(
  _prev: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const projectId = formData.get('project_id') as string
  const title = formData.get('title') as string
  const description = (formData.get('description') as string) || null
  const dueDate = (formData.get('due_date') as string) || null
  const visibleToClient = formData.get('visible_to_client') === 'on'

  if (!title) return { error: 'Title is required.' }

  const supabase = await createClient()
  const { error } = await supabase.from('tasks').insert({
    project_id: projectId,
    title,
    description,
    due_date: dueDate,
    visible_to_client: visibleToClient,
    status: 'todo',
  })

  if (error) return { error: error.message }
  revalidatePath(`/projects/${projectId}`)
  return null
}

export async function updateTaskStatusAction(taskId: string, projectId: string, status: TaskStatus) {
  const supabase = await createClient()
  await supabase.from('tasks').update({ status }).eq('id', taskId)
  revalidatePath(`/projects/${projectId}`)
}

// ─── Files ────────────────────────────────────────────────────────────────────

export async function createFileRecordAction(data: {
  projectId: string
  clientId: string
  name: string
  type: FileType
  storagePath: string
  uploadedBy: 'internal' | 'client'
}) {
  const supabase = await createClient()
  await supabase.from('files').insert({
    project_id: data.projectId,
    client_id: data.clientId,
    name: data.name,
    type: data.type,
    storage_path: data.storagePath,
    uploaded_by: data.uploadedBy,
  })
  revalidatePath(`/projects/${data.projectId}`)
}

// ─── Calendar events ──────────────────────────────────────────────────────────

export async function createEventAction(
  _prev: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const projectId = formData.get('project_id') as string
  const title = formData.get('title') as string
  const type = formData.get('type') as CalendarEventType
  const startAt = formData.get('start_at') as string
  const endAt = formData.get('end_at') as string
  const visibleToClient = formData.get('visible_to_client') === 'on'
  const description = (formData.get('description') as string) || null

  if (!title || !startAt || !endAt) return { error: 'Title and dates are required.' }

  const supabase = await createClient()
  const { error } = await supabase.from('calendar_events').insert({
    project_id: projectId,
    title,
    type,
    start_at: startAt,
    end_at: endAt,
    visible_to_client: visibleToClient,
    description,
  })

  if (error) return { error: error.message }
  revalidatePath(`/projects/${projectId}`)
  return null
}

// ─── Notes ────────────────────────────────────────────────────────────────────

export async function saveNotesAction(projectId: string, notes: string) {
  const supabase = await createClient()
  await supabase.from('projects').update({ internal_notes: notes }).eq('id', projectId)
  revalidatePath(`/projects/${projectId}`)
}

// ─── Status ───────────────────────────────────────────────────────────────────

export async function updateStatusAction(projectId: string, status: ProjectStatus) {
  const supabase = await createClient()
  await supabase
    .from('projects')
    .update({ status, stage_updated_at: new Date().toISOString() })
    .eq('id', projectId)
  revalidatePath(`/projects/${projectId}`)
  revalidatePath('/projects')
}
