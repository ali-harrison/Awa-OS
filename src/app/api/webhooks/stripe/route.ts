import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getStripe } from '@/lib/stripe/client'
import { createServiceClient } from '@/lib/supabase/server'

// Invoices are paid through Stripe Payment Links, which run as Checkout Sessions. The
// link's metadata is copied onto the session, so invoice_number is how we find the invoice.
const PAID_EVENTS = new Set<Stripe.Event['type']>([
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
])

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, sig, webhookSecret)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (PAID_EVENTS.has(event.type)) {
    const session = event.data.object as Stripe.Checkout.Session
    const invoiceNumber = session.metadata?.invoice_number

    if (invoiceNumber && session.payment_status === 'paid') {
      // Webhooks have no user session, so RLS would silently block a normal client
      const { error } = await createServiceClient()
        .from('invoices')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          stripe_payment_intent_id:
            typeof session.payment_intent === 'string' ? session.payment_intent : null,
        })
        .eq('invoice_number', invoiceNumber)
        .neq('status', 'paid')

      if (error) {
        console.error(`[stripe webhook] could not mark ${invoiceNumber} paid:`, error)
        // A non-2xx makes Stripe retry
        return NextResponse.json({ error: 'Update failed' }, { status: 500 })
      }
    }
  }

  return NextResponse.json({ received: true })
}
