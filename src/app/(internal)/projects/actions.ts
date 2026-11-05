'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/supabase/server'
import { deliverTemplate } from '@/lib/resend/deliver'
import { logActivity } from '@/lib/logger'
import type { ProjectTier, ProjectStatus } from '@/types'

/** `created` means the project exists even though something went wrong, so the form mustn't offer to create it again. */
export type CreateProjectResult = { error: string; created?: boolean } | null

export async function createProjectAction(formData: FormData): Promise<CreateProjectResult> {
  const { supabase } = await requireUser()

  const clientId = formData.get('client_id') as string
  const name = formData.get('name') as string
  const tier = (formData.get('tier') as ProjectTier) || null
  const valueRaw = formData.get('value') as string
  const value = valueRaw ? parseFloat(valueRaw) : null
  const startDate = (formData.get('start_date') as string) || null
  const estimatedCompletion = (formData.get('estimated_completion') as string) || null
  const status = (formData.get('status') as ProjectStatus) || 'onboarding'

  if (!clientId || !name) return { error: 'Client and project name are required.' }

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({
      client_id: clientId,
      name,
      tier,
      value,
      start_date: startDate,
      estimated_completion: estimatedCompletion,
      status,
      stage_updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (projectError || !project) return { error: projectError?.message ?? 'Failed to create project.' }

  await logActivity({ type: 'audit', entity: 'project', entity_id: project.id, action: 'created', meta: { name, client_id: clientId } })
  revalidatePath('/projects')

  if (status !== 'onboarding') return null

  // Automated onboarding: portal setup link, then the questionnaire
  const { data: client } = await supabase
    .from('clients')
    .select('id, name, email, slug')
    .eq('id', clientId)
    .single()

  if (!client) return null

  const vars = { clientName: client.name, projectName: name }
  const email = { client, projectId: project.id, vars }

  const welcome = await deliverTemplate({ ...email, templateKey: 'welcome_client' })
  const questionnaire = welcome.error
    ? welcome
    : await deliverTemplate({ ...email, templateKey: 'questionnaire_link' })

  if (questionnaire.error) {
    return {
      created: true,
      error: `Project created, but the onboarding emails didn't send (${questionnaire.error.replace(/\.+$/, '')}). It's still at Onboarding — send them from the Emails page.`,
    }
  }

  await supabase
    .from('projects')
    .update({ status: 'questionnaire_sent', stage_updated_at: new Date().toISOString() })
    .eq('id', project.id)

  revalidatePath('/projects')
  return null
}
