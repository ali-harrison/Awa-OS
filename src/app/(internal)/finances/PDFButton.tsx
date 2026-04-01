'use client'

import { PDFDownloadLink } from '@react-pdf/renderer'
import { InvoicePDF } from '@/components/pdf/InvoicePDF'
import type { Invoice, Client } from '@/types'

export default function PDFButton({ invoice, client }: { invoice: Invoice; client: Client }) {
  return (
    <PDFDownloadLink
      document={<InvoicePDF invoice={invoice} client={client} />}
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
