import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'

export interface SubscriptionData {
  uid: string
  email: string
  planId: string
  planName: string
  amount: number
  phoneNumber: string
  currency: string
  status: 'active' | 'expired' | 'pending'
  startDate: any
  expiryDate: any
  isActive: boolean
  updated_at: any
}

export interface UserActivation {
  isActive: boolean
  activationExpiry: any
  activationPlan: string | null
}

// Helper to parse Firestore timestamp or Date
function parseTimestamp(ts: any): Date | null {
  if (!ts) return null
  try {
    // Firestore Timestamp with toDate()
    if (ts.toDate && typeof ts.toDate === 'function') {
      return ts.toDate()
    }
    // Firestore Timestamp with seconds
    if (ts.seconds) {
      return new Date(ts.seconds * 1000)
    }
    // Already a Date
    if (ts instanceof Date) {
      return ts
    }
    // ISO string or other
    const date = new Date(ts)
    if (!isNaN(date.getTime())) {
      return date
    }
    return null
  } catch {
    return null
  }
}

// Check if user has been activated by admin (from users collection)
export async function checkUserActivation(uid: string): Promise<{
  isActive: boolean
  daysRemaining: number
  plan: string | null
}> {
  try {
    const userRef = doc(db, 'users', uid)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) {
      return { isActive: false, daysRemaining: 0, plan: null }
    }

    const userData = userSnap.data()
    
    // If user is not active or plan is 'none', return false
    if (!userData.isActive || userData.activationPlan === 'none') {
      return { isActive: false, daysRemaining: 0, plan: userData.activationPlan || null }
    }

    // Check if activation has expired
    if (userData.activationExpiry) {
      const expiryDate = parseTimestamp(userData.activationExpiry)
      const now = new Date()

      if (!expiryDate || now > expiryDate) {
        return { isActive: false, daysRemaining: 0, plan: userData.activationPlan || null }
      }

      // Calculate days remaining
      const daysRemaining = Math.ceil(
        (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )

      return { 
        isActive: true, 
        daysRemaining: Math.max(0, daysRemaining),
        plan: userData.activationPlan || null
      }
    }

    // User is active with no expiry (unlimited)
    return { isActive: userData.isActive, daysRemaining: 999, plan: userData.activationPlan || null }
  } catch (error) {
    console.error('Error checking user activation:', error)
    return { isActive: false, daysRemaining: 0, plan: null }
  }
}

export async function checkSubscriptionStatus(uid: string): Promise<{
  isActive: boolean
  subscription: SubscriptionData | null
  daysRemaining: number
}> {
  try {
    // First check user activation (admin-activated users)
    const userActivation = await checkUserActivation(uid)
    if (userActivation.isActive) {
      return {
        isActive: true,
        subscription: null,
        daysRemaining: userActivation.daysRemaining,
      }
    }

    // Then check subscription
    const subscriptionRef = doc(db, 'subscriptions', uid)
    const subscriptionSnap = await getDoc(subscriptionRef)

    if (!subscriptionSnap.exists()) {
      return {
        isActive: false,
        subscription: null,
        daysRemaining: 0,
      }
    }

    const subscription = subscriptionSnap.data() as SubscriptionData

    // Check if subscription has expired
    const expiryDate = subscription.expiryDate?.toDate?.() || new Date(subscription.expiryDate)
    const now = new Date()

    if (now > expiryDate) {
      // Mark as expired
      return {
        isActive: false,
        subscription: subscription,
        daysRemaining: 0,
      }
    }

    // Calculate days remaining
    const daysRemaining = Math.ceil(
      (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )

    return {
      isActive: subscription.isActive && subscription.status === 'active',
      subscription: subscription,
      daysRemaining: Math.max(0, daysRemaining),
    }
  } catch (error) {
    console.error('Error checking subscription:', error)
    return {
      isActive: false,
      subscription: null,
      daysRemaining: 0,
    }
  }
}

export async function getUserSubscription(uid: string): Promise<SubscriptionData | null> {
  try {
    const subscriptionRef = doc(db, 'subscriptions', uid)
    const subscriptionSnap = await getDoc(subscriptionRef)

    if (subscriptionSnap.exists()) {
      return subscriptionSnap.data() as SubscriptionData
    }
    return null
  } catch (error) {
    console.error('[v0] Error fetching subscription:', error)
    return null
  }
}

export function formatRemainingTime(daysRemaining: number): string {
  if (daysRemaining === 0) return 'Expired'
  if (daysRemaining === 1) return '1 day remaining'
  if (daysRemaining < 7) return `${daysRemaining} days remaining`
  const weeks = Math.floor(daysRemaining / 7)
  const days = daysRemaining % 7
  if (days === 0) return `${weeks} week${weeks > 1 ? 's' : ''} remaining`
  return `${weeks}w ${days}d remaining`
}
