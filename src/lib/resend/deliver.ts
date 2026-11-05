import { getAppUrl } from '@/lib/app-url'
import { logActivity } from '@/lib/logger'
import { generatePortalToken } from '@/lib/portal/auth'
import { createClient } from '@/lib/supabase/server'
import { FROM_ADDRESS, REPLY_TO_ADDRESS, getResend } from './client'
import { templates, type TemplateKey } from './templates'

interface DeliverOptions {
  templateKey: TemplateKey
  client: { id: string; slug: string; email: string }
  projectId: string | null
  vars: Record<string, string>
  attachments?: { filename: string; content: Buffer }[]
  logEntity?: { entity: string; entity_id: string }
}

/**
 * Render a template, send it, and record it in email_log and the activity log.
 * Fills in the portal links itself so every sender gets working ones.
 * Reports failure as `{ error }` rather than throwing, so one bad send can't take out the caller.
 */
export async function deliverTemplate({
  templateKey,
  client,
  projectId,
  vars,
  attachments,
  logEntity,
}: DeliverOptions): Promise<{ error?: string }> {
  try {
    const appUrl = await getAppUrl()
    const allVars = { ...vars }

    if (templateKey === 'welcome_client') {
      const token = await generatePortalToken(client.id)
      allVars.portalUrl = `${appUrl}/portal/access?token=${token}`
    }
    if (templateKey === 'questionnaire_link') {
      allVars.questionnaireUrl = `${appUrl}/portal/${client.slug}/questionnaire`
    }

    const template = templates[templateKey]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subject = (template.subject as (v: any) => string)(allVars)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const html = (template.html as (v: any) => string)(allVars)

    const result = await getResend().emails.send({
      from: FROM_ADDRESS,
      replyTo: REPLY_TO_ADDRESS,
      to: client.email,
      subject,
      html,
      ...(attachments ? { attachments } : {}),
    })

    const supabase = await createClient()
    await supabase.from('email_log').insert({
      client_id: client.id,
      project_id: projectId,
      template_key: templateKey,
      subject,
      sent_at: new Date().toISOString(),
      status: result.error ? 'failed' : 'sent',
    })

    await logActivity({
      type: 'email',
      entity: logEntity?.entity ?? 'client',
      entity_id: logEntity?.entity_id ?? client.id,
      action: result.error ? 'failed' : 'sent',
      meta: { to: client.email, subject, template: templateKey, resend_id: result.data?.id ?? null },
    })

    return result.error ? { error: result.error.message } : {}
  } catch (err) {
    console.error(`[deliverTemplate] ${templateKey} failed:`, err)
    return { error: err instanceof Error ? err.message : 'Email could not be sent.' }
  }
}
