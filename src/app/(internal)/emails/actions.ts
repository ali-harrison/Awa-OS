'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getResend, FROM_ADDRESS } from '@/lib/resend/client'
import { templates } from '@/lib/resend/templates'
import { logActivity } from '@/lib/logger'
import type { TemplateKey } from '@/lib/resend/templates'

async function getAppUrl(): Promise<string> {
  const h = await headers()
  const host = h.get('host') ?? ''
  const proto = h.get('x-forwarded-proto') ?? 'https'
  return `${proto}://${host}`
}

export async function sendEmailAction(data: {
  templateKey: TemplateKey
  clientId: string
  projectId: string | null
  to: string
  vars: Record<string, string>
}): Promise<{ error?: string }> {
  const tpl = templates[data.templateKey]
  if (!tpl) return { error: 'Unknown template.' }

  const supabase = await createClient()
  const appUrl = await getAppUrl()

  // Fetch client slug — needed for portal URLs
  const { data: client } = await supabase
    .from('clients')
    .select('slug')
    .eq('id', data.clientId)
    .single()

  const vars = { ...data.vars }

  // welcome_client: enable portal access, generate a one-time setup token
  if (data.templateKey === 'welcome_client' && client) {
    const token = crypto.randomUUID()
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    await supabase
      .from('clients')
      .update({ portal_access: true, portal_token: token, portal_token_expires_at: expires })
      .eq('id', data.clientId)
    vars.portalUrl = `${appUrl}/portal/access?token=${token}`
  }

  // questionnaire_link: inject the questionnaire URL from slug
  if (data.templateKey === 'questionnaire_link' && client) {
    vars.questionnaireUrl = `${appUrl}/portal/${client.slug}/questionnaire`
  }

  let subject = ''
  let html = ''
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    subject = (tpl.subject as (v: any) => string)(vars)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    html = (tpl.html as (v: any) => string)(vars)
  } catch {
    return { error: 'Failed to render template.' }
  }

  const result = await getResend().emails.send({
    from: FROM_ADDRESS,
    to: data.to,
    subject,
    html,
  })

  await supabase.from('email_log').insert({
    client_id: data.clientId,
    project_id: data.projectId,
    template_key: data.templateKey,
    subject,
    sent_at: new Date().toISOString(),
    status: result.error ? 'failed' : 'sent',
  })

  await logActivity({
    type: 'email',
    entity: 'client',
    entity_id: data.clientId,
    action: 'sent',
    meta: { to: data.to, subject, template: data.templateKey, resend_id: result.data?.id ?? null },
  })

  revalidatePath('/emails')
  return result.error ? { error: result.error.message } : {}
}
