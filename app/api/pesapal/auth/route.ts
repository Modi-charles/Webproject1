import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const isProd = process.env.PESAPAL_ENV === 'production'
    const baseUrl = isProd
      ? 'https://pay.pesapal.com/v3'
      : 'https://cybqa.pesapal.com/pesapalv3'

    // Step 1 — Request token from Pesapal
    const res = await fetch(`${baseUrl}/api/Auth/RequestToken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        consumer_key: process.env.PESAPAL_CONSUMER_KEY?.trim(),
        consumer_secret: process.env.PESAPAL_CONSUMER_SECRET?.trim(),
      }),
    })

    const data = await res.json()

    if (!res.ok || !data.token) {
      console.error('Pesapal auth failed:', data)
      return NextResponse.json({ error: 'Failed to authenticate with Pesapal', details: data }, { status: 500 })
    }

    // Step 2 — Return token
    return NextResponse.json({ token: data.token })
  } catch (err: any) {
    console.error('Pesapal auth error:', err)
    return NextResponse.json({ error: 'Auth request failed', details: err.message }, { status: 500 })
  }
}
