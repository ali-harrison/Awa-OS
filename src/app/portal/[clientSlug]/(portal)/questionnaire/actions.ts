'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'
import { requirePortalClient } from '@/lib/portal/auth'

async function saveResponses(
  clientSlug: string,
  projectId: string,
  templateId: string,
  responses: Record<string, string>,
  completed: boolean
): Promise<{ error?: string }> {
  const client = await requirePortalClient(clientSlug)
  const supabase = createServiceClient()

  const { data: project } = await supabase
    .from('projects')
    .select('id, status')
    .eq('id', projectId)
    .eq('client_id', client.id)
    .maybeSingle()

  if (!project) return { error: 'Project not found.' }

  const { data: existing } = await supabase
    .from('questionnaire_responses')
    .select('id, completed')
    .eq('project_id', projectId)
    .order('submitted_at', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle()

  if (existing?.completed) return { error: 'This questionnaire has already been submitted.' }

  const payload = {
    project_id: projectId,
    template_id: templateId,
    responses,
    submitted_at: completed ? new Date().toISOString() : null,
    completed,
  }

  const { error } = existing
    ? await supabase.from('questionnaire_responses').update(payload).eq('id', existing.id)
    : await supabase.from('questionnaire_responses').insert(payload)

  if (error) return { error: error.message }

  // Only move early-stage projects along — a late submission mustn't drag a live project backwards
  if (completed && ['onboarding', 'questionnaire_sent'].includes(project.status)) {
    await supabase
      .from('projects')
      .update({ status: 'questionnaire_received', stage_updated_at: new Date().toISOString() })
      .eq('id', projectId)
  }

  revalidatePath(`/projects/${projectId}`)
  return {}
}

export async function submitQuestionnaireAction(
  clientSlug: string,
  projectId: string,
  templateId: string,
  responses: Record<string, string>
) {
  return saveResponses(clientSlug, projectId, templateId, responses, true)
}

export async function saveQuestionnaireDraftAction(
  clientSlug: string,
  projectId: string,
  templateId: string,
  responses: Record<string, string>
) {
  return saveResponses(clientSlug, projectId, templateId, responses, false)
}
