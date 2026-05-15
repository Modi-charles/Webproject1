'use client'

import { Home, Film, Tv, Flag, Music, Star, CreditCard, Shield, Sun, Moon, LogOut, LogIn } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { auth } from '@/lib/firebase'
import { signOut } from 'firebase/auth'
import { useAuth } from '@/lib/auth-context'

const menuItems = [
  { icon: Home, label: 'Home', view: 'home' },
  { icon: Film, label: 'Movies', view: 'movies' },
  { icon: Tv, label: 'Series', view: 'series' },
  { icon: Flag, label: 'Nigerian', view: 'nigerian' },
  { icon: Music, label: 'Music', view: 'music' },
  { icon: Star, label: 'Top Rated', view: 'top-rated' },
  { icon: CreditCard, label: 'Subscription', view: 'subscription' },
]

interface LeftSidebarProps {
  onLoginClick?: () => void
  onNavigate?: (view: string) => void
  activeView?: string
}

export function LeftSidebar({ onLoginClick, onNavigate, activeView = 'home' }: LeftSidebarProps) {
  const { user, isAdmin } = useAuth()
  const [isDarkMode, setIsDarkMode] = useState(true)

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  const handleLogout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <aside className="w-32 bg-sidebar flex flex-col h-screen sticky top-0 border-r border-sidebar-border">
      <div className="px-2 py-2">
        <button onClick={() => onNavigate?.('home')} className="text-red-500 font-bold text-[10px] text-center w-full">
          VJ ONEFLEX MOVIES
        </button>
      </div>

      <nav className="flex-1 px-1">
        <ul className="space-y-0.5">
          {menuItems.map((item) => {
            const isActive = activeView === item.view
            return (
              <li key={item.label}>
                <button
                  onClick={() => onNavigate?.(item.view)}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded text-[11px] transition-colors w-full ${
                    isActive
                      ? 'bg-red-600 text-white'
                      : 'text-sidebar-foreground hover:bg-red-500/20 hover:text-red-400'
                  }`}
                >
                  <item.icon className={`w-3 h-3 flex-shrink-0 ${isActive ? 'text-white' : 'text-red-500'}`} />
                  {item.label}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="px-1 py-1 border-t border-sidebar-border space-y-0.5">
        {/* Theme toggle */}
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="flex items-center gap-2 px-2 py-1.5 rounded text-[11px] text-sidebar-foreground hover:bg-red-500/20 hover:text-red-400 w-full transition-colors"
        >
          {isDarkMode ? <Sun className="w-3 h-3 text-red-500" /> : <Moon className="w-3 h-3 text-red-500" />}
          {isDarkMode ? 'Light' : 'Dark'}
        </button>

        {/* Sign In / Log Out */}
        {user ? (
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-2 py-1.5 rounded text-[11px] text-sidebar-foreground hover:bg-red-500/20 hover:text-red-400 w-full transition-colors"
          >
            <LogOut className="w-3 h-3 text-red-500" />
            Log Out
          </button>
        ) : (
          <button
            onClick={onLoginClick}
            className="flex items-center gap-2 px-2 py-1.5 rounded text-[11px] bg-red-600 text-white hover:bg-red-700 w-full transition-colors"
          >
            <LogIn className="w-3 h-3" />
            Sign In
          </button>
        )}

        {/* Admin Access — only visible to admin */}
        {isAdmin && (
          <Link
            href="/admin"
            className="flex items-center gap-2 px-2 py-1.5 rounded text-[11px] bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white w-full transition-colors"
          >
            <Shield className="w-3 h-3" />
            Admin Panel
          </Link>
        )}
      </div>
    </aside>
  )
}