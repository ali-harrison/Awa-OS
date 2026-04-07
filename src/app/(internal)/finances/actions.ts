'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe/client'
import { getResend, FROM_ADDRESS } from '@/lib/resend/client'
import { templates } from '@/lib/resend/templates'
import { generateInvoicePDF } from '@/lib/generateInvoicePDF'
import { logActivity } from '@/lib/logger'
import type { LineItem } from '@/types'

/** Auto-generate next invoice number for the current year: TWD-{YEAR}-{seq} */
async function nextInvoiceNumber(supabase: Awaited<ReturnType<typeof createClient>>) {
  const year = new Date().getFullYear()
  const prefix = `TWD-${year}-`
  const { data } = await supabase
    .from('invoices')
    .select('invoice_number')
    .ilike('invoice_number', `${prefix}%`)
    .order('invoice_number', { ascending: false })
    .limit(1)

  let seq = 1
  if (data?.[0]) {
    const last = data[0].invoice_number.replace(prefix, '')
    seq = parseInt(last, 10) + 1
  }
  return `${prefix}${String(seq).padStart(4, '0')}`
}

export async function createInvoiceAction(
  _prev: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const clientId = formData.get('client_id') as string
  const projectId = formData.get('project_id') as string
  const dueDate = (formData.get('due_date') as string) || null
  const gstIncluded = formData.get('gst_included') === 'on'
  const lineItemsRaw = formData.get('line_items') as string

  if (!clientId) return { error: 'Client is required.' }

  let lineItems: LineItem[] = []
  try {
    lineItems = JSON.parse(lineItemsRaw)
  } catch {
    return { error: 'Invalid line items.' }
  }

  if (lineItems.length === 0) return { error: 'At least one line item is required.' }

  const supabase = await createClient()

  // Calculate amount (cents)
  const subtotal = lineItems.reduce((sum, li) => sum + li.amount, 0)
  const amount = subtotal // Already includes GST if gstIncluded

  const invoiceNumber = await nextInvoiceNumber(supabase)

  // Get client for Stripe
  const { data: client } = await supabase
    .from('clients')
    .select('name, email')
    .eq('id', clientId)
    .single()

  if (!client) return { error: 'Client not found.' }

  // Create Stripe payment link
  let stripePaymentIntentId: string | null = null
  try {
    if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.startsWith('sk_dummy')) {
      const paymentLink = await getStripe().paymentLinks.create({
        line_items: lineItems.map((li) => ({
          price_data: {
            currency: 'nzd',
            unit_amount: li.unit_price,
            product_data: { name: li.description },
          },
          quantity: li.quantity,
        })),
        metadata: { invoice_number: invoiceNumber, client_id: clientId },
      })
      stripePaymentIntentId = paymentLink.url
    }
  } catch (_) {
    // Stripe not configured — skip payment link silently
  }

  const { error } = await supabase.from('invoices').insert({
    client_id: clientId,
    project_id: projectId || null,
    invoice_number: invoiceNumber,
    status: 'draft',
    amount,
    gst_included: gstIncluded,
    due_date: dueDate,
    line_items: lineItems,
    stripe_payment_link: stripePaymentIntentId,
  })

  if (error) return { error: error.message }

  const { data: created } = await supabase.from('invoices').select('id').eq('invoice_number', invoiceNumber).single()
  await logActivity({ type: 'audit', entity: 'invoice', entity_id: created?.id, action: 'created', meta: { invoice_number: invoiceNumber, amount, client_id: clientId } })

  revalidatePath('/finances')
  return null
}

export async function markInvoicePaidAction(invoiceId: string) {
  const supabase = await createClient()
  await supabase
    .from('invoices')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', invoiceId)
  await logActivity({ type: 'audit', entity: 'invoice', entity_id: invoiceId, action: 'marked_paid' })
  revalidatePath('/finances')
}

export async function updateInvoiceStatusAction(invoiceId: string, status: string) {
  const supabase = await createClient()
  const { data: existing } = await supabase.from('invoices').select('status').eq('id', invoiceId).single()
  await supabase.from('invoices').update({ status }).eq('id', invoiceId)
  await logActivity({ type: 'change', entity: 'invoice', entity_id: invoiceId, action: 'status_changed', meta: { field: 'status', old_value: existing?.status ?? null, new_value: status } })
  revalidatePath('/finances')
}

export async function sendInvoiceAction(invoiceId: string): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { data: inv } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', invoiceId)
    .single()

  if (!inv) return { error: 'Invoice not found.' }

  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', inv.client_id)
    .single()

  if (!client) return { error: 'Client not found.' }

  const formattedAmount = new Intl.NumberFormat('en-NZ', {
    style: 'currency', currency: 'NZD', minimumFractionDigits: 2,
  }).format(inv.amount / 100)

  const billingDate = new Date(inv.created_at).toLocaleDateString('en-NZ', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const formattedDue = inv.due_date
    ? new Date(inv.due_date).toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'on receipt'

  const paymentLink = inv.stripe_payment_link ?? ''

  const subtotal = (inv.line_items as LineItem[]).reduce((s: number, li: LineItem) => s + li.amount, 0)
  const tax = inv.gst_included ? Math.round(subtotal * (15 / 115)) : 0

  // Render PDF server-side
  let pdfBuffer: Buffer | null = null
  try {
    pdfBuffer = await generateInvoicePDF({
      invoiceNumber: inv.invoice_number,
      billingDate,
      dueDate: formattedDue,
      from: {
        name: 'Ali Harrison',
        email: 'ali@tewairama.digital',
        address: 'Auckland, New Zealand',
      },
      to: {
        name: client.name,
        company: client.company ?? '',
        email: client.email,
        address: '',
      },
      lineItems: (inv.line_items as LineItem[]).map((li: LineItem) => ({
        description: li.description,
        quantity: li.quantity,
        amount: li.amount,
      })),
      subtotal,
      tax,
      total: inv.amount,
      paymentLink: paymentLink || undefined,
      bankDetails: {
        accountName: 'Te Wairama Digital',
        accountNumber: process.env.NEXT_PUBLIC_BANK_ACCOUNT ?? '',
        bankName: 'ASB Bank',
        reference: inv.invoice_number,
      },
    })
  } catch (err) {
    console.error('[sendInvoice] PDF render failed:', err)
  }

  const subject = templates.invoice_sent.subject({
    clientName: client.name,
    invoiceNumber: inv.invoice_number,
    amount: formattedAmount,
    dueDate: formattedDue,
    paymentLink,
  })
  const html = templates.invoice_sent.html({
    clientName: client.name,
    invoiceNumber: inv.invoice_number,
    amount: formattedAmount,
    dueDate: formattedDue,
    paymentLink,
  })

  const emailPayload: Parameters<ReturnType<typeof getResend>['emails']['send']>[0] = {
    from: FROM_ADDRESS,
    to: client.email,
    subject,
    html,
    ...(pdfBuffer
      ? { attachments: [{ filename: `${inv.invoice_number}.pdf`, content: pdfBuffer }] }
      : {}),
  }

  const result = await getResend().emails.send(emailPayload)
  if (result.error) return { error: result.error.message }

  // Mark as sent
  await supabase.from('invoices').update({ status: 'sent' }).eq('id', invoiceId)

  await supabase.from('email_log').insert({
    client_id: client.id,
    project_id: inv.project_id ?? null,
    template_key: 'invoice_sent',
    subject,
    sent_at: new Date().toISOString(),
    status: 'sent',
  })

  await logActivity({
    type: 'email',
    entity: 'invoice',
    entity_id: invoiceId,
    action: 'sent',
    meta: { to: client.email, subject, resend_id: result.data?.id ?? null },
  })

  revalidatePath('/finances')
  return {}
}
