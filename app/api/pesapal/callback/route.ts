// app/api/pesapal/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { doc, updateDoc, collection, addDoc, serverTimestamp, getDoc } from 'firebase/firestore'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { orderTrackingId, orderMerchantReference } = body

    if (!orderTrackingId) {
      return NextResponse.json({ error: 'Missing tracking ID' }, { status: 400 })
    }

    const isProd = process.env.PESAPAL_ENV === 'production'
    const baseUrl = isProd
      ? 'https://pay.pesapal.com/v3'
      : 'https://cybqa.pesapal.com/pesapalv3'

    // Get token
    const authRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/pesapal/auth`, {
      method: 'POST',
    })
    const { token } = await authRes.json()

    // Check transaction status
    const statusRes = await fetch(
      `${baseUrl}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      }
    )
    const statusData = await statusRes.json()

    if (statusData.payment_status_description === 'Completed') {
      // Extract uid from merchant reference (format: uid_timestamp)
      const uid = orderMerchantReference?.split('_')[0]

      if (uid) {
        // Activate user in Firestore
        await updateDoc(doc(db, 'users', uid), {
          isActive: true,
          activationPlan: statusData.description || 'subscription',
        })

        // Save payment record
        await addDoc(collection(db, 'payments'), {
          uid,
          tx_ref: orderTrackingId,
          merchant_ref: orderMerchantReference,
          amount: statusData.amount,
          currency: statusData.currency,
          status: 'successful',
          provider: 'pesapal',
          created_at: serverTimestamp(),
        })
      }
    }

    return NextResponse.json({ status: 'received' })
  } catch (err) {
    console.error('PesaPal callback error:', err)
    return NextResponse.json({ error: 'Callback failed' }, { status: 500 })
  }
}

// Handle GET callback redirect from PesaPal
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const orderTrackingId = searchParams.get('OrderTrackingId')
  const merchantRef = searchParams.get('OrderMerchantReference')

  // Redirect to payment callback page
  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_APP_URL}/payment/callback?OrderTrackingId=${orderTrackingId}&OrderMerchantReference=${merchantRef}`
  )
}