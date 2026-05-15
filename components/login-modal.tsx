'use client'

import type React from 'react'
import { useState } from 'react'
import { signInWithPopup, signInWithEmailAndPassword, type User } from 'firebase/auth'
import { auth, googleProvider } from '@/lib/firebase'
import { addUser } from '@/lib/firebase-utils'
import { useRouter } from 'next/navigation'
import { Mail, Lock, AlertCircle, Loader2, X } from 'lucide-react'

async function saveUserOnLogin(user: User) {
  console.log('[v0] saveUserOnLogin: Starting for:', user.email, user.uid)
  try {
    const userData = {
      email: user.email || '',
      displayName: user.displayName || null,
      photoURL: user.photoURL || null,
      provider: user.providerData?.[0]?.providerId || 'unknown',
    }
    console.log('[v0] saveUserOnLogin: User data prepared:', userData)
    await addUser(user.uid, userData)
    console.log('[v0] saveUserOnLogin: Completed successfully')
  } catch (error: any) {
    console.error('[v0] saveUserOnLogin: Error caught:', error?.message || error)
  }
}

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  const handleGoogleLogin = async () => {
    setError('')
    setIsGoogleLoading(true)

    try {
      const result = await signInWithPopup(auth, googleProvider)
      await saveUserOnLogin(result.user)
      onClose()
      router.refresh()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Google login failed'
      setError(errorMessage)
      setIsGoogleLoading(false)
    }
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      await saveUserOnLogin(result.user)
      onClose()
      router.refresh()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed'
      setError(errorMessage)
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3">
      <div className="bg-card border border-border rounded-lg shadow-2xl p-4 sm:p-5 w-full max-w-sm relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1 hover:bg-muted rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-4">
          <h1 className="text-lg font-bold text-foreground mb-1">VJ Oneflex Movies</h1>
          <p className="text-xs text-muted-foreground">Sign in to your account</p>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={isGoogleLoading || isLoading}
          className="w-full bg-white hover:bg-gray-50 disabled:opacity-50 text-gray-900 font-semibold py-2 px-3 rounded transition-colors flex items-center justify-center gap-2 border border-gray-300 mb-3 text-xs"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {isGoogleLoading ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              Signing in...
            </>
          ) : (
            'Sign in with Google'
          )}
        </button>

        <div className="relative mb-3">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-[10px]">
            <span className="px-2 bg-card text-muted-foreground">Or with email</span>
          </div>
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-2.5">
          <div>
            <label htmlFor="email" className="block text-[11px] font-medium text-foreground mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-background border border-border rounded text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-[11px] font-medium text-foreground mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-background border border-border rounded text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
          </div>

          {error && (
            <div className="flex gap-1.5 p-2 bg-destructive/10 border border-destructive/20 rounded text-destructive text-[11px]">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-px" />
              <p>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || isGoogleLoading}
            className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground text-xs font-semibold py-1.5 px-3 rounded transition-colors flex items-center justify-center gap-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
