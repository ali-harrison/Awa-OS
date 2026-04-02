import { createElement } from 'react'
import type { InvoiceProps } from '@/components/pdf/InvoicePDF'

/**
 * Render an InvoicePDF to a Buffer server-side.
 * Uses dynamic imports so @react-pdf/renderer never touches SSR bundling.
 */
export async function generateInvoicePDF(props: InvoiceProps): Promise<Buffer> {
  const { renderToBuffer } = await import('@react-pdf/renderer')
  const { InvoicePDF } = await import('@/components/pdf/InvoicePDF')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return renderToBuffer(createElement(InvoicePDF, props) as any)
}
