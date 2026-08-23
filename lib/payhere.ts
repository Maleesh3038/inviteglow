import crypto from 'crypto'

// Live PayHere checkout endpoint. (PayHere's sandbox URL is
// sandbox.payhere.lk/pay/checkout — switch to that only while testing
// with a sandbox merchant ID, never with the live merchant ID above.)
export const PAYHERE_CHECKOUT_URL = 'https://www.payhere.lk/pay/checkout'

// Generates the checkout hash PayHere requires on the payment form.
// Formula from PayHere's docs: MD5( merchant_id + order_id + amount + currency + MD5(merchant_secret) )
// — every hash step is uppercased hex, matching PayHere's exact spec.
export function generateHash(merchantId: string, orderId: string, amount: number, currency: string, merchantSecret: string): string {
  const amountFormatted = amount.toFixed(2)
  const secretHash = crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase()
  return crypto
    .createHash('md5')
    .update(merchantId + orderId + amountFormatted + currency + secretHash)
    .digest('hex')
    .toUpperCase()
}

// Verifies the md5sig PayHere sends on the server-to-server notify
// (IPN) callback, so we only trust payment confirmations that actually
// came from PayHere and weren't spoofed by a third party hitting our
// notify_url directly.
export function verifyNotifySignature(
  params: { merchant_id: string; order_id: string; payhere_amount: string; payhere_currency: string; status_code: string; md5sig: string },
  merchantSecret: string
): boolean {
  const secretHash = crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase()
  const localSig = crypto
    .createHash('md5')
    .update(params.merchant_id + params.order_id + params.payhere_amount + params.payhere_currency + params.status_code + secretHash)
    .digest('hex')
    .toUpperCase()
  return localSig === params.md5sig
}
