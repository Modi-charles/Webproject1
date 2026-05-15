'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

// 1. Move the logic into a separate internal component
function PaymentCallbackContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const orderTrackingId = searchParams.get('OrderTrackingId')
    const merchantRef = searchParams.get('OrderMerchantReference')

    if (!orderTrackingId) {
      setStatus('failed')
      setMessage('Invalid payment reference.')
      return
    }

    fetch('/api/pesapal/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderTrackingId,
        orderMerchantReference: merchantRef,
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'received') {
          setStatus('success')
          setMessage('Your subscription is now active! Enjoy unlimited access.')
        } else {
          setStatus('failed')
          setMessage('Payment could not be verified. Please contact support.')
        }
      })
      .catch(() => {
        setStatus('failed')
        setMessage('Something went wrong. Please contact support.')
      })
  }, [searchParams])

  return (
    <div className="text-center max-w-sm">
      {status === 'loading' && (
        <>
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <h1 className="text-lg font-bold text-foreground mb-2">Verifying Payment…</h1>
          <p className="text-sm text-muted-foreground">Please wait while we confirm your payment.</p>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-lg font-bold text-foreground mb-2">Payment Successful!</h1>
          <p className="text-sm text-muted-foreground mb-6">{message}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-lg text-sm font-bold transition-colors"
          >
            Start Watching
          </button>
        </>
      )}

      {status === 'failed' && (
        <>
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-lg font-bold text-foreground mb-2">Payment Failed</h1>
          <p className="text-sm text-muted-foreground mb-6">{message}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-lg text-sm font-bold transition-colors"
          >
            Go Back Home
          </button>
        </>
      )}
    </div>
  )
}

// 2. Wrap the main page export inside a Suspense boundary
export default function PaymentCallbackPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Suspense fallback={
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading checkout details...</p>
        </div>
      }>
        <PaymentCallbackContent />
      </Suspense>
    </div>
  )
}
