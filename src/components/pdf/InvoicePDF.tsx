import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'

// ─── Font ─────────────────────────────────────────────────────────────────────

Font.register({
  family: 'JetBrains Mono',
  fonts: [
    {
      src: 'https://cdn.jsdelivr.net/npm/@fontsource/jetbrains-mono@5/files/jetbrains-mono-latin-400-normal.woff2',
      fontWeight: 400,
    },
    {
      src: 'https://cdn.jsdelivr.net/npm/@fontsource/jetbrains-mono@5/files/jetbrains-mono-latin-700-normal.woff2',
      fontWeight: 700,
    },
  ],
})

// ─── Tokens ───────────────────────────────────────────────────────────────────

const C = {
  bg: '#0f0f0f',
  bone: '#f0ece3',
  amber: '#d97706',
  muted: '#8a8580',
  border: '#2a2a2a',
  rowAlt: '#161616',
}

const FONT = 'JetBrains Mono'

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    backgroundColor: C.bg,
    fontFamily: FONT,
    fontSize: 8,
    color: C.bone,
    paddingTop: 48,
    paddingBottom: 48,
    paddingHorizontal: 48,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  invoiceLabel: {
    fontSize: 32,
    fontWeight: 700,
    color: C.bone,
    letterSpacing: 4,
  },
  invoiceNumber: {
    fontSize: 16,
    fontWeight: 700,
    color: C.amber,
    letterSpacing: 1,
  },
  divider: {
    borderTopWidth: 0.5,
    borderTopColor: C.border,
    marginVertical: 16,
  },
  dividerBone: {
    borderTopWidth: 0.5,
    borderTopColor: C.bone,
    marginVertical: 16,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 4,
  },
  metaCol: { flex: 1 },
  metaColDate: { width: 120, alignItems: 'flex-end' },
  metaLabel: {
    fontSize: 7,
    color: C.muted,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  metaValue: { fontSize: 8, color: C.bone, lineHeight: 1.6 },
  metaValueBold: { fontSize: 8, fontWeight: 700, color: C.bone, marginBottom: 2 },
  dateValue: { fontSize: 14, fontWeight: 700, color: C.bone, textAlign: 'right' },
  dateSub: { fontSize: 7, color: C.muted, textAlign: 'right', marginTop: 4 },
  dateAmber: { fontSize: 11, fontWeight: 700, color: C.amber, textAlign: 'right' },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: C.border,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 1,
  },
  tableRow: { flexDirection: 'row', paddingVertical: 7, paddingHorizontal: 8 },
  tableRowAlt: { backgroundColor: C.rowAlt },
  colDesc: { flex: 4 },
  colQty: { width: 48, textAlign: 'center' },
  colAmt: { width: 80, textAlign: 'right' },
  thText: {
    fontSize: 7,
    fontWeight: 700,
    color: C.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  tdText: { fontSize: 8, color: C.bone },
  totalsSection: { marginTop: 12, alignItems: 'flex-end' },
  totalsRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 4, minWidth: 200 },
  totalsLabel: { width: 100, textAlign: 'right', color: C.muted, fontSize: 8, marginRight: 16 },
  totalsValue: { width: 80, textAlign: 'right', fontSize: 8, color: C.bone },
  totalsDivider: { width: 196, borderTopWidth: 0.5, borderTopColor: C.border, marginBottom: 4, marginTop: 2 },
  totalLabel: { width: 100, textAlign: 'right', color: C.bone, fontWeight: 700, fontSize: 9, marginRight: 16 },
  totalValue: { width: 80, textAlign: 'right', fontSize: 11, fontWeight: 700, color: C.amber },
  disclaimer: { fontSize: 7, color: C.muted, marginTop: 10, lineHeight: 1.5 },
  paymentTitle: {
    fontSize: 7,
    color: C.muted,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  paymentCols: { flexDirection: 'row', gap: 32 },
  paymentCol: { flex: 1 },
  paymentKey: {
    fontSize: 7,
    color: C.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  paymentValue: { fontSize: 8, color: C.bone, marginBottom: 8 },
  paymentLinkRow: { marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 8 },
  paymentLinkLabel: { fontSize: 7, color: C.muted, letterSpacing: 1, textTransform: 'uppercase' },
  paymentLinkUrl: { fontSize: 8, color: C.amber, fontWeight: 700 },
})

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InvoiceProps {
  invoiceNumber: string
  billingDate: string
  dueDate: string
  from: { name: string; email: string; address: string }
  to: { name: string; company: string; email: string; address: string }
  lineItems: { description: string; quantity: number; amount: number }[]
  subtotal: number
  tax: number
  total: number
  paymentLink?: string
  bankDetails: {
    accountName: string
    accountNumber: string
    bankName: string
    swiftBic?: string
    reference: string
  }
  terms?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function nzd(cents: number) {
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
    minimumFractionDigits: 2,
  }).format(cents / 100)
}

// ─── Component ────────────────────────────────────────────────────────────────

export function InvoicePDF(props: InvoiceProps) {
  const { invoiceNumber, billingDate, dueDate, from, to, lineItems, subtotal, tax, total, paymentLink, bankDetails, terms } = props

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* Header */}
        <View style={s.headerRow}>
          <Text style={s.invoiceLabel}>INVOICE</Text>
          <Text style={s.invoiceNumber}>#{invoiceNumber}</Text>
        </View>
        <View style={s.dividerBone} />

        {/* From / To / Date */}
        <View style={s.metaRow}>
          <View style={s.metaCol}>
            <Text style={s.metaLabel}>Invoice From</Text>
            <Text style={s.metaValueBold}>{from.name}</Text>
            <Text style={s.metaValue}>{from.email}</Text>
            <Text style={s.metaValue}>{from.address}</Text>
          </View>
          <View style={s.metaCol}>
            <Text style={s.metaLabel}>Bill To</Text>
            {to.company ? <Text style={s.metaValueBold}>{to.company}</Text> : null}
            <Text style={to.company ? s.metaValue : s.metaValueBold}>{to.name}</Text>
            <Text style={s.metaValue}>{to.email}</Text>
            {to.address ? <Text style={s.metaValue}>{to.address}</Text> : null}
          </View>
          <View style={s.metaColDate}>
            <Text style={s.metaLabel}>Billing Date</Text>
            <Text style={s.dateValue}>{billingDate}</Text>
            {dueDate ? (
              <>
                <Text style={s.dateSub}>Due</Text>
                <Text style={s.dateAmber}>{dueDate}</Text>
              </>
            ) : null}
          </View>
        </View>
        <View style={s.divider} />

        {/* Line items */}
        <View style={s.tableHeader}>
          <Text style={[s.thText, s.colDesc]}>Description</Text>
          <Text style={[s.thText, s.colQty]}>Qty</Text>
          <Text style={[s.thText, s.colAmt]}>Amount</Text>
        </View>
        {lineItems.map((li, i) => (
          <View key={i} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}>
            <Text style={[s.tdText, s.colDesc]}>{li.description}</Text>
            <Text style={[s.tdText, s.colQty]}>{li.quantity}</Text>
            <Text style={[s.tdText, s.colAmt]}>{nzd(li.amount)}</Text>
          </View>
        ))}

        {/* Totals */}
        <View style={s.totalsSection}>
          <View style={s.totalsRow}>
            <Text style={s.totalsLabel}>Subtotal</Text>
            <Text style={s.totalsValue}>{nzd(subtotal)}</Text>
          </View>
          {tax > 0 ? (
            <View style={s.totalsRow}>
              <Text style={s.totalsLabel}>GST (15%)</Text>
              <Text style={s.totalsValue}>{nzd(tax)}</Text>
            </View>
          ) : null}
          <View style={s.totalsDivider} />
          <View style={s.totalsRow}>
            <Text style={s.totalLabel}>Total Due</Text>
            <Text style={s.totalValue}>{nzd(total)}</Text>
          </View>
        </View>
        <Text style={s.disclaimer}>
          All amounts are in New Zealand Dollars (NZD) and include GST where applicable.
        </Text>
        <View style={s.divider} />

        {/* Payment Details */}
        <Text style={s.paymentTitle}>Payment Details</Text>
        <View style={s.paymentCols}>
          <View style={s.paymentCol}>
            <Text style={s.paymentKey}>Account Name</Text>
            <Text style={s.paymentValue}>{bankDetails.accountName}</Text>
            <Text style={s.paymentKey}>Account Number</Text>
            <Text style={s.paymentValue}>{bankDetails.accountNumber}</Text>
            <Text style={s.paymentKey}>Bank</Text>
            <Text style={s.paymentValue}>{bankDetails.bankName}</Text>
            {bankDetails.swiftBic ? (
              <>
                <Text style={s.paymentKey}>SWIFT / BIC</Text>
                <Text style={s.paymentValue}>{bankDetails.swiftBic}</Text>
              </>
            ) : null}
            <Text style={s.paymentKey}>Reference</Text>
            <Text style={s.paymentValue}>{bankDetails.reference}</Text>
          </View>
          <View style={s.paymentCol}>
            <Text style={s.paymentKey}>Terms</Text>
            <Text style={[s.paymentValue, { lineHeight: 1.6 }]}>
              {terms ?? 'Payment is due by the date shown on this invoice. Bank transfer is preferred. Please include the invoice number as your payment reference.'}
            </Text>
          </View>
        </View>
        {paymentLink ? (
          <View style={s.paymentLinkRow}>
            <Text style={s.paymentLinkLabel}>Pay online →</Text>
            <Text style={s.paymentLinkUrl}>{paymentLink}</Text>
          </View>
        ) : null}

      </Page>
    </Document>
  )
}

export default InvoicePDF
