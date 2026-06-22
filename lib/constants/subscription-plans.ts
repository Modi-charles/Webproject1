export interface SubscriptionPlan {
  id: string
  name: string
  price: number
  duration: string
  durationDays: number
  popular: boolean
  features: string[]
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
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
