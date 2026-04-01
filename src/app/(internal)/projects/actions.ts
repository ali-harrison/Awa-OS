'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getResend, FROM_ADDRESS } from '@/lib/resend/client'
import { templates } from '@/lib/resend/templates'
import type { ProjectTier, ProjectStatus } from '@/types'

export async function createProjectAction(
  _prev: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const clientId = formData.get('client_id') as string
  const name = formData.get('name') as string
  const tier = (formData.get('tier') as ProjectTier) || null
  const valueRaw = formData.get('value') as string
  const value = valueRaw ? parseFloat(valueRaw) : null
  const startDate = (formData.get('start_date') as string) || null
  const estimatedCompletion = (formData.get('estimated_completion') as string) || null
  const status = (formData.get('status') as ProjectStatus) || 'onboarding'

  if (!clientId || !name) return { error: 'Client and project name are required.' }

  const supabase = await createClient()

  // Insert project
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

  // Trigger automated onboarding flow
  if (status === 'onboarding') {
    const { data: client } = await supabase
      .from('clients')
      .select('name, email, slug')
      .eq('id', clientId)
      .single()

    if (client) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
      const portalUrl = `${baseUrl}/portal/${client.slug}`
      const questionnaireUrl = `${baseUrl}/portal/${client.slug}/questionnaire`

      // Send welcome email
      const welcomeResult = await getResend().emails.send({
        from: FROM_ADDRESS,
        to: client.email,
        subject: templates.welcome_client.subject({ clientName: client.name, projectName: name, portalUrl }),
        html: templates.welcome_client.html({ clientName: client.name, projectName: name, portalUrl }),
      })

      await supabase.from('email_log').insert({
        client_id: clientId,
        project_id: project.id,
        template_key: 'welcome_client',
        subject: templates.welcome_client.subject({ clientName: client.name, projectName: name, portalUrl }),
        sent_at: new Date().toISOString(),
        status: welcomeResult.error ? 'failed' : 'sent',
      })

      // Send questionnaire link email
      const questionnaireResult = await getResend().emails.send({
        from: FROM_ADDRESS,
        to: client.email,
        subject: templates.questionnaire_link.subject({ clientName: client.name, projectName: name, questionnaireUrl }),
        html: templates.questionnaire_link.html({ clientName: client.name, projectName: name, questionnaireUrl }),
      })

      await supabase.from('email_log').insert({
        client_id: clientId,
        project_id: project.id,
        template_key: 'questionnaire_link',
        subject: templates.questionnaire_link.subject({ clientName: client.name, projectName: name, questionnaireUrl }),
        sent_at: new Date().toISOString(),
        status: questionnaireResult.error ? 'failed' : 'sent',
      })

      // Update status to questionnaire_sent
      await supabase
        .from('projects')
        .update({ status: 'questionnaire_sent', stage_updated_at: new Date().toISOString() })
        .eq('id', project.id)
    }
  }

  revalidatePath('/projects')
  return null
}

export async function updateProjectStatusAction(id: string, status: ProjectStatus) {
  const supabase = await createClient()
  await supabase
    .from('projects')
    .update({ status, stage_updated_at: new Date().toISOString() })
    .eq('id', id)
  revalidatePath('/projects')
  revalidatePath(`/projects/${id}`)
}
