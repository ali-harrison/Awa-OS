'use client'

import { PDFDownloadLink } from '@react-pdf/renderer'
import { InvoicePDF } from '@/components/pdf/InvoicePDF'
import type { Invoice, LineItem } from '@/types'

type ClientSnippet = { id: string; name: string; company: string | null }

export default function PDFButton({ invoice, client }: { invoice: Invoice; client: ClientSnippet }) {
  const billingDate = new Date(invoice.created_at).toLocaleDateString('en-NZ', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
  const dueDate = invoice.due_date
    ? new Date(invoice.due_date).toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'on receipt'

  const lineItems = (invoice.line_items as LineItem[]).map((li) => ({
    description: li.description,
    quantity: li.quantity,
    amount: li.amount,
  }))
  const subtotal = lineItems.reduce((s, li) => s + li.amount, 0)
  const tax = invoice.gst_included ? Math.round(subtotal * (15 / 115)) : 0

  return (
    <PDFDownloadLink
      document={
        <InvoicePDF
          invoiceNumber={invoice.invoice_number}
          billingDate={billingDate}
          dueDate={dueDate}
          from={{ name: 'Ali Harrison', email: 'ali@tewairama.digital', address: 'Auckland, New Zealand' }}
          to={{ name: client.name, company: client.company ?? '', email: '', address: '' }}
          lineItems={lineItems}
          subtotal={subtotal}
          tax={tax}
          total={invoice.amount}
          paymentLink={invoice.stripe_payment_link ?? undefined}
          bankDetails={{
            accountName: 'Te Wairama Digital',
            accountNumber: process.env.NEXT_PUBLIC_BANK_ACCOUNT ?? '',
            bankName: 'ASB Bank',
            reference: invoice.invoice_number,
          }}
        />
      }
      fileName={`${invoice.invoice_number}.pdf`}
    >
      {({ loading }) => (
        <span className="text-[#555050] hover:text-[#F5F0E8] font-mono text-[10px] cursor-pointer transition-colors">
          {loading ? '…' : 'PDF'}
        </span>
      )}
    </PDFDownloadLink>
  )
}
