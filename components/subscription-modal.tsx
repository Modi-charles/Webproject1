'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, CheckCircle2, Loader2, CreditCard, AlertCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { SUBSCRIPTION_PLANS } from '@/lib/constants/subscription-plans'
import { usePayment } from '@/lib/hooks/usePayment'

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
  const { initiatePayment, loading } = usePayment({ maxRetries: 3 })

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
      if (e.key === 'Escape' && loading === null) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, loading, onClose])

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

      if (result.success && result.redirectUrl) {
        // Track analytics before redirect
        onPaymentSuccess?.(planId, orderId)
        window.location.href = result.redirectUrl
      } else {
        setError(result.error || 'Failed to initiate payment. Please try again.')
      }
    },
    [user, initiatePayment, onPaymentSuccess]
  )

  if (!isOpen) return null

  const isPaymentProcessing = loading !== null

  return (
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
              } ${isPaymentProcessing ? 'opacity-60 pointer-events-none' : ''}`}
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
                    disabled={isPaymentProcessing}
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
                        <CreditCard className="w-3 h-3" /> Select
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
  )
}
