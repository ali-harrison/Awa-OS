'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'

export async function submitQuestionnaireAction(
  projectId: string,
  templateId: string,
  responses: Record<string, string>
): Promise<{ error?: string }> {
  const supabase = await createServiceClient()

  // Update existing row or insert new one
  const { data: existing } = await supabase
    .from('questionnaire_responses')
    .select('id')
    .eq('project_id', projectId)
    .single()

  const payload = {
    project_id: projectId,
    template_id: templateId,
    responses,
    submitted_at: new Date().toISOString(),
    completed: true,
  }

  const { error: upsertError } = existing
    ? await supabase.from('questionnaire_responses').update(payload).eq('id', existing.id)
    : await supabase.from('questionnaire_responses').insert(payload)

  if (upsertError) return { error: upsertError.message }

  // Update project status
  await supabase
    .from('projects')
    .update({
      status: 'questionnaire_received',
      stage_updated_at: new Date().toISOString(),
    })
    .eq('id', projectId)

  revalidatePath(`/projects/${projectId}`)
  return {}
}
