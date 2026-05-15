'use client'

import { X, Download } from 'lucide-react'
import { usePWAInstall } from '@/hooks/use-pwa-install'

interface InstallBannerProps {
  onDismiss: () => void
}

export function InstallBanner({ onDismiss }: InstallBannerProps) {
  const { canInstall, installApp } = usePWAInstall()

  if (!canInstall) return null

  return (
    <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mx-3 mt-2 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
        <Download className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground">Install VJ Oneflex</p>
        <p className="text-[10px] text-muted-foreground">Get the app for a better experience</p>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={installApp}
          className="px-3 py-1.5 bg-primary text-primary-foreground text-[11px] font-semibold rounded-lg hover:bg-primary/90 transition-colors"
        >
          Install
        </button>
        <button
          onClick={onDismiss}
          className="p-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
