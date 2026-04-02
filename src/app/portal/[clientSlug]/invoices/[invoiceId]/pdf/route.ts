import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { generateInvoicePDF } from '@/lib/generateInvoicePDF'
import { PORTAL_COOKIE } from '@/lib/portal/auth'
import type { LineItem } from '@/types'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ clientSlug: string; invoiceId: string }> }
) {
  const { invoiceId } = await params

  const cookieStore = await cookies()
  const raw = cookieStore.get(PORTAL_COOKIE)?.value
  if (!raw) return notFound()

  let session: { clientId: string }
  try { session = JSON.parse(raw) } catch { return notFound() }

  const supabase = await createServiceClient()

  const { data: inv } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', invoiceId)
    .eq('client_id', session.clientId)
    .single()

  if (!inv) return notFound()

  const { data: client } = await supabase
    .from('clients')
    .select('name, company, email')
    .eq('id', session.clientId)
    .single()

  if (!client) return notFound()

  const billingDate = new Date(inv.created_at).toLocaleDateString('en-NZ', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
  const dueDate = inv.due_date
    ? new Date(inv.due_date).toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'on receipt'

  const lineItems = (inv.line_items as LineItem[]).map((li: LineItem) => ({
    description: li.description,
    quantity: li.quantity,
    amount: li.amount,
  }))
  const subtotal = lineItems.reduce((s: number, li) => s + li.amount, 0)
  const tax = inv.gst_included ? Math.round(subtotal * (15 / 115)) : 0

  const pdf = await generateInvoicePDF({
    invoiceNumber: inv.invoice_number,
    billingDate,
    dueDate,
    from: { name: 'Ali Harrison', email: 'ali@tewairama.digital', address: 'Auckland, New Zealand' },
    to: { name: client.name, company: client.company ?? '', email: client.email, address: '' },
    lineItems,
    subtotal,
    tax,
    total: inv.amount,
    paymentLink: inv.stripe_payment_link ?? undefined,
    bankDetails: {
      accountName: 'Te Wairama Digital',
      accountNumber: process.env.NEXT_PUBLIC_BANK_ACCOUNT ?? '',
      bankName: 'ASB Bank',
      reference: inv.invoice_number,
    },
  })

  return new Response(pdf.buffer as ArrayBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${inv.invoice_number}.pdf"`,
    },
  })
}
