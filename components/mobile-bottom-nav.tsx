'use client'

import { Home, Film, Tv, User, Search, Download, Shield } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { usePWAInstall } from '@/hooks/use-pwa-install'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

interface MobileBottomNavProps {
  activeView: string
  onNavigate: (view: string) => void
  onLoginClick?: () => void
}

export function MobileBottomNav({ activeView, onNavigate, onLoginClick }: MobileBottomNavProps) {
  const { user, isAdmin } = useAuth()
  const { canInstall, installApp } = usePWAInstall()
  const router = useRouter()

  // Only render dynamic buttons (admin/install) after mount to prevent hydration mismatch
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const handleTap = (view: string) => {
    if (view === 'admin') {
      router.push('/admin')
      return
    }
    if (view === 'account') {
      if (!user) {
        onLoginClick?.()
        return
      }
      onNavigate('subscription')
      return
    }
    onNavigate(view)
  }

  const navBtnClass = (isActive: boolean) =>
    `flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-lg ${isActive ? 'text-primary' : 'text-muted-foreground'}`

  const iconBgClass = (isActive: boolean) =>
    `relative flex items-center justify-center w-8 h-8 rounded-full ${isActive ? 'bg-primary/15' : ''}`

  const iconClass = (isActive: boolean) =>
    `w-5 h-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`

  const labelClass = (isActive: boolean) =>
    `text-[10px] mt-0.5 font-medium leading-none ${isActive ? 'text-primary' : 'text-muted-foreground'}`

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card/95 backdrop-blur-lg border-t border-border safe-area-bottom">
        <div className="flex items-center justify-around px-1 py-1">

          <button onClick={() => handleTap('home')} className={navBtnClass(activeView === 'home')}>
            <div className={iconBgClass(activeView === 'home')}>
              <Home className={iconClass(activeView === 'home')} strokeWidth={activeView === 'home' ? 2.5 : 1.8} />
            </div>
            <span className={labelClass(activeView === 'home')}>Home</span>
          </button>

          <button onClick={() => handleTap('movies')} className={navBtnClass(activeView === 'movies')}>
            <div className={iconBgClass(activeView === 'movies')}>
              <Film className={iconClass(activeView === 'movies')} strokeWidth={activeView === 'movies' ? 2.5 : 1.8} />
            </div>
            <span className={labelClass(activeView === 'movies')}>Movies</span>
          </button>

          <button onClick={() => handleTap('search-mobile')} className={navBtnClass(activeView === 'search')}>
            <div className={iconBgClass(activeView === 'search')}>
              <Search className={iconClass(activeView === 'search')} strokeWidth={activeView === 'search' ? 2.5 : 1.8} />
            </div>
            <span className={labelClass(activeView === 'search')}>Search</span>
          </button>

          <button onClick={() => handleTap('series')} className={navBtnClass(activeView === 'series')}>
            <div className={iconBgClass(activeView === 'series')}>
              <Tv className={iconClass(activeView === 'series')} strokeWidth={activeView === 'series' ? 2.5 : 1.8} />
            </div>
            <span className={labelClass(activeView === 'series')}>Series</span>
          </button>

          {/* After mount: show Admin for admin users, Account for regular users */}
          {/* Before mount: show Account (matches server render) */}
          {mounted && isAdmin ? (
            <button onClick={() => handleTap('admin')} className={navBtnClass(false) + ' !text-primary'}>
              <div className={iconBgClass(false) + ' !bg-primary/15'}>
                <Shield className="w-5 h-5 text-primary" strokeWidth={2.5} />
              </div>
              <span className="text-[10px] mt-0.5 font-semibold leading-none text-primary">Admin</span>
            </button>
          ) : (
            <button onClick={() => handleTap('account')} className={navBtnClass(activeView === 'subscription')}>
              <div className={iconBgClass(activeView === 'subscription')}>
                <User className={iconClass(activeView === 'subscription')} strokeWidth={activeView === 'subscription' ? 2.5 : 1.8} />
              </div>
              <span className={labelClass(activeView === 'subscription')}>Account</span>
            </button>
          )}

          {/* Install button - only rendered after mount to avoid hydration mismatch */}
          {mounted && canInstall && (
            <button onClick={installApp} className={navBtnClass(false) + ' !text-primary cursor-pointer'}>
              <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-primary/15">
                <Download className="w-5 h-5 text-primary" strokeWidth={2} />
              </div>
              <span className="text-[10px] mt-0.5 font-semibold leading-none text-primary">Install</span>
            </button>
          )}

        </div>
      </nav>
    </>
  )
}
