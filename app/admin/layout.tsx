'use client'

import React, { useEffect, useState, createContext, useContext } from 'react'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, ImageIcon, Film, Tv, Star,
  Sparkles, Music, Wallet, LogOut, Home, Crown, Menu, X,
  ChevronRight, CreditCard, BarChart3,
} from 'lucide-react'
import { auth } from '@/lib/firebase'
import { signOut } from 'firebase/auth'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', view: 'dashboard' },
  { icon: Users, label: 'Users', view: 'users' },
  { icon: ImageIcon, label: 'Carousel', view: 'carousel' },
  { icon: Film, label: 'Movies', view: 'movies' },
  { icon: Tv, label: 'Series', view: 'series' },
  { icon: Star, label: 'Originals', view: 'originals' },
  { icon: Sparkles, label: 'Animation', view: 'animation' },
  { icon: Music, label: 'Music', view: 'music' },
  { icon: Crown, label: 'Subs', view: 'subscriptions' },
  { icon: Wallet, label: 'Wallet', view: 'wallet' },
  { icon: CreditCard, label: 'Payments', view: 'payments' },
  { icon: BarChart3, label: 'Analytics', view: 'analytics' },
]

export const AdminViewContext = createContext<{
  activeView: string
  setActiveView: (v: string) => void
}>({ activeView: 'dashboard', setActiveView: () => {} })

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, isAdmin, loading } = useAuth()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [activeView, setActiveView] = useState('dashboard')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (!loading) {
      if (user && isAdmin) {
        setIsAuthorized(true)
      } else if (!user) {
        router.push('/')
      }
    }
  }, [user, isAdmin, loading, router])

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground text-xs">Loading...</div>
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-lg font-bold text-foreground mb-1">Access Denied</h1>
          <p className="text-xs text-muted-foreground mb-3">You do not have permission to access the admin panel.</p>
          <Link href="/" className="text-primary hover:underline text-xs">Return to Home</Link>
        </div>
      </div>
    )
  }

  const activeItem = navItems.find((item) => item.view === activeView)

  return (
    <AdminViewContext.Provider value={{ activeView, setActiveView }}>
      <div className="min-h-screen bg-background pb-16 md:pb-0">

        {/* Desktop top nav */}
        <nav className="hidden md:block bg-card border-b border-border sticky top-0 z-50">
          <div className="flex items-center justify-between px-1 overflow-x-auto">
            <div className="flex items-center">
              <Link
                href="/"
                className="flex flex-col items-center justify-center px-1.5 py-1 min-w-[40px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Home className="w-3 h-3 mb-px" />
                <span className="text-[8px]">Home</span>
              </Link>
              {navItems.map((item) => {
                const isActive = activeView === item.view
                return (
                  <button
                    key={item.view}
                    onClick={() => setActiveView(item.view)}
                    className={`flex flex-col items-center justify-center px-1.5 py-1 min-w-[40px] transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <item.icon className="w-3 h-3 mb-px" />
                    <span className="text-[8px]">{item.label}</span>
                  </button>
                )
              })}
            </div>
            <button
              onClick={handleLogout}
              className="flex flex-col items-center justify-center px-1.5 py-1 min-w-[40px] bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <LogOut className="w-3 h-3 mb-px" />
              <span className="text-[8px]">Logout</span>
            </button>
          </div>
        </nav>

        {/* Mobile top header */}
        <header className="md:hidden bg-card border-b border-border sticky top-0 z-50 flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
              <Home className="w-4 h-4" />
            </Link>
            <span className="text-xs font-semibold text-foreground">Admin</span>
            {activeItem && (
              <>
                <ChevronRight className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-primary font-medium">{activeItem.label}</span>
              </>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 px-2 py-1 bg-destructive/10 text-destructive text-[10px] font-medium rounded-md hover:bg-destructive/20 transition-colors"
          >
            <LogOut className="w-3 h-3" />
            <span>Logout</span>
          </button>
        </header>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
          <div className="grid grid-cols-5 gap-0">
            {navItems.slice(0, 4).map((item) => {
              const isActive = activeView === item.view
              return (
                <button
                  key={item.view}
                  onClick={() => { setActiveView(item.view); setMobileMenuOpen(false) }}
                  className={`flex flex-col items-center justify-center py-2 transition-colors ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  <item.icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-primary' : ''}`} />
                  <span className={`text-[9px] ${isActive ? 'font-semibold text-primary' : ''}`}>{item.label}</span>
                </button>
              )
            })}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`flex flex-col items-center justify-center py-2 transition-colors ${
                mobileMenuOpen || navItems.slice(4).some((item) => item.view === activeView)
                  ? 'text-primary'
                  : 'text-muted-foreground'
              }`}
            >
              {mobileMenuOpen ? <X className="w-5 h-5 mb-0.5" /> : <Menu className="w-5 h-5 mb-0.5" />}
              <span className="text-[9px]">More</span>
            </button>
          </div>
        </nav>

        {/* Mobile "More" overlay */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileMenuOpen(false)}>
            <div
              className="absolute bottom-16 left-0 right-0 bg-card border-t border-border rounded-t-2xl p-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-3" />
              <div className="grid grid-cols-4 gap-2">
                {navItems.slice(4).map((item) => {
                  const isActive = activeView === item.view
                  return (
                    <button
                      key={item.view}
                      onClick={() => { setActiveView(item.view); setMobileMenuOpen(false) }}
                      className={`flex flex-col items-center justify-center py-3 rounded-xl transition-colors ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      <item.icon className="w-5 h-5 mb-1" />
                      <span className="text-[10px] font-medium">{item.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="p-3">
          {children}
        </main>
      </div>
    </AdminViewContext.Provider>
  )
}