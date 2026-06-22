'use client'

import { useState } from 'react'
import { Lock, Star, CreditCard, X, Eye, EyeOff, CheckCircle2, Zap, Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { useRouter } from 'next/navigation'

// ─────────────────────────────────────────
// Plans
// ─────────────────────────────────────────
export interface PaymentPlan {
  id: string
  name: string
  amount: number
  currency: string
  interval: string
  features: string[]
}

export const PLANS: PaymentPlan[] = [
   {
    id: 'plan_basic',
    name: 'Basic',
    amount: 3000,
    currency: 'UGX',
    interval: '24 hours',
    features: ['HD streaming', 'Ad-free', '1 device'],
  },
  {
    id: 'plan_basic',
    name: 'Basic',
    amount: 5000,
    currency: 'UGX',
    interval: '48 hours',
    features: ['HD streaming', 'Ad-free', '1 device'],
  },
  {
    id: 'plan_pro',
    name: 'Pro',
    amount: 10000,
    currency: 'UGX',
    interval: 'Weekly',
    features: ['4K streaming', 'Ad-free', '3 devices', 'Downloads'],
  },
   
  {
    id: 'plan_premium',
    name: 'Premium',
    amount: 30000,
    currency: 'UGX',
    interval: 'Monthly',
    features: ['4K + HDR', 'Ad-free','Downloads', 'Early access'],
  },
]

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────
type Step = 'wall' | 'login' | 'register' | 'plans'

interface SubscriptionWallProps {
  onClose?: () => void
  contentTitle?: string
  onSubscribe?: () => void
}

// ─────────────────────────────────────────
// Root component
// ─────────────────────────────────────────
export function SubscriptionWall({
  onClose,
  contentTitle = 'This Content',
  onSubscribe,
}: SubscriptionWallProps) {
  const { user, loading } = useAuth()
  const [step, setStep] = useState<Step>('wall')

  if (loading) return null

  const handleSubscribeClick = async () => {
    if (onSubscribe) {
      onSubscribe()
      return
    }
    if (!user) {
      setStep('login')
      return
    }
    const userDoc = await getDoc(doc(db, 'users', user.uid))
    const data = userDoc.data()
    if (data?.isActive) {
      onClose?.()
    } else {
      setStep('plans')
    }
  }

  return (
    <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center rounded z-40">
      {step === 'wall' && (
        <WallView
          contentTitle={contentTitle}
          onSubscribe={handleSubscribeClick}
          onClose={onClose}
        />
      )}
      {step === 'login' && (
        <LoginView
          onSuccess={() => setStep('plans')}
          onSwitchToRegister={() => setStep('register')}
          onClose={onClose}
        />
      )}
      {step === 'register' && (
        <RegisterView
          onSuccess={() => setStep('plans')}
          onSwitchToLogin={() => setStep('login')}
          onClose={onClose}
        />
      )}
      {step === 'plans' && (
        <PlansView
          onBack={() => setStep('wall')}
          onClose={onClose}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────
// Step 1 — Initial paywall
// ─────────────────────────────────────────
function WallView({
  contentTitle,
  onSubscribe,
  onClose,
}: {
  contentTitle: string
  onSubscribe: () => void
  onClose?: () => void
}) {
  return (
    <div className="text-center max-w-xs px-4">
      <div className="mb-3">
        <div className="w-12 h-12 rounded-full bg-red-600/20 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6 text-primary" />
        </div>
      </div>
      <h2 className="text-sm font-bold text-white mb-1">Premium Content</h2>
      <p className="text-[11px] text-white/70 mb-4">
        Subscribe to watch and download {contentTitle}
      </p>
      <div className="space-y-2">
        <button
  onClick={onSubscribe}
  className="flex items-center justify-center gap-1.5 w-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2.5 rounded-lg transition-colors"
>
  <CreditCard className="w-3.5 h-3.5" />
  Subscribe Now
</button>

        {onClose && (
          <button
            onClick={onClose}
            className="w-full bg-white/10 hover:bg-white/20 text-white text-xs font-medium py-2 rounded-lg transition-colors"
          >
            Close
          </button>
        )}
      </div>
      <div className="mt-4 pt-3 border-t border-white/10">
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
          {['Unlimited content', 'HD & 4K', 'Ad-free', 'Downloads'].map((benefit, idx) => (
            <div key={idx} className="flex items-center gap-1">
              <Star className="w-2.5 h-2.5 text-primary flex-shrink-0" />
              <span className="text-[10px] text-white/70">{benefit}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────
// Step 2a — Login
// ─────────────────────────────────────────
function LoginView({
  onSuccess,
  onSwitchToRegister,
  onClose,
}: {
  onSuccess: () => void
  onSwitchToRegister: () => void
  onClose?: () => void
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const ADMIN_EMAIL = 'vjoneflex02@gmail.com'

  const handleEmailLogin = async () => {
    if (!email || !password) { setError('Please fill in all fields'); return }
    setLoading(true)
    setError('')
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      if (result.user.email === ADMIN_EMAIL) {
        router.push('/admin')
      } else {
        onSuccess()
      }
    } catch (err: any) {
      const msg: Record<string, string> = {
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/invalid-email': 'Invalid email address.',
        'auth/invalid-credential': 'Invalid email or password.',
        'auth/too-many-requests': 'Too many attempts. Try again later.',
      }
      setError(msg[err.code] || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError('')
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      if (result.user.email === ADMIN_EMAIL) {
        router.push('/admin')
      } else {
        onSuccess()
      }
    } catch {
      setError('Google sign-in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl p-6 mx-4 shadow-2xl">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Sign in to continue</h2>
        {onClose && (
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 border border-zinc-200 dark:border-zinc-700 rounded-lg py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors mb-4 disabled:opacity-60"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </button>

      <div className="flex items-center gap-2 mb-4">
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
        <span className="text-[10px] text-zinc-400">or</span>
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">Password</label>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              onKeyDown={e => e.key === 'Enter' && handleEmailLogin()}
              className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 pr-9 text-xs bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            >
              {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
        {error && <p className="text-[11px] text-red-500">{error}</p>}
        <button
          onClick={handleEmailLogin}
          disabled={loading}
          className="w-full bg-primary hover:bg-primary/90 disabled:opacity-60 text-primary-foreground text-xs font-bold py-2.5 rounded-lg transition-colors"
        >
          {loading ? 'Signing in…' : 'Sign In & View Plans'}
        </button>
      </div>

      <p className="mt-4 text-center text-[11px] text-zinc-500">
        No account?{' '}
        <button onClick={onSwitchToRegister} className="text-primary font-medium hover:underline">
          Create one
        </button>
      </p>
    </div>
  )
}

// ─────────────────────────────────────────
// Step 2b — Register
// ─────────────────────────────────────────
function RegisterView({
  onSuccess,
  onSwitchToLogin,
  onClose,
}: {
  onSuccess: () => void
  onSwitchToLogin: () => void
  onClose?: () => void
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async () => {
    if (!name || !email || !password) { setError('Please fill in all fields'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    setError('')
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(result.user, { displayName: name })
      onSuccess()
    } catch (err: any) {
      const msg: Record<string, string> = {
        'auth/email-already-in-use': 'An account with this email already exists.',
        'auth/invalid-email': 'Invalid email address.',
        'auth/weak-password': 'Password is too weak.',
      }
      setError(msg[err.code] || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleRegister = async () => {
    setLoading(true)
    setError('')
    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
      onSuccess()
    } catch {
      setError('Google sign-in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl p-6 mx-4 shadow-2xl">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Create your account</h2>
        {onClose && (
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <button
        onClick={handleGoogleRegister}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 border border-zinc-200 dark:border-zinc-700 rounded-lg py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors mb-4 disabled:opacity-60"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </button>

      <div className="flex items-center gap-2 mb-4">
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
        <span className="text-[10px] text-zinc-400">or</span>
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
      </div>

      <div className="space-y-3">
        {[
          { label: 'Full Name', value: name, set: setName, type: 'text', placeholder: 'Jane Doe' },
          { label: 'Email', value: email, set: setEmail, type: 'email', placeholder: 'you@example.com' },
          { label: 'Password', value: password, set: setPassword, type: 'password', placeholder: '••••••••' },
        ].map(({ label, value, set, type, placeholder }) => (
          <div key={label}>
            <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">{label}</label>
            <input
              type={type}
              value={value}
              onChange={e => set(e.target.value)}
              placeholder={placeholder}
              className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        ))}
        {error && <p className="text-[11px] text-red-500">{error}</p>}
        <button
          onClick={handleRegister}
          disabled={loading}
          className="w-full bg-primary hover:bg-primary/90 disabled:opacity-60 text-primary-foreground text-xs font-bold py-2.5 rounded-lg transition-colors"
        >
          {loading ? 'Creating account…' : 'Create Account & View Plans'}
        </button>
      </div>

      <p className="mt-4 text-center text-[11px] text-zinc-500 bg-red">
        Already have an account?{' '}
        <button onClick={onSwitchToLogin} className="text-primary font-medium hover:underline">
          Sign in
        </button>
      </p>
    </div>
  )
}

// ─────────────────────────────────────────
// Step 3 — Plan selection + PesaPal
// ─────────────────────────────────────────
function PlansView({
  onBack,
  onClose,
}: {
  onBack: () => void
  onClose?: () => void
}) {
  const { user } = useAuth()
  const [paying, setPaying] = useState<string | null>(null)
  const [error, setError] = useState('')

  const handleSelectPlan = async (plan: PaymentPlan) => {
    if (!user) return
    setPaying(plan.id)
    setError('')

    try {
      const orderId = `${user.uid}_${Date.now()}`
      const nameParts = (user.displayName || user.email || 'Customer').split(' ')

      const res = await fetch('/api/pesapal/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: plan.amount,
          currency: plan.currency,
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
        // Redirect to PesaPal payment page
        window.location.href = data.redirect_url
      } else {
        setError('Failed to initiate payment. Please try again.')
        setPaying(null)
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setPaying(null)
    }
  }

  return (
    <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl p-6 mx-4 shadow-2xl">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Choose a plan</h2>
        {onClose && (
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <p className="text-[11px] text-zinc-500 mb-5">
        Logged in as{' '}
        <span className="font-medium text-zinc-700 dark:text-zinc-300">
          {user?.displayName || user?.email}
        </span>
      </p>

      {error && (
        <div className="mb-4 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-[11px] text-red-500">{error}</p>
        </div>
      )}

      <div className="space-y-3">
        {PLANS.map((plan: PaymentPlan) => (
          <div
            key={plan.id}
            className={`border rounded-xl p-4 transition-all ${
              plan.id === 'plan_pro'
                ? 'border-primary ring-1 ring-primary'
                : 'border-zinc-200 dark:border-zinc-700'
            }`}
          >
            {plan.id === 'plan_pro' && (
              <span className="inline-block bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full mb-2">
                Most Popular
              </span>
            )}
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-zinc-900 dark:text-white">{plan.name}</p>
                <div className="mt-1.5 space-y-1">
                  {plan.features.map((f: string) => (
                    <div key={f} className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-primary flex-shrink-0" />
                      <span className="text-[11px] text-zinc-600 dark:text-zinc-400">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-zinc-900 dark:text-white">
                  UGX {plan.amount.toLocaleString()}
                </p>
                <p className="text-[10px] text-zinc-500">/{plan.interval}</p>
                <button
                  onClick={() => handleSelectPlan(plan)}
                  disabled={paying !== null}
                  className={`mt-2 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                    plan.id === 'plan_pro'
                      ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                      : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white'
                  } disabled:opacity-60`}
                >
                  {paying === plan.id ? (
                    <><Loader2 className="w-3 h-3 animate-spin" /> Processing…</>
                  ) : 'Select'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onBack}
        className="mt-4 w-full text-[11px] text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
      >
        ← Back
      </button>
    </div>
  )
}
