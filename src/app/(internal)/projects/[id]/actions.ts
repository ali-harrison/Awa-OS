'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/supabase/server'
import { logActivity } from '@/lib/logger'
import type { TaskStatus, ProjectStatus, FileType } from '@/types'

// ─── Tasks ────────────────────────────────────────────────────────────────────

export async function createTaskAction(formData: FormData): Promise<{ error: string } | null> {
  const { supabase } = await requireUser()

  const projectId = formData.get('project_id') as string
  const title = formData.get('title') as string
  const description = (formData.get('description') as string) || null
  const dueDate = (formData.get('due_date') as string) || null
  const visibleToClient = formData.get('visible_to_client') === 'on'

  if (!title) return { error: 'Title is required.' }

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
  const { supabase } = await requireUser()
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
}): Promise<{ error?: string }> {
  const { supabase } = await requireUser()

  const { error } = await supabase.from('files').insert({
    project_id: data.projectId,
    client_id: data.clientId,
    name: data.name,
    type: data.type,
    storage_path: data.storagePath,
    uploaded_by: 'internal',
  })

  if (error) return { error: error.message }
  revalidatePath(`/projects/${data.projectId}`)
  return {}
}

// ─── Notes ────────────────────────────────────────────────────────────────────

export async function saveNotesAction(projectId: string, notes: string) {
  const { supabase } = await requireUser()
  await supabase.from('projects').update({ internal_notes: notes }).eq('id', projectId)
  revalidatePath(`/projects/${projectId}`)
}

// ─── Status ───────────────────────────────────────────────────────────────────

export async function updateStatusAction(projectId: string, status: ProjectStatus) {
  const { supabase } = await requireUser()
  const { data: existing } = await supabase.from('projects').select('status').eq('id', projectId).single()
  await supabase
    .from('projects')
    .update({ status, stage_updated_at: new Date().toISOString() })
    .eq('id', projectId)
  await logActivity({ type: 'change', entity: 'project', entity_id: projectId, action: 'status_changed', meta: { field: 'status', old_value: existing?.status ?? null, new_value: status } })
  revalidatePath(`/projects/${projectId}`)
  revalidatePath('/projects')
}
