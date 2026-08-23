import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateHash } from '@/lib/payhere'

// Keep this in sync with PACKAGE_PRICES in the admin dashboard (AdminPage.tsx).
const PACKAGE_PRICES: Record<string, number> = { starter: 3000, premium: 5000, luxury: 8000 }
const PACKAGE_NAMES: Record<string, string> = { starter: 'InviteGlow Starter Package', premium: 'InviteGlow Premium Package', luxury: 'InviteGlow Luxury Package' }

export async function POST(req: NextRequest) {
  const { coupleId, packageTier } = await req.json()

  if (!coupleId || !PACKAGE_PRICES[packageTier]) {
    return NextResponse.json({ error: 'Please choose a valid package.' }, { status: 400 })
  }

  const merchantId = process.env.PAYHERE_MERCHANT_ID
  const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET
  if (!merchantId || !merchantSecret) {
    return NextResponse.json({ error: 'Payment gateway is not configured yet. Please contact support.' }, { status: 500 })
  }

  // Server-side admin client (service role) so we can read the couple's
  // contact details for PayHere's required checkout fields, regardless
  // of RLS on the couples table.
  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: couple, error } = await supabaseAdmin
    .from('couples')
    .select('id, bride, groom, customer_name, customer_email, customer_phone')
    .eq('id', coupleId)
    .single()

  if (error || !couple) {
    return NextResponse.json({ error: 'Could not find your invitation.' }, { status: 404 })
  }

  const amount = PACKAGE_PRICES[packageTier]
  const currency = 'LKR'
  // order_id encodes couple id + package tier so the notify webhook can
  // update the right record without needing a separate pending-payments
  // table — PayHere echoes order_id back verbatim on every callback.
  const orderId = `${coupleId}|${packageTier}|${Date.now()}`
  const hash = generateHash(merchantId, orderId, amount, currency, merchantSecret)

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${req.headers.get('host')}`
  const fullName = (couple.customer_name || `${couple.bride} ${couple.groom}` || 'Customer').trim()
  const [firstName, ...restName] = fullName.split(' ')

  return NextResponse.json({
    merchant_id: merchantId,
    return_url: `${siteUrl}/checkout/success`,
    cancel_url: `${siteUrl}/checkout/cancel`,
    notify_url: `${siteUrl}/api/payhere/notify`,
    order_id: orderId,
    items: PACKAGE_NAMES[packageTier],
    currency,
    amount: amount.toFixed(2),
    first_name: firstName || 'Customer',
    last_name: restName.join(' ') || '.',
    email: couple.customer_email || 'no-reply@inviteglow.com',
    phone: (couple.customer_phone || '0700000000').replace(/\D/g, '') || '0700000000',
    address: 'N/A',
    city: 'Colombo',
    country: 'Sri Lanka',
    hash,
  })
}
