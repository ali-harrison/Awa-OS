'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'
import { getLatestProject, requirePortalClient } from '@/lib/portal/auth'
import { FILES_BUCKET, storageFileName } from '@/lib/storage'

// Portal clients have no Supabase login, so the browser can't write to the bucket
// directly: the server checks the session, then hands back a one-file upload ticket.

export async function createPortalUploadAction(
  clientSlug: string,
  fileName: string
): Promise<{ error: string } | { path: string; token: string }> {
  const client = await requirePortalClient(clientSlug)
  const project = await getLatestProject(client.id)
  if (!project) return { error: 'No active project to upload to.' }

  const path = `${client.slug}/${project.id}/client_uploads/${storageFileName(fileName)}`
  const { data, error } = await createServiceClient()
    .storage.from(FILES_BUCKET)
    .createSignedUploadUrl(path)

  if (error || !data) return { error: 'Upload could not be started. Please try again.' }
  return { path: data.path, token: data.token }
}

export async function recordPortalUploadAction(
  clientSlug: string,
  path: string,
  name: string
): Promise<{ error?: string }> {
  const client = await requirePortalClient(clientSlug)
  const project = await getLatestProject(client.id)

  if (!project || !path.startsWith(`${client.slug}/${project.id}/client_uploads/`)) {
    return { error: 'Upload could not be saved.' }
  }

  const { error } = await createServiceClient().from('files').insert({
    project_id: project.id,
    client_id: client.id,
    name,
    type: 'other',
    storage_path: path,
    uploaded_by: 'client',
  })

  if (error) return { error: 'Upload could not be saved.' }

  revalidatePath(`/portal/${client.slug}/files`)
  revalidatePath(`/projects/${project.id}`)
  return {}
}
