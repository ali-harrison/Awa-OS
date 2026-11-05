import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/supabase/server'
import { generateInvoicePDF } from '@/lib/generateInvoicePDF'
import { buildInvoicePDFProps } from '@/lib/invoices'
import type { Invoice } from '@/types'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase } = await requireUser()

  const { data: invoice } = await supabase.from('invoices').select('*').eq('id', id).maybeSingle()
  if (!invoice) notFound()

  const { data: client } = await supabase
    .from('clients')
    .select('name, company, email')
    .eq('id', invoice.client_id)
    .maybeSingle()
  if (!client) notFound()

  const pdf = await generateInvoicePDF(buildInvoicePDFProps(invoice as Invoice, client))

  return new Response(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${invoice.invoice_number}.pdf"`,
    },
  })
}
