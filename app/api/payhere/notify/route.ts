import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyNotifySignature } from '@/lib/payhere'

const PACKAGE_PRICES: Record<string, number> = { starter: 3000, premium: 5000, luxury: 8000 }

// PayHere calls this URL server-to-server (not from the customer's
// browser) once a payment finishes, regardless of whether the customer's
// browser makes it back to the return_url. This is the source of truth —
// never mark something paid based on the return_url alone.
export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const params: Record<string, string> = {}
  formData.forEach((value, key) => { params[key] = String(value) })

  const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET
  if (!merchantSecret) {
    console.error('PayHere notify: PAYHERE_MERCHANT_SECRET not configured')
    return NextResponse.json({ error: 'Not configured' }, { status: 500 })
  }

  const isValid = verifyNotifySignature(
    {
      merchant_id: params.merchant_id,
      order_id: params.order_id,
      payhere_amount: params.payhere_amount,
      payhere_currency: params.payhere_currency,
      status_code: params.status_code,
      md5sig: params.md5sig,
    },
    merchantSecret
  )

  if (!isValid) {
    console.error('PayHere notify: signature mismatch — possible spoofed request', params)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // order_id was encoded as "<coupleId>|<packageTier>|<timestamp>" when we created it.
  const [coupleId, packageTier] = (params.order_id || '').split('|')
  if (!coupleId) {
    console.error('PayHere notify: could not parse order_id', params.order_id)
    return NextResponse.json({ error: 'Bad order_id' }, { status: 400 })
  }

  // status_code: 2 = success, 0 = pending, -1 = cancelled, -2 = failed, -3 = chargedback
  if (params.status_code === '2') {
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const amount = PACKAGE_PRICES[packageTier] || parseFloat(params.payhere_amount) || 0
    const { error } = await supabaseAdmin
      .from('couples')
      .update({
        payment_status: 'paid',
        paid_amount: amount,
        package_tier: packageTier || null,
        payment_slip_status: 'verified',
        project_status: 'ongoing',
      })
      .eq('id', coupleId)

    if (error) console.error('PayHere notify: failed to update couple record', error)
  } else {
    console.log(`PayHere notify: order ${params.order_id} status_code=${params.status_code} (not a success) — no changes made`)
  }

  return NextResponse.json({ ok: true })
}
