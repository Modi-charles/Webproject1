"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Settings,
  Maximize,
  Minimize,
  Download,
  ExternalLink,
  Subtitles,
  PictureInPicture2,
  SkipBack,
  SkipForward,
} from "lucide-react"

interface VideoPlayerProps {
  src: string
  title: string
  downloadUrl?: string
  poster?: string
}

// Helper to convert Google Drive share link to embeddable/direct link
function getVideoSource(url: string): { type: "direct" | "iframe" | "gdrive"; src: string } {
  if (!url) return { type: "direct", src: "" }

  // Google Drive patterns
  const gdriveSharePattern = /drive\.google\.com\/file\/d\/([^/]+)/
  const gdriveMatch = url.match(gdriveSharePattern)

  if (gdriveMatch) {
    const fileId = gdriveMatch[1]
    // Use preview embed for Google Drive (more compatible)
    return {
      type: "gdrive",
      src: `https://drive.google.com/file/d/${fileId}/preview`,
    }
  }

  // Check for other embed-style URLs (YouTube, Vimeo, etc.)
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)?.[1]
    if (videoId) {
      return {
        type: "iframe",
        src: `https://www.youtube.com/embed/${videoId}`,
      }
    }
  }

  // Direct video URL (mp4, mkv, webm, etc.)
  return { type: "direct", src: url }
}

export function VideoPlayer({ src, title, downloadUrl, poster }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [quality, setQuality] = useState("auto")
  const [showCaptions, setShowCaptions] = useState(false)

  const videoSource = getVideoSource(src)

  // Hide controls after inactivity
  useEffect(() => {
    if (videoSource.type !== "direct") return

    let timeout: NodeJS.Timeout
    const hideControls = () => {
      if (isPlaying) {
        timeout = setTimeout(() => setShowControls(false), 3000)
      }
    }

    hideControls()
    return () => clearTimeout(timeout)
  }, [isPlaying, showControls, videoSource.type])

  const handleMouseMove = useCallback(() => {
    setShowControls(true)
  }, [])

  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600)
    const minutes = Math.floor((time % 3600) / 60)
    const seconds = Math.floor(time % 60)

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
    }
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progressRef.current && videoRef.current) {
      const rect = progressRef.current.getBoundingClientRect()
      const pos = (e.clientX - rect.left) / rect.width
      videoRef.current.currentTime = pos * duration
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseFloat(e.target.value)
    if (videoRef.current) {
      videoRef.current.volume = value
      setVolume(value)
      setIsMuted(value === 0)
    }
  }

  const toggleFullscreen = async () => {
    if (!containerRef.current) return

    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen()
      setIsFullscreen(true)
    } else {
      await document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const togglePiP = async () => {
    if (videoRef.current) {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
      } else {
        await videoRef.current.requestPictureInPicture()
      }
    }
  }

  const handleSpeedChange = (speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed
      setPlaybackSpeed(speed)
    }
    setShowSettings(false)
  }

  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds
    }
  }

  const handleDownload = () => {
    const url = downloadUrl || src
    if (url) {
      window.open(url, "_blank")
    }
  }

  const handleOpenExternal = () => {
    window.open(src, "_blank")
  }

  // For Google Drive and iframe embeds
  if (videoSource.type === "gdrive" || videoSource.type === "iframe") {
    return (
      <div ref={containerRef} className="relative w-full bg-black aspect-video">
        {/* Download button for embeds */}
        <div className="absolute top-4 left-4 z-20">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1.5 rounded text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>

        <iframe
          src={videoSource.src}
          className="w-full h-full"
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
          sandbox="allow-scripts allow-same-origin allow-presentation"
        />

        {/* Overlay to block Google Drive popout icon (top-right corner) */}
        <div
          className="absolute top-0 right-0 w-20 h-20 md:w-16 md:h-16 z-20 cursor-default"
          style={{ background: 'linear-gradient(135deg, transparent 30%, rgba(0,0,0,0.95) 70%)' }}
          onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
          onTouchStart={(e) => { e.preventDefault(); e.stopPropagation() }}
          onContextMenu={(e) => e.preventDefault()}
          aria-hidden="true"
        />

      </div>
    )
  }

  // Direct video player with custom controls
  return (
    <div
      ref={containerRef}
      className="relative w-full bg-black aspect-video group"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={videoSource.src}
        poster={poster}
        className="w-full h-full"
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        playsInline
      />

      {/* Controls overlay */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent flex items-center justify-between">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1.5 rounded text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Download
          </button>

          <button onClick={handleOpenExternal} className="text-white/70 hover:text-white transition-colors">
            <ExternalLink className="w-5 h-5" />
          </button>
        </div>

        {/* Center play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={togglePlay}
            className="w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-colors"
          >
            {isPlaying ? <Pause className="w-8 h-8 text-white" /> : <Play className="w-8 h-8 text-white ml-1" />}
          </button>
        </div>

        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          {/* Progress bar */}
          <div
            ref={progressRef}
            className="w-full h-1 bg-white/30 rounded-full cursor-pointer mb-3 group/progress"
            onClick={handleProgressClick}
          >
            <div
              className="h-full bg-primary rounded-full relative"
              style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity" />
            </div>
          </div>

          <div className="flex items-center justify-between">
            {/* Left controls */}
            <div className="flex items-center gap-3">
              <button onClick={togglePlay} className="text-white hover:text-white/80 transition-colors">
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </button>

              <button onClick={() => skip(-10)} className="text-white hover:text-white/80 transition-colors">
                <SkipBack className="w-5 h-5" />
              </button>

              <button onClick={() => skip(10)} className="text-white hover:text-white/80 transition-colors">
                <SkipForward className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2">
                <button onClick={toggleMute} className="text-white hover:text-white/80 transition-colors">
                  {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1 accent-primary"
                />
              </div>

              <span className="text-white text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCaptions(!showCaptions)}
                className={`transition-colors ${showCaptions ? "text-primary" : "text-white hover:text-white/80"}`}
              >
                <Subtitles className="w-5 h-5" />
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="text-white hover:text-white/80 transition-colors"
                >
                  <Settings className="w-5 h-5" />
                </button>

                {showSettings && (
                  <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-lg p-3 min-w-[150px]">
                    <div className="text-white text-xs font-medium mb-2">Playback Speed</div>
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                      <button
                        key={speed}
                        onClick={() => handleSpeedChange(speed)}
                        className={`block w-full text-left px-2 py-1 text-sm rounded ${
                          playbackSpeed === speed ? "bg-primary text-white" : "text-white/70 hover:bg-white/10"
                        }`}
                      >
                        {speed}x
                      </button>
                    ))}

                    <div className="text-white text-xs font-medium mt-3 mb-2">Quality</div>
                    {["auto", "1080p", "720p", "480p", "360p"].map((q) => (
                      <button
                        key={q}
                        onClick={() => {
                          setQuality(q)
                          setShowSettings(false)
                        }}
                        className={`block w-full text-left px-2 py-1 text-sm rounded ${
                          quality === q ? "bg-primary text-white" : "text-white/70 hover:bg-white/10"
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button onClick={togglePiP} className="text-white hover:text-white/80 transition-colors">
                <PictureInPicture2 className="w-5 h-5" />
              </button>

              <button onClick={toggleFullscreen} className="text-white hover:text-white/80 transition-colors">
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
