'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, CheckCircle2, Loader2, CreditCard, AlertCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

interface SubscriptionPlan {
  id: string
  name: string
  price: number
  duration: string
  durationDays: number
  popular: boolean
  features: string[]
}

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'one-day',
    name: '1 Day',
    price: 3000,
    duration: '24 hours',
    durationDays: 1,
    popular: false,
    features: ['HD streaming', 'Ad-free', '1 device'],
  },
  {
    id: 'two-days',
    name: '2 Day',
    price: 5000,
    duration: '48 hours',
    durationDays: 2,
    popular: false,
    features: ['HD streaming', 'Ad-free', '1 device'],
  },
  {
    id: 'one-week',
    name: '1 Week',
    price: 10000,
    duration: '7 days',
    durationDays: 7,
    popular: true,
    features: ['4K streaming', 'Ad-free', 'Downloads'],
  },
  {
    id: 'one-month',
    name: '1 Month',
    price: 30000,
    duration: '30 days',
    durationDays: 30,
    popular: false,
    features: ['4K + HDR', 'Ad-free', 'Downloads', 'Early access'],
  },
]

interface UsePaymentOptions {
  maxRetries?: number
}

interface PaymentResult {
  success: boolean
  redirectUrl?: string
  checkoutUrl?: string
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

function usePayment(options: UsePaymentOptions = {}) {
  const { maxRetries = 3 } = options
  const [loading, setLoading] = useState<string | null>(null)

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  const initiatePayment = useCallback(
    async (payload: PaymentPayload): Promise<PaymentResult> => {
      setLoading(payload.orderId)

      let lastError: Error | null = null

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 10000)

          const res = await fetch('/api/pesapal/order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal,
          })

          clearTimeout(timeoutId)

          if (!res.ok) {
            throw new Error(`Payment API error: ${res.status} ${res.statusText}`)
          }

          const data = await res.json()

          if (!data?.redirect_url && !data?.checkout_url) {
            throw new Error('Invalid payment response from server')
          }

          setLoading(null)
          return { 
            success: true, 
            redirectUrl: data.redirect_url,
            checkoutUrl: data.checkout_url 
          }
        } catch (err) {
          lastError = err instanceof Error ? err : new Error('Unknown error occurred')

          if (attempt < maxRetries && (err instanceof TypeError || (err instanceof Error && err.message.includes('abort')))) {
            await delay(1000 * (attempt + 1))
            continue
          }

          break
        }
      }

      const errorMessage = lastError?.message || 'Failed to initiate payment. Please try again.'
      setLoading(null)

      return { success: false, error: errorMessage }
    },
    [maxRetries]
  )

  return { initiatePayment, loading }
}

interface SubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  preselectedPlanId?: string | null
  onPaymentSuccess?: (planId: string, orderId: string) => void
}

export function SubscriptionModal({
  isOpen,
  onClose,
  preselectedPlanId,
  onPaymentSuccess,
}: SubscriptionModalProps) {
  const { user } = useAuth()
  const [selectedPlan, setSelectedPlan] = useState<string | null>(preselectedPlanId || null)
  const [error, setError] = useState('')
  const [showPesaPal, setShowPesaPal] = useState(false)
  const [pesapalOrderId, setPesapalOrderId] = useState<string | null>(null)
  const { initiatePayment, loading } = usePayment({ maxRetries: 3 })

  // Load PesaPal script
  useEffect(() => {
    if (!showPesaPal) return

    const script = document.createElement('script')
    script.src = 'https://pesapal.com/api/pesapaljs.js'
    script.async = true
    script.onload = () => {
      if (pesapalOrderId && window.PesapalCheckout) {
        // Initialize PesaPal checkout if order ID is available
        window.PesapalCheckout.setUp({
          apiKey: process.env.NEXT_PUBLIC_PESAPAL_API_KEY,
          processRequestUrl: '/api/pesapal/process-payment',
          onResponse: handlePesaPalResponse,
          onError: (error: any) => {
            setError(`Payment error: ${error?.message || 'Unknown error'}`)
            setShowPesaPal(false)
          },
          onClose: () => {
            setShowPesaPal(false)
          },
        })
      }
    }
    document.head.appendChild(script)

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [showPesaPal, pesapalOrderId])

  // Reset modal state when opened
  useEffect(() => {
    if (isOpen && preselectedPlanId) {
      setSelectedPlan(preselectedPlanId)
      setError('')
    }
  }, [isOpen, preselectedPlanId])

  // Close modal on Escape key
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && loading === null && !showPesaPal) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, loading, onClose, showPesaPal])

  const handlePesaPalResponse = (response: any) => {
    if (response.success) {
      onPaymentSuccess?.(selectedPlan || '', pesapalOrderId || '')
      setShowPesaPal(false)
      onClose()
    } else {
      setError('Payment was not successful. Please try again.')
    }
  }

  const handleSelectPlan = useCallback(
    async (planId: string) => {
      if (!user) {
        setError('Please sign in first to subscribe.')
        return
      }

      const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId)
      if (!plan) {
        setError('Invalid plan selected.')
        return
      }

      setError('')
      const orderId = `${user.uid}_${Date.now()}`
      const nameParts = (user.displayName || user.email || 'Customer').split(' ')

      const result = await initiatePayment({
        amount: plan.price,
        currency: 'UGX',
        email: user.email || '',
        phone: user.phoneNumber || '',
        firstName: nameParts[0],
        lastName: nameParts.slice(1).join(' ') || 'User',
        planName: plan.name,
        orderId,
      })

      if (result.success && (result.redirectUrl || result.checkoutUrl)) {
        setPesapalOrderId(orderId)
        setSelectedPlan(planId)
        
        // If we have a checkout URL (inline), show modal
        if (result.checkoutUrl) {
          setShowPesaPal(true)
        } else if (result.redirectUrl) {
          // Fallback to redirect if only redirect URL is available
          window.location.href = result.redirectUrl
        }
      } else {
        setError(result.error || 'Failed to initiate payment. Please try again.')
      }
    },
    [user, initiatePayment, onPaymentSuccess]
  )

  if (!isOpen) return null

  const isPaymentProcessing = loading !== null

  return (
    <>
      {/* Subscription Plans Modal */}
      <div className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50 p-0 md:p-3">
        <div className="bg-card border border-border rounded-t-2xl md:rounded-xl max-w-sm w-full p-4 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-foreground">VJ Oneflex Movies Premium</h2>
            <button
              onClick={onClose}
              disabled={isPaymentProcessing}
              className="p-1 hover:bg-muted rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Close subscription modal"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Logged in as */}
          {user && (
            <p className="text-[11px] text-muted-foreground mb-4">
              Logged in as{' '}
              <span className="font-medium text-foreground">
                {user.displayName || user.email}
              </span>
            </p>
          )}

          {/* Error Alert */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-red-500">{error}</p>
            </div>
          )}

          {/* Loading Overlay */}
          {isPaymentProcessing && (
            <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex gap-2">
              <Loader2 className="w-4 h-4 text-blue-500 animate-spin flex-shrink-0" />
              <p className="text-[11px] text-blue-500">Processing your payment...</p>
            </div>
          )}

          {/* Plans */}
          <div className="space-y-3">
            {SUBSCRIPTION_PLANS.map(plan => (
              <div
                key={plan.id}
                className={`border rounded-xl p-4 transition-all ${
                  plan.popular
                    ? 'border-primary ring-1 ring-primary'
                    : 'border-border'
                } ${isPaymentProcessing || showPesaPal ? 'opacity-60 pointer-events-none' : ''}`}
              >
                {plan.popular && (
                  <span className="inline-block bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full mb-2">
                    Most Popular
                  </span>
                )}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-foreground">{plan.name}</p>
                    <p className="text-[10px] text-muted-foreground mb-1.5">{plan.duration}</p>
                    <div className="space-y-0.5">
                      {plan.features.map(feature => (
                        <div key={feature} className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-primary flex-shrink-0" />
                          <span className="text-[11px] text-muted-foreground">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-foreground">
                      UGX {plan.price.toLocaleString()}
                    </p>
                    <button
                      onClick={() => handleSelectPlan(plan.id)}
                      disabled={isPaymentProcessing || showPesaPal}
                      className={`mt-2 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-60 disabled:cursor-not-allowed ${
                        plan.popular
                          ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                          : 'bg-muted hover:bg-muted/80 text-foreground'
                      }`}
                      aria-busy={loading === plan.id}
                    >
                      {loading === plan.id ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" /> Processing…
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-3 h-3" /> Subscribe
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-4 text-center text-[10px] text-muted-foreground">
            Secure payment powered by PesaPal · MTN, Airtel, Visa, Mastercard
          </p>
        </div>
      </div>

      {/* PesaPal Checkout Modal */}
      {showPesaPal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
          <div className="bg-card border border-border rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-foreground">Complete Payment</h3>
              <button
                onClick={() => setShowPesaPal(false)}
                className="p-1 hover:bg-muted rounded-full transition-colors"
                aria-label="Close payment checkout"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* PesaPal Checkout Container */}
            <div id="pesapal-checkout" className="mb-4" />

            <p className="text-center text-[10px] text-muted-foreground">
              Powered by PesaPal
            </p>
          </div>
        </div>
      )}
    </>
  )
}

// Extend Window interface for PesaPal
declare global {
  interface Window {
    PesapalCheckout?: {
      setUp: (config: any) => void
    }
  }
}
