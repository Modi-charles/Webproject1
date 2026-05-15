'use client'

import { GoogleDrivePlayer } from '@/components/google-drive-player'
import { SubscriptionWall } from '@/components/subscription-wall'
import { SubscriptionModal } from '@/components/subscription-modal'
import { Star, ArrowLeft, Download, Share2, CreditCard, Play } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { checkSubscriptionStatus } from '@/lib/subscription-utils'
import { downloadFile } from '@/lib/download'

interface Episode {
  episode_number: number
  title: string
  stream_url: string
  season: number
}

interface Series {
  id: string
  title: string
  year: number
  category?: string
  rating: number
  poster_url: string
  episodes?: Episode[]
  description?: string
}

export default function WatchSeriesPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const [seriesId, setSeriesId] = useState<string | null>(null)
  const { user, isAdmin } = useAuth()
  const [series, setSeries] = useState<Series | null>(null)
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasSubscription, setHasSubscription] = useState(false)
  const [checkingSubscription, setCheckingSubscription] = useState(true)
  const [isSubModalOpen, setIsSubModalOpen] = useState(false)

  useEffect(() => {
    const getParams = async () => {
      if (params instanceof Promise) {
        const resolved = await params
        setSeriesId(resolved.id)
      } else {
        setSeriesId(params.id)
      }
    }
    getParams()
  }, [params])

  useEffect(() => {
    if (!seriesId) return
    const fetchSeries = async () => {
      try {
        const docRef = doc(db, 'series', seriesId)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() } as Series
          setSeries(data)
          if (data.episodes && data.episodes.length > 0) {
            setSelectedEpisode(data.episodes[0])
          }
        }
      } catch {}
      setLoading(false)
    }
    fetchSeries()
  }, [seriesId])

  useEffect(() => {
    const checkSub = async () => {
      if (!user) { setHasSubscription(false); setCheckingSubscription(false); return }
      try {
        const { isActive } = await checkSubscriptionStatus(user.uid)
        setHasSubscription(isActive)
      } catch { setHasSubscription(false) }
      setCheckingSubscription(false)
    }
    checkSub()
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!series) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-foreground mb-4">Series not found</h1>
        <Link href="/" className="text-primary hover:underline">Back to home</Link>
      </div>
    )
  }

  const stars = Math.round(series.rating || 4)
  const needsSub = !isAdmin && !hasSubscription && !checkingSubscription
  const canAccess = hasSubscription || isAdmin

  const episodesBySeason = new Map<number, Episode[]>()
  series.episodes?.forEach((ep) => {
    const s = ep.season || 1
    if (!episodesBySeason.has(s)) episodesBySeason.set(s, [])
    episodesBySeason.get(s)!.push(ep)
  })
  const seasons = Array.from(episodesBySeason.keys()).sort((a, b) => a - b)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between px-3 py-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <Link href="/" className="text-foreground hover:text-primary transition-colors flex-shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-xs font-semibold text-foreground truncate">{series.title}</h1>
              {selectedEpisode && (
                <p className="text-[10px] text-muted-foreground truncate">
                  S{selectedEpisode.season} E{selectedEpisode.episode_number}: {selectedEpisode.title}
                </p>
              )}
            </div>
          </div>
          <button className="p-1 text-muted-foreground hover:text-foreground transition-colors">
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Player - full width */}
      <div className="w-full bg-black">
        <div className="mx-auto w-full max-w-5xl px-0 sm:px-2 lg:px-4 relative">
          {selectedEpisode && selectedEpisode.stream_url ? (
            <>
              <GoogleDrivePlayer
                key={`${selectedEpisode.season}-${selectedEpisode.episode_number}`}
                videoUrl={selectedEpisode.stream_url}
                title={`${series.title} - S${selectedEpisode.season} E${selectedEpisode.episode_number}`}
              />
              {needsSub && (
                <SubscriptionWall contentTitle={series.title} onSubscribe={() => setIsSubModalOpen(true)} />
              )}
            </>
          ) : (
            <div className="w-full bg-black aspect-video flex items-center justify-center">
              <p className="text-muted-foreground">Select an episode to play</p>
            </div>
          )}
        </div>
      </div>

      {/* Download + episode info - directly under player */}
      <div className="w-full mx-auto max-w-5xl px-3 sm:px-4 lg:px-6 pt-2 pb-1">
        <div className="flex items-center gap-2 flex-wrap">
          {selectedEpisode?.stream_url && canAccess ? (
            <button
              onClick={() => {
                const safeName = `${series.title} S${selectedEpisode.season}E${selectedEpisode.episode_number}`.replace(/[^a-zA-Z0-9 _-]/g, '').trim()
                downloadFile(selectedEpisode.stream_url, `${safeName}.mp4`)
              }}
              className="inline-flex items-center gap-1 bg-primary hover:bg-primary/90 text-primary-foreground px-2 py-1 rounded text-[11px] font-medium transition-colors"
            >
              <Download className="w-3 h-3" />
              Download Episode
            </button>
          ) : selectedEpisode?.stream_url && !canAccess ? (
            <button
              onClick={() => setIsSubModalOpen(true)}
              className="inline-flex items-center gap-1 bg-primary hover:bg-primary/90 text-primary-foreground px-2 py-1 rounded text-[11px] font-medium transition-colors"
            >
              <CreditCard className="w-3 h-3" />
              Subscribe to Download
            </button>
          ) : null}
          {selectedEpisode && (
            <span className="text-[10px] text-muted-foreground">
              Playing: S{selectedEpisode.season} E{selectedEpisode.episode_number} - {selectedEpisode.title}
            </span>
          )}
        </div>
      </div>

      {/* Episodes grid - directly under player, very compact */}
      {seasons.length > 0 && (
        <div className="w-full mx-auto max-w-5xl px-3 sm:px-4 lg:px-6 py-2">
          {seasons.map((season) => {
            const eps = episodesBySeason.get(season) || []
            return (
              <div key={season} className="mb-3">
                <h3 className="text-[11px] font-bold text-foreground mb-1.5">Season {season}</h3>
                <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-1">
                  {eps.sort((a, b) => a.episode_number - b.episode_number).map((episode) => {
                    const isSelected = selectedEpisode?.episode_number === episode.episode_number && selectedEpisode?.season === episode.season
                    return (
                      <button
                        key={`${episode.season}-${episode.episode_number}`}
                        onClick={() => {
                          setSelectedEpisode(episode)
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                        }}
                        className={`flex flex-col items-center justify-center rounded px-1 py-1.5 transition-all ${
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                        }`}
                        title={episode.title || `Episode ${episode.episode_number}`}
                      >
                        <Play className="w-2.5 h-2.5 mb-px" />
                        <span className="text-[9px] font-bold leading-none">E{episode.episode_number}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Series details below episodes */}
      <div className="w-full mx-auto px-3 sm:px-4 lg:px-6 py-2 max-w-5xl border-t border-border">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <div className="relative w-16 aspect-[2/3] rounded overflow-hidden">
              <Image src={series.poster_url || '/placeholder.svg?height=240&width=160'} alt={series.title} fill className="object-cover" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-foreground mb-0.5">{series.title}</h2>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <div className="flex gap-px">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-3 h-3 ${i < stars ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                ))}
              </div>
              <span className="text-muted-foreground text-[11px]">{series.year}</span>
              {series.category && <span className="px-1.5 py-px bg-primary/20 text-primary text-[10px] rounded">{series.category}</span>}
              <span className="text-muted-foreground text-[10px]">{series.episodes?.length || 0} eps</span>
            </div>
            {series.description && <p className="text-muted-foreground text-[11px] line-clamp-2">{series.description}</p>}
          </div>
        </div>
      </div>

      {(!series.episodes || series.episodes.length === 0) && (
        <div className="text-center py-8">
          <p className="text-muted-foreground text-sm">No episodes available yet.</p>
        </div>
      )}

      <SubscriptionModal isOpen={isSubModalOpen} onClose={() => setIsSubModalOpen(false)} />
    </div>
  )
}
