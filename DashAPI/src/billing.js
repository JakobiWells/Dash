import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const APP_URL = process.env.APP_URL || 'https://dashpad.dev'

// Lazy init — env vars are set by Railway at runtime, not at import time
function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY)
}
function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
}

// ── POST /api/billing/checkout ────────────────────────────────────────────────
export async function createCheckout(c) {
  const { userId, email, plan } = await c.req.json()
  if (!userId || !email || !plan) return c.json({ error: 'Missing fields' }, 400)

  const priceId = plan === 'yearly'
    ? process.env.STRIPE_YEARLY_PRICE_ID
    : process.env.STRIPE_MONTHLY_PRICE_ID

  if (!priceId) return c.json({ error: 'Price not configured' }, 500)

  const stripe = getStripe()
  const supabase = getSupabase()

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single()

  const sessionParams = {
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${APP_URL}?upgrade=success`,
    cancel_url: `${APP_URL}?upgrade=cancelled`,
    client_reference_id: userId,
    metadata: { userId },
    subscription_data: { metadata: { userId } },
  }

  if (profile?.stripe_customer_id) {
    sessionParams.customer = profile.stripe_customer_id
  } else {
    sessionParams.customer_email = email
  }

  const session = await stripe.checkout.sessions.create(sessionParams)
  return c.json({ url: session.url })
}

// ── POST /api/billing/portal ──────────────────────────────────────────────────
export async function createPortal(c) {
  const { userId } = await c.req.json()
  if (!userId) return c.json({ error: 'Missing userId' }, 400)

  const stripe = getStripe()
  const supabase = getSupabase()

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single()

  if (!profile?.stripe_customer_id) return c.json({ error: 'No subscription found' }, 404)

  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: APP_URL,
  })

  return c.json({ url: session.url })
}

// ── POST /api/billing/webhook ─────────────────────────────────────────────────
export async function handleWebhook(c) {
  const sig = c.req.header('stripe-signature')
  const rawBody = await c.req.text()

  const stripe = getStripe()
  const supabase = getSupabase()

  let event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    return c.json({ error: `Webhook signature failed: ${err.message}` }, 400)
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      const userId = session.client_reference_id || session.metadata?.userId
      const customerId = session.customer
      if (userId && customerId) {
        await supabase.from('profiles').upsert({
          id: userId,
          stripe_customer_id: customerId,
          subscription_id: session.subscription,
          subscription_status: 'active',
          is_pro: true,
        })
      }
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object
      const userId = sub.metadata?.userId
      const isActive = ['active', 'trialing'].includes(sub.status)
      if (userId) {
        await supabase.from('profiles')
          .update({ subscription_status: sub.status, is_pro: isActive })
          .eq('id', userId)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object
      const userId = sub.metadata?.userId
      if (userId) {
        await supabase.from('profiles')
          .update({ subscription_status: 'canceled', is_pro: false })
          .eq('id', userId)
      }
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object
      const customerId = invoice.customer
      if (customerId) {
        await supabase.from('profiles')
          .update({ subscription_status: 'past_due', is_pro: false })
          .eq('stripe_customer_id', customerId)
      }
      break
    }
  }

  return c.json({ received: true })
}
