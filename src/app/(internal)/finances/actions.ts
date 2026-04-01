'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe/client'
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
      stripePaymentIntentId = paymentLink.id
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
