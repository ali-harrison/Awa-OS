import { getStripe } from './client'

/**
 * Create a Stripe Payment Intent for an invoice.
 * Amount is in cents (NZD).
 */
export async function createPaymentIntent({
  amountCents,
  invoiceId,
  clientId,
  description,
}: {
  amountCents: number
  invoiceId: string
  clientId: string
  description: string
}) {
  return getStripe().paymentIntents.create({
    amount: amountCents,
    currency: 'nzd',
    description,
    metadata: {
      invoice_id: invoiceId,
      client_id: clientId,
    },
  })
}

/**
 * Create a Stripe Checkout Session for invoice self-service payment.
 */
export async function createCheckoutSession({
  amountCents,
  invoiceNumber,
  invoiceId,
  clientEmail,
  successUrl,
  cancelUrl,
}: {
  amountCents: number
  invoiceNumber: string
  invoiceId: string
  clientEmail: string
  successUrl: string
  cancelUrl: string
}) {
  return getStripe().checkout.sessions.create({
    mode: 'payment',
    customer_email: clientEmail,
    line_items: [
      {
        price_data: {
          currency: 'nzd',
          unit_amount: amountCents,
          product_data: {
            name: `Invoice ${invoiceNumber}`,
            description: 'Te Wairama Digital — Web Design Services',
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      invoice_id: invoiceId,
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  })
}
