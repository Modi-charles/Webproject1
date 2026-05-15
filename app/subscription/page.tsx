'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { SubscriptionModal } from '@/components/subscription-modal'
import { LeftSidebar } from '@/components/left-sidebar'
import { Header } from '@/components/header'
import { RightSidebar } from '@/components/right-sidebar'

const PLANS = [
  {
    id: 'one-day',
    name: '2 Days',
    price: 5000,
    duration: '48 Hours',
    features: ['Unlimited access', 'HD quality', 'Ad-free streaming', 'Download content'],
  },
  {
    id: 'two-days',
    name: 'one week',
    price: 10000,
    duration: '7 days',
    features: ['Unlimited access', 'Full HD quality', 'Ad-free streaming', 'Download & offline watch'],
    popular: true,
  },
  {
    id: 'one-week',
    name: 'one Month',
    price: 30000,
    duration: '30 days',
    features: ['Unlimited access', 'Full HD + 4K', 'Ad-free streaming', 'Download & offline watch', 'Early access to new content'],
  },
]

export default function SubscriptionPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)

  return (
    <div className="flex min-h-screen bg-background">
      <LeftSidebar />

      <div className="flex flex-1 flex-col lg:flex-row">
        <main className="flex-1">
          <Header />

          <div className="flex-1 overflow-y-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
              {/* Header */}
              <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-foreground mb-4">VJ Oneflex Movies Premium</h1>
                <p className="text-xl text-muted-foreground mb-8">
                  Unlock unlimited entertainment with our flexible subscription plans
                </p>
              </div>

              {/* Plans Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {PLANS.map((plan) => (
                  <div
                    key={plan.id}
                    className={`relative rounded-xl border-2 transition-all p-6 ${
                      plan.popular
                        ? 'border-primary bg-primary/5 ring-2 ring-primary ring-offset-2 ring-offset-background'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-bold">
                          MOST POPULAR
                        </span>
                      </div>
                    )}

                    <h3 className="text-2xl font-bold text-foreground mb-1">{plan.name}</h3>
                    <p className="text-muted-foreground text-sm mb-6">{plan.duration}</p>

                    <div className="mb-8">
                      <p className="text-4xl font-bold text-primary">UGX {plan.price.toLocaleString()}</p>
                    </div>

                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => {
                        setSelectedPlanId(plan.id)
                        setIsModalOpen(true)
                      }}
                      className={`w-full py-2 rounded-lg font-semibold transition-colors ${
                        plan.popular
                          ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                          : 'bg-muted text-foreground hover:bg-muted/80'
                      }`}
                    >
                      Subscribe Now
                    </button>
                  </div>
                ))}
              </div>

              {/* Benefits Section */}
              <div className="bg-card border border-border rounded-xl p-8 max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold text-foreground mb-6">Premium Benefits</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    'Unlimited movies & series',
                    'No ads',
                    'Download & offline watch',
                    'Multiple devices',
                    '4K quality',
                    'Early access to new content',
                  ].map((benefit, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-foreground">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>

        <div className="hidden lg:block">
          <RightSidebar />
        </div>
      </div>

      {/* Floating Subscription Modal */}
      <SubscriptionModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false)
          setSelectedPlanId(null)
        }}
        preselectedPlanId={selectedPlanId}
      />
    </div>
  )
}
