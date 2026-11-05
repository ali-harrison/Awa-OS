'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe/client'
import { templates } from '@/lib/resend/templates'
import { deliverTemplate } from '@/lib/resend/deliver'
import { generateInvoicePDF } from '@/lib/generateInvoicePDF'
import { buildInvoicePDFProps, formatDueDate } from '@/lib/invoices'
import { formatNZD } from '@/lib/format'
import { logActivity } from '@/lib/logger'
import { formatInvoiceNumber, type Invoice, type LineItem } from '@/types'

type Supabase = Awaited<ReturnType<typeof requireUser>>['supabase']

/** Auto-generate next invoice number for the current year: TWD-{YEAR}-{seq} */
async function nextInvoiceNumber(supabase: Supabase) {
  const year = new Date().getFullYear()
  const prefix = formatInvoiceNumber(year, 0).slice(0, -4)
  const { data } = await supabase
    .from('invoices')
    .select('invoice_number')
    .ilike('invoice_number', `${prefix}%`)
    .order('invoice_number', { ascending: false })
    .limit(1)

  const last = data?.[0] ? parseInt(data[0].invoice_number.replace(prefix, ''), 10) : 0
  return formatInvoiceNumber(year, last + 1)
}

/** Returns null when Stripe isn't configured; the invoice can still be paid by bank transfer. */
async function createPaymentLink(lineItems: LineItem[], invoiceNumber: string, clientId: string) {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key || key.startsWith('sk_dummy')) return null

  try {
    const paymentLink = await getStripe().paymentLinks.create({
      line_items: lineItems.map((li) => ({
        price_data: {
          currency: 'nzd',
          // Stripe needs whole-number quantities, so bill 1.5 hours as one line
          unit_amount: Number.isInteger(li.quantity) ? li.unit_price : li.amount,
          product_data: { name: li.description },
        },
        quantity: Number.isInteger(li.quantity) ? li.quantity : 1,
      })),
      // Copied onto the Checkout Session — the Stripe webhook matches on invoice_number
      metadata: { invoice_number: invoiceNumber, client_id: clientId },
    })
    return paymentLink.url
  } catch (err) {
    console.error(`[createInvoice] Stripe payment link failed for ${invoiceNumber}:`, err)
    return null
  }
}

export async function createInvoiceAction(formData: FormData): Promise<{ error: string } | null> {
  const { supabase } = await requireUser()

  const clientId = formData.get('client_id') as string
  const projectId = (formData.get('project_id') as string) || null
  const dueDate = (formData.get('due_date') as string) || null
  const gstIncluded = formData.get('gst_included') === 'on'

  if (!clientId) return { error: 'Client is required.' }

  let lineItems: LineItem[]
  try {
    const parsed = JSON.parse(formData.get('line_items') as string) as LineItem[]
    // Amounts are always derived here, in cents, so the total can't drift from the lines
    lineItems = parsed.map((li) => ({
      description: li.description.trim(),
      quantity: li.quantity,
      unit_price: Math.round(li.unit_price),
      amount: Math.round(li.quantity * li.unit_price),
    }))
  } catch {
    return { error: 'Invalid line items.' }
  }

  if (lineItems.length === 0) return { error: 'At least one line item is required.' }
  if (lineItems.some((li) => !li.description || li.amount <= 0)) {
    return { error: 'Every line item needs a description and an amount.' }
  }

  const amount = lineItems.reduce((sum, li) => sum + li.amount, 0)
  const invoiceNumber = await nextInvoiceNumber(supabase)
  const paymentLink = await createPaymentLink(lineItems, invoiceNumber, clientId)

  const { data: created, error } = await supabase
    .from('invoices')
    .insert({
      client_id: clientId,
      project_id: projectId,
      invoice_number: invoiceNumber,
      status: 'draft',
      amount,
      gst_included: gstIncluded,
      due_date: dueDate,
      line_items: lineItems,
      stripe_payment_link: paymentLink,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  await logActivity({ type: 'audit', entity: 'invoice', entity_id: created.id, action: 'created', meta: { invoice_number: invoiceNumber, amount, client_id: clientId } })

  revalidatePath('/finances')
  return null
}

export async function markInvoicePaidAction(invoiceId: string) {
  const { supabase } = await requireUser()
  await supabase
    .from('invoices')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', invoiceId)
  await logActivity({ type: 'audit', entity: 'invoice', entity_id: invoiceId, action: 'marked_paid' })
  revalidatePath('/finances')
}

export async function sendInvoiceAction(invoiceId: string): Promise<{ error?: string }> {
  const { supabase } = await requireUser()

  const { data } = await supabase.from('invoices').select('*').eq('id', invoiceId).maybeSingle()
  if (!data) return { error: 'Invoice not found.' }
  const invoice = data as Invoice

  const { data: client } = await supabase
    .from('clients')
    .select('id, name, company, email, slug')
    .eq('id', invoice.client_id)
    .maybeSingle()
  if (!client) return { error: 'Client not found.' }

  // The email says the invoice is attached, so don't send it if the PDF failed
  let pdf: Buffer
  try {
    pdf = await generateInvoicePDF(buildInvoicePDFProps(invoice, client))
  } catch (err) {
    console.error('[sendInvoice] PDF render failed:', err)
    return { error: 'The invoice PDF could not be generated, so nothing was sent.' }
  }

  const vars: Parameters<typeof templates.invoice_sent.html>[0] = {
    clientName: client.name,
    invoiceNumber: invoice.invoice_number,
    amount: formatNZD(invoice.amount),
    dueDate: formatDueDate(invoice.due_date),
    paymentLink: invoice.stripe_payment_link ?? '',
  }

  const result = await deliverTemplate({
    templateKey: 'invoice_sent',
    client,
    projectId: invoice.project_id,
    vars: { ...vars },
    attachments: [{ filename: `${invoice.invoice_number}.pdf`, content: pdf }],
    logEntity: { entity: 'invoice', entity_id: invoiceId },
  })
  if (result.error) return result

  // Resending a paid invoice mustn't flip it back
  await supabase.from('invoices').update({ status: 'sent' }).eq('id', invoiceId).eq('status', 'draft')

  revalidatePath('/finances')
  return {}
}
