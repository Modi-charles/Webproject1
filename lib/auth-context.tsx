'use client'

import type React from 'react'
import { createContext, useContext, useEffect, useState } from 'react'
import { auth, db } from './firebase'
import type { User } from 'firebase/auth'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'

interface AuthContextType {
  user: User | null
  loading: boolean
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const ADMIN_EMAILS = ['vjoneflex02@gmail.com']

// Save user to Firestore on auth state change
async function saveUserToFirestore(user: User) {
  try {
    const userDocRef = doc(db, 'users', user.uid)
    const docSnap = await getDoc(userDocRef)
    const isNewUser = !docSnap.exists()
    
    // For new users, set isActive to false (they need admin activation)
    // For existing users, preserve their isActive status
    const userData: any = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || null,
      photoURL: user.photoURL || null,
      provider: user.providerData?.[0]?.providerId || 'unknown',
      last_login: serverTimestamp(),
      updated_at: serverTimestamp(),
    }
    
    if (isNewUser) {
      userData.created_at = serverTimestamp()
      userData.isActive = false  // New users start inactive, admin needs to activate
      userData.activationPlan = 'none'
      userData.activationExpiry = null
    }
    
    await setDoc(userDocRef, userData, { merge: true })
  } catch (error: any) {
    console.error('Error saving user to Firestore:', error?.message)
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      setIsAdmin(currentUser ? ADMIN_EMAILS.includes(currentUser.email || '') : false)
      
      // Save user to Firestore whenever they log in
      if (currentUser) {
        await saveUserToFirestore(currentUser)
      }
      
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
