'use client'

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'
import type { Invoice, Client } from '@/types'

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#FAFAF8',
    fontFamily: 'Courier',
    fontSize: 9,
    color: '#1A1A1A',
    padding: 48,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 },
  wordmark: { fontSize: 16, fontFamily: 'Courier-Bold', letterSpacing: 4, color: '#0A0A0A' },
  tagline: { fontSize: 7, color: '#8A8580', marginTop: 2, letterSpacing: 2 },
  metaRight: { alignItems: 'flex-end' },
  metaLabel: { fontSize: 7, color: '#8A8580', textTransform: 'uppercase', letterSpacing: 1 },
  metaValue: { fontSize: 9, color: '#0A0A0A', fontFamily: 'Courier-Bold', marginTop: 1 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 7, color: '#8A8580', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8, borderBottom: '0.5pt solid #E0E0E0', paddingBottom: 4 },
  row: { flexDirection: 'row', marginBottom: 4 },
  col: { flex: 1 },
  lineItemHeader: { flexDirection: 'row', backgroundColor: '#F0F0EE', padding: '4 8', marginBottom: 2 },
  lineItemRow: { flexDirection: 'row', padding: '4 8', borderBottom: '0.5pt solid #F0F0EE' },
  lineDesc: { flex: 3 },
  lineQty: { flex: 1, textAlign: 'right' },
  linePrice: { flex: 1.5, textAlign: 'right' },
  lineTotal: { flex: 1.5, textAlign: 'right', fontFamily: 'Courier-Bold' },
  totalsSection: { marginTop: 8, alignItems: 'flex-end' },
  totalsRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 3, minWidth: 200 },
  totalsLabel: { flex: 1, textAlign: 'right', color: '#8A8580', marginRight: 16 },
  totalsValue: { minWidth: 80, textAlign: 'right' },
  totalDue: { fontFamily: 'Courier-Bold', fontSize: 11, color: '#0A0A0A' },
  divider: { borderTop: '1pt solid #1A1A1A', marginVertical: 4 },
  footer: { position: 'absolute', bottom: 40, left: 48, right: 48 },
  footerText: { fontSize: 7, color: '#8A8580', textAlign: 'center', letterSpacing: 1 },
})

function formatNZD(cents: number) {
  return new Intl.NumberFormat('en-NZ', { style: 'currency', currency: 'NZD', minimumFractionDigits: 2 }).format(cents / 100)
}

interface InvoicePDFProps {
  invoice: Invoice
  client: Client
}

export function InvoicePDF({ invoice, client }: InvoicePDFProps) {
  const subtotal = invoice.line_items.reduce((s, li) => s + li.amount, 0)
  const gstAmount = invoice.gst_included ? Math.round(subtotal * (15 / 115)) : 0
  const total = invoice.amount

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.wordmark}>AWA/OS</Text>
            <Text style={styles.tagline}>Te Wairama Digital</Text>
            <Text style={[styles.tagline, { marginTop: 4 }]}>tewairama.co.nz</Text>
          </View>
          <View style={styles.metaRight}>
            <Text style={styles.metaLabel}>Invoice</Text>
            <Text style={styles.metaValue}>{invoice.invoice_number}</Text>
            <Text style={[styles.metaLabel, { marginTop: 8 }]}>Date</Text>
            <Text style={styles.metaValue}>
              {new Date(invoice.created_at).toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' })}
            </Text>
            {invoice.due_date && (
              <>
                <Text style={[styles.metaLabel, { marginTop: 8 }]}>Due</Text>
                <Text style={[styles.metaValue, { color: '#C9963A' }]}>
                  {new Date(invoice.due_date).toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' })}
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Bill to */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Billed to</Text>
          <Text style={{ fontFamily: 'Courier-Bold', marginBottom: 2 }}>{client.name}</Text>
          {client.company && <Text style={{ color: '#555050' }}>{client.company}</Text>}
          <Text style={{ color: '#555050' }}>{client.email}</Text>
        </View>

        {/* Line items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services</Text>
          <View style={styles.lineItemHeader}>
            <Text style={styles.lineDesc}>Description</Text>
            <Text style={styles.lineQty}>Qty</Text>
            <Text style={styles.linePrice}>Unit price</Text>
            <Text style={styles.lineTotal}>Amount</Text>
          </View>
          {invoice.line_items.map((li, i) => (
            <View key={i} style={styles.lineItemRow}>
              <Text style={styles.lineDesc}>{li.description}</Text>
              <Text style={styles.lineQty}>{li.quantity}</Text>
              <Text style={styles.linePrice}>{formatNZD(li.unit_price)}</Text>
              <Text style={styles.lineTotal}>{formatNZD(li.amount)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Subtotal</Text>
            <Text style={styles.totalsValue}>{formatNZD(subtotal)}</Text>
          </View>
          {invoice.gst_included && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>GST (15%)</Text>
              <Text style={styles.totalsValue}>{formatNZD(gstAmount)}</Text>
            </View>
          )}
          <View style={[styles.totalsRow, { borderTop: '1pt solid #1A1A1A', paddingTop: 4 }]}>
            <Text style={[styles.totalsLabel, { fontFamily: 'Courier-Bold', color: '#0A0A0A' }]}>Total due</Text>
            <Text style={[styles.totalsValue, styles.totalDue]}>{formatNZD(total)}</Text>
          </View>
        </View>

        {/* Bank details */}
        {process.env.NEXT_PUBLIC_BANK_ACCOUNT && (
          <View style={{ marginTop: 32, borderTop: '0.5pt solid #E0E0E0', paddingTop: 12 }}>
            <Text style={styles.sectionTitle}>Bank transfer</Text>
            <Text>Account: {process.env.NEXT_PUBLIC_BANK_ACCOUNT}</Text>
            <Text style={{ color: '#555050', marginTop: 2 }}>
              Reference: {invoice.invoice_number}
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Te Wairama Digital · tewairama.co.nz · ali@tewairama.co.nz
          </Text>
        </View>
      </Page>
    </Document>
  )
}
