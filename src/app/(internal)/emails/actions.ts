'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { resend, FROM_ADDRESS } from '@/lib/resend/client'
import { templates } from '@/lib/resend/templates'
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

  const { error } = await resend.emails.send({
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
    status: error ? 'failed' : 'sent',
  })

  revalidatePath('/emails')
  return error ? { error: error.message } : {}
}
