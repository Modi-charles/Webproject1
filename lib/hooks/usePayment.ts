import { useState, useCallback } from 'react'
import type { SubscriptionPlan } from '@/lib/constants/subscription-plans'

interface UsePaymentOptions {
  maxRetries?: number
}

interface PaymentResult {
  success: boolean
  redirectUrl?: string
  error?: string
}

interface PaymentPayload {
  amount: number
  currency: string
  email: string
  phone: string
  firstName: string
  lastName: string
  planName: string
  orderId: string
}

const DEFAULT_MAX_RETRIES = 3
const RETRY_DELAY = 1000 // ms

export function usePayment(options: UsePaymentOptions = {}) {
  const { maxRetries = DEFAULT_MAX_RETRIES } = options
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [retryCount, setRetryCount] = useState(0)

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  const initiatePayment = useCallback(
    async (payload: PaymentPayload): Promise<PaymentResult> => {
      setLoading(payload.orderId)
      setError('')
      setRetryCount(0)

      let lastError: Error | null = null

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const res = await fetch('/api/pesapal/order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(10000), // 10s timeout
          })

          if (!res.ok) {
            throw new Error(`Payment API error: ${res.status} ${res.statusText}`)
          }

          const data = await res.json()

          if (!data?.redirect_url) {
            throw new Error('Invalid payment response from server')
          }

          setLoading(null)
          return { success: true, redirectUrl: data.redirect_url }
        } catch (err) {
          lastError = err instanceof Error ? err : new Error('Unknown error occurred')

          // Retry on network errors, not on validation errors
          if (attempt < maxRetries && (err instanceof TypeError || err instanceof Error && err.message.includes('timeout'))) {
            await delay(RETRY_DELAY * (attempt + 1)) // Exponential backoff
            continue
          }

          break
        }
      }

      const errorMessage = lastError?.message || 'Failed to initiate payment. Please try again.'
      setError(errorMessage)
      setLoading(null)

      return { success: false, error: errorMessage }
    },
    [maxRetries]
  )

  return { initiatePayment, loading, error, retryCount }
}
