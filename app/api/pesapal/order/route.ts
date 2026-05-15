import { NextRequest, NextResponse } from 'next/server'

async function getPesapalToken() {
  const isProd = process.env.PESAPAL_ENV === 'production'
  const baseUrl = isProd
    ? 'https://pay.pesapal.com/v3'
    : 'https://cybqa.pesapal.com/pesapalv3'
    const consumer_key = process.env.PESAPAL_CONSUMER_KEY?.trim();
  const consumer_secret = process.env.PESAPAL_CONSUMER_SECRET?.trim();

  const res = await fetch(`${baseUrl}/api/Auth/RequestToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      consumer_key: process.env.PESAPAL_CONSUMER_KEY,
      consumer_secret: process.env.PESAPAL_CONSUMER_SECRET,
    }),
  })

  const data = await res.json()
  if (!data.token) throw new Error('Failed to get PesaPal token')
  return { token: data.token, baseUrl }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { amount, currency, email, phone, firstName, lastName, planName, orderId } = body

    const { token, baseUrl } = await getPesapalToken()

    // Register IPN
    const ipnRes = await fetch(`${baseUrl}/api/URLSetup/RegisterIPN`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        url: `${process.env.NEXT_PUBLIC_APP_URL}/api/pesapal/callback`,
        ipn_notification_type: 'POST',
      }),
    })
    const ipnData = await ipnRes.json()
    const ipn_id = ipnData.ipn_id

    // Submit order
    const orderRes = await fetch(`${baseUrl}/api/Transactions/SubmitOrderRequest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        id: orderId,
        currency: currency || 'UGX',
        amount: amount,
        description: `${planName} Subscription - VJ Oneflex Movies`,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/callback`,
        redirect_mode: '',
        notification_id: ipn_id,
        branch: 'VJ Oneflex Movies',
        billing_address: {
          email_address: email,
          phone_number: phone || '',
          country_code: 'UG',
          first_name: firstName || 'Customer',
          last_name: lastName || '',
          line_1: '',
          line_2: '',
          city: '',
          state: '',
          postal_code: '',
          zip_code: '',
        },
      }),
    })

    const orderData = await orderRes.json()
    console.log('PesaPal order response:', JSON.stringify(orderData))

    if (!orderData.redirect_url) {
      return NextResponse.json({ error: 'Failed to create order', details: orderData }, { status: 500 })
    }

    return NextResponse.json({
      redirect_url: orderData.redirect_url,
      order_tracking_id: orderData.order_tracking_id,
    })
  } catch (err) {
    console.error('PesaPal order error:', err)
    return NextResponse.json({ error: 'Order submission failed', details: String(err) }, { status: 500 })
  }
}