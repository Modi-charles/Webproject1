'use client'

import type React from 'react'

import { Search, Download, Bell, LogOut } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { auth } from '@/lib/firebase'
import { signOut } from 'firebase/auth'
import Image from 'next/image'
import { usePWAInstall } from '@/hooks/use-pwa-install'

const navItems = [
  { label: 'Movies', view: 'movies' },
  { label: 'TV Shows', view: 'series' },
  { label: 'Anime', view: 'anime' },
]

interface HeaderProps {
  onNavigate?: (view: string) => void
  activeView?: string
  onSearch?: (query: string) => void
  onLoginClick?: () => void
}

export function Header({ onNavigate, activeView = 'home', onSearch, onLoginClick }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const { user, isAdmin } = useAuth()
  const { canInstall, installApp } = usePWAInstall()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      onSearch?.(searchQuery.trim())
    }
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      setShowUserMenu(false)
      onNavigate?.('home')
    } catch (error) {
      console.error('[v0] Logout error:', error)
    }
  }

  const getInitials = (name: string | null | undefined) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="flex items-center justify-between px-3 py-1.5">
        <div className="flex items-center gap-3">
          {/* Brand name - only visible on mobile (sidebar has it on desktop) */}
          <button
            onClick={() => onNavigate?.('home')}
            className="text-sm font-bold text-primary tracking-tight flex-shrink-0 md:hidden"
          >
            VJ Oneflex Movies
          </button>

          {/* Nav items - hidden on mobile, shown on md+ */}
          <nav className="hidden md:flex items-center gap-3">
            {navItems.map((item) => {
              const isActive = activeView === item.view
              return (
                <button
                  key={item.label}
                  onClick={() => onNavigate?.(item.view)}
                  className={`text-xs font-medium transition-colors ${
                    isActive
                      ? 'text-foreground border-b-2 border-primary pb-0.5'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {item.label}
                </button>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <form onSubmit={handleSearch} className="relative hidden sm:block">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-36 pl-7 pr-2 py-1 text-xs bg-muted rounded border border-border focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </form>
          <button className="p-1 hover:bg-muted rounded transition-colors">
            <Bell className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          {mounted && canInstall && (
            <button
              onClick={installApp}
              className="hidden sm:flex items-center gap-1 bg-primary text-primary-foreground px-2 py-1 rounded text-[11px] font-medium hover:bg-primary/90 transition-colors cursor-pointer"
            >
              <Download className="w-3 h-3" />
              Install App
            </button>
          )}

          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-[10px] font-medium hover:bg-primary/90 transition-colors overflow-hidden"
                title={user?.email || 'User'}
              >
                {user?.photoURL ? (
                  <Image
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    width={24}
                    height={24}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getInitials(user?.displayName)
                )}
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-1 w-40 bg-card border border-border rounded-lg shadow-lg py-0.5 z-50">
                  <div className="px-3 py-1.5 border-b border-border">
                    <p className="text-xs font-medium text-foreground truncate">
                      {user.displayName || 'User'}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      onNavigate?.('subscription')
                      setShowUserMenu(false)
                    }}
                    className="block w-full text-left px-3 py-1.5 text-xs text-foreground hover:bg-muted transition-colors"
                  >
                    Subscription
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => {
                        window.location.href = '/admin'
                        setShowUserMenu(false)
                      }}
                      className="block w-full text-left px-3 py-1.5 text-xs text-foreground hover:bg-muted transition-colors font-medium"
                    >
                      Admin Panel
                    </button>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-1.5 text-xs text-red-500 hover:bg-muted transition-colors flex items-center gap-1"
                  >
                    <LogOut className="w-3 h-3" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => onLoginClick?.()}
              className="flex items-center gap-1 bg-primary text-primary-foreground px-2 py-1 rounded text-[11px] font-medium hover:bg-primary/90 transition-colors"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
