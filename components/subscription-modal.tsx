'use client'

import { useState, useEffect } from 'react'
import { X, CheckCircle2, Loader2, CreditCard } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

interface SubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  preselectedPlanId?: string | null
}

const PLANS = [
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
    id: 'one-day',
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
    features: ['4K + HDR', 'Ad-free','Downloads', 'Early access'],
  },
]

export function SubscriptionModal({ isOpen, onClose, preselectedPlanId }: SubscriptionModalProps) {
  const { user } = useAuth()
  const [selectedPlan, setSelectedPlan] = useState<string | null>(preselectedPlanId || null)
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen && preselectedPlanId) {
      setSelectedPlan(preselectedPlanId)
    }
  }, [isOpen, preselectedPlanId])

  const handleSelectPlan = async (planId: string) => {
    if (!user) {
      setError('Please sing in first to subscribe.')
      return
    }

    const plan = PLANS.find(p => p.id === planId)
    if (!plan) return

    try {
      const orderId = `${user.uid}_${Date.now()}`
      const nameParts = (user.displayName || user.email || 'Customer').split(' ')

      const res = await fetch('/api/pesapal/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: plan.price,
          currency: 'UGX',
          email: user.email,
          phone: '',
          firstName: nameParts[0],
          lastName: nameParts.slice(1).join(' ') || '',
          planName: plan.name,
          orderId,
        }),
      })

      const data = await res.json()

      if (data.redirect_url) {
        window.location.href = data.redirect_url
      } else {
        setError('Failed to initiate payment. Please try again.')
        setLoading(null)
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(null)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50 p-0 md:p-3">
      <div className="bg-card border border-border rounded-t-2xl md:rounded-xl max-w-sm w-full p-4 max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-foreground">VJ Oneflex Movies Premium</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Logged in as */}
        {user && (
          <p className="text-[11px] text-muted-foreground mb-4">
            Logged in as <span className="font-medium text-foreground">{user.displayName || user.email}</span>
          </p>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-[11px] text-red-500">{error}</p>
          </div>
        )}

        {/* Plans */}
        <div className="space-y-3">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`border rounded-xl p-4 transition-all ${
                plan.popular
                  ? 'border-primary ring-1 ring-primary'
                  : 'border-border'
              }`}
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
                    {plan.features.map(f => (
                      <div key={f} className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-primary flex-shrink-0" />
                        <span className="text-[11px] text-muted-foreground">{f}</span>
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
                    disabled={loading !== null}
                    className={`mt-2 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-60 ${
                      plan.popular
                        ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80 text-foreground'
                    }`}
                  >
                    {loading === plan.id ? (
                      <><Loader2 className="w-3 h-3 animate-spin" /> Processing…</>
                    ) : (
                      <><CreditCard className="w-3 h-3" /> Select</>
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
