'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getResend, FROM_ADDRESS } from '@/lib/resend/client'
import { templates } from '@/lib/resend/templates'
import { logActivity } from '@/lib/logger'
import type { TemplateKey } from '@/lib/resend/templates'

export async function sendEmailAction(data: {
  templateKey: TemplateKey
  clientId: string
  projectId: string | null
  to: string
  vars: Record<string, string>
}): Promise<{ error?: string }> {
  const tpl = templates[data.templateKey]
  if (!tpl) return { error: 'Unknown template.' }

  // Build typed vars for each template
  let subject = ''
  let html = ''

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    subject = (tpl.subject as (v: any) => string)(data.vars)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    html = (tpl.html as (v: any) => string)(data.vars)
  } catch {
    return { error: 'Failed to render template.' }
  }

  const result = await getResend().emails.send({
    from: FROM_ADDRESS,
    to: data.to,
    subject,
    html,
  })

  const supabase = await createClient()
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
