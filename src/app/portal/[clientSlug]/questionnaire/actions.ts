'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'

export async function submitQuestionnaireAction(
  projectId: string,
  templateId: string,
  responses: Record<string, string>
): Promise<{ error?: string }> {
  const supabase = await createServiceClient()

  // Upsert questionnaire response
  const { error: upsertError } = await supabase
    .from('questionnaire_responses')
    .upsert({
      project_id: projectId,
      template_id: templateId,
      responses,
      submitted_at: new Date().toISOString(),
      completed: true,
    }, { onConflict: 'project_id' })

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
