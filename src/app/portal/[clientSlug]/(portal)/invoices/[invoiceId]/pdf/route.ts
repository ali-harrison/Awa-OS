import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { generateInvoicePDF } from '@/lib/generateInvoicePDF'
import { buildInvoicePDFProps } from '@/lib/invoices'
import { requirePortalClient } from '@/lib/portal/auth'
import type { Invoice } from '@/types'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ clientSlug: string; invoiceId: string }> }
) {
  const { clientSlug, invoiceId } = await params
  const client = await requirePortalClient(clientSlug)

  const { data: invoice } = await createServiceClient()
    .from('invoices')
    .select('*')
    .eq('id', invoiceId)
    .eq('client_id', client.id)
    .neq('status', 'draft')
    .maybeSingle()

  if (!invoice) notFound()

  const pdf = await generateInvoicePDF(buildInvoicePDFProps(invoice as Invoice, client))

  return new Response(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${invoice.invoice_number}.pdf"`,
    },
  })
}
