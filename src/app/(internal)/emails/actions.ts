'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/supabase/server'
import { deliverTemplate } from '@/lib/resend/deliver'
import { templates, type TemplateKey } from '@/lib/resend/templates'
import { sendInvoiceAction } from '../finances/actions'

export async function sendEmailAction(data: {
  templateKey: TemplateKey
  clientId: string
  projectId: string | null
  vars: Record<string, string>
}): Promise<{ error?: string }> {
  const { supabase } = await requireUser()

  if (!templates[data.templateKey]) return { error: 'Unknown template.' }

  const { data: client } = await supabase
    .from('clients')
    .select('id, slug, email')
    .eq('id', data.clientId)
    .maybeSingle()

  if (!client) return { error: 'Client not found.' }

  // This email promises an attached invoice, so it has to go through the real invoice
  if (data.templateKey === 'invoice_sent') {
    const { data: invoice } = await supabase
      .from('invoices')
      .select('id')
      .eq('client_id', client.id)
      .eq('invoice_number', data.vars.invoiceNumber)
      .maybeSingle()

    if (!invoice) return { error: `This client has no invoice ${data.vars.invoiceNumber}.` }

    const result = await sendInvoiceAction(invoice.id)
    revalidatePath('/emails')
    return result
  }

  const result = await deliverTemplate({
    templateKey: data.templateKey,
    client,
    projectId: data.projectId,
    vars: data.vars,
  })

  revalidatePath('/emails')
  return result
}
