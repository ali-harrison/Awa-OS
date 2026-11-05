import type { InvoiceProps } from '@/components/pdf/InvoicePDF'
import { formatDate, nzDate } from '@/lib/format'
import type { Client, Invoice, InvoiceStatus } from '@/types'

const GST_FRACTION = 15 / 115 // the GST inside a GST-inclusive total

export function gstIncludedIn(total: number): number {
  return Math.round(total * GST_FRACTION)
}

/** Nothing flips invoices to `overdue` in the DB, so derive it from the due date. */
export function displayStatus(invoice: Pick<Invoice, 'status' | 'due_date'>): InvoiceStatus {
  if (invoice.status === 'sent' && invoice.due_date && invoice.due_date < nzDate()) return 'overdue'
  return invoice.status
}

export function formatDueDate(dueDate: string | null): string {
  return dueDate ? formatDate(dueDate, 'long') : 'on receipt'
}

export function buildInvoicePDFProps(
  invoice: Invoice,
  client: Pick<Client, 'name' | 'company' | 'email'>
): InvoiceProps {
  const subtotal = invoice.line_items.reduce((sum, li) => sum + li.amount, 0)

  return {
    invoiceNumber: invoice.invoice_number,
    billingDate: formatDate(invoice.created_at, 'long'),
    dueDate: formatDueDate(invoice.due_date),
    from: { name: 'Ali Harrison', email: 'ali@tewairama.digital', address: 'Auckland, New Zealand' },
    to: { name: client.name, company: client.company ?? '', email: client.email, address: '' },
    lineItems: invoice.line_items.map(({ description, quantity, amount }) => ({ description, quantity, amount })),
    subtotal,
    tax: invoice.gst_included ? gstIncludedIn(subtotal) : 0,
    total: invoice.amount,
    paymentLink: invoice.stripe_payment_link ?? undefined,
    bankDetails: {
      accountName: 'Te Wairama Digital',
      accountNumber: process.env.NEXT_PUBLIC_BANK_ACCOUNT ?? '',
      bankName: 'ASB Bank',
      reference: invoice.invoice_number,
    },
  }
}
