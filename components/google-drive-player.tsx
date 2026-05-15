'use client'

import { useState } from 'react'
import { AlertCircle } from 'lucide-react'

interface GoogleDrivePlayerProps {
  fileId?: string
  videoUrl?: string
  title?: string
}

export function GoogleDrivePlayer({ fileId, videoUrl, title = 'Video Player' }: GoogleDrivePlayerProps) {
  const [error, setError] = useState(false)

  // Extract Google Drive file ID from URL
  const extractFileId = (url: string): string | null => {
    if (!url) return null

    // Handle /file/d/ID/view format
    const match1 = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/)
    if (match1) return match1[1]

    // Handle /d/ID format
    const match2 = url.match(/\/d\/([a-zA-Z0-9-_]+)/)
    if (match2) return match2[1]

    // If it's already a file ID
    if (/^[a-zA-Z0-9-_]+$/.test(url) && url.length > 20) {
      return url
    }

    return null
  }

  const getFileId = (): string | null => {
    if (fileId) return fileId
    if (videoUrl) return extractFileId(videoUrl)
    return null
  }

  const id = getFileId()

  if (!id) {
    return (
      <div className="w-full bg-black rounded p-3 flex items-center justify-center min-h-[180px]">
        <div className="text-center text-muted-foreground">
          <AlertCircle className="w-5 h-5 mx-auto mb-1 opacity-50" />
          <p className="text-xs">No valid video URL provided</p>
        </div>
      </div>
    )
  }

  const iframeUrl = `https://drive.google.com/file/d/${id}/preview`

  return (
    <div className="w-full bg-black rounded overflow-hidden">
      {error ? (
        <div className="w-full bg-black rounded p-3 flex items-center justify-center min-h-[180px]">
          <div className="text-center text-muted-foreground">
            <AlertCircle className="w-5 h-5 mx-auto mb-1 opacity-50" />
            <p className="text-xs">Failed to load video</p>
            <p className="text-[10px] mt-1">Make sure the video link is shared publicly</p>
          </div>
        </div>
      ) : (
        <div className="relative w-full aspect-video">
          <iframe
            src={iframeUrl}
            width="100%"
            height="100%"
            className="w-full h-full"
            allow="autoplay; fullscreen"
            allowFullScreen
            onError={() => setError(true)}
            title={title}
          />
          {/* Overlay to block the Google Drive pop-out/external link icon (top-right) */}
          <div
            className="absolute top-0 right-0 w-20 h-20 md:w-16 md:h-16 z-10 cursor-default"
            style={{ background: 'linear-gradient(135deg, transparent 30%, rgba(0,0,0,0.95) 70%)' }}
            onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
            onTouchStart={(e) => { e.preventDefault(); e.stopPropagation() }}
            onContextMenu={(e) => e.preventDefault()}
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  )
}
