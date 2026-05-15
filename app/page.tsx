'use client'

import { useState, useEffect, useCallback } from 'react'
import { Header } from '@/components/header'
import { LeftSidebar } from '@/components/left-sidebar'
import { MobileBottomNav } from '@/components/mobile-bottom-nav'
import { HeroCarousel } from '@/components/hero-carousel'
import { MovieGrid } from '@/components/movie-grid'
import { LoginModal } from '@/components/login-modal'
import { GoogleDrivePlayer } from '@/components/google-drive-player'
import { SubscriptionWall } from '@/components/subscription-wall'
import { SubscriptionModal } from '@/components/subscription-modal'
import { InstallBanner } from '@/components/pwa-install-prompt'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot, doc, getDoc, where, getDocs } from 'firebase/firestore'
import { useAuth } from '@/lib/auth-context'
import { checkSubscriptionStatus, formatRemainingTime } from '@/lib/subscription-utils'
import { downloadFile } from '@/lib/download'
import { Star, ArrowLeft, Download, Share2, Check, Search, CreditCard, LogOut, Crown, Clock, Play } from 'lucide-react'
import { auth } from '@/lib/firebase'
import { signOut } from 'firebase/auth'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ShieldCheck } from 'lucide-react'

interface Movie {
  id: string
  title: string
  year: number
  category?: string
  genre?: string
  rating: number
  poster_url: string
  stream_url?: string
  description?: string
  is_trending?: boolean
  content_type?: 'movie' | 'series'
  created_at?: any
  _source?: string
}

type ViewType = 'home' | 'movies' | 'series' | 'nigerian' | 'music' | 'top-rated' | 'anime' | 'subscription' | 'watch' | 'watch-series' | 'search' | 'search-mobile'

const SUBSCRIPTION_PLANS = [
  {
    id: 'one-day',
    name: '2 Day',
    price: 5000,
    duration: '48 hours',
    features: ['Unlimited access', 'HD quality', 'Ad-free streaming', 'Download content'],
  },
  {
    id: 'two-days',
    name: '1 week',
    price: 10000,
    duration: '7 Days',
    features: ['Unlimited access', 'Full HD quality', 'Ad-free streaming', 'Download & offline watch'],
    popular: true,
  },
  {
    id: 'one-week',
    name: '1 Month',
    price: 30000,
    duration: '30 days',
    features: ['Unlimited access', 'Full HD + 4K', 'Ad-free streaming', 'Download & offline watch', 'Early access to new content'],
  },
]

export default function HomePage() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [currentView, setCurrentView] = useState<ViewType>('home')
  const [showInstallBanner, setShowInstallBanner] = useState(true)
  const [previousView, setPreviousView] = useState<ViewType>('home')
  const [selectedMovieId, setSelectedMovieId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileSearchQuery, setMobileSearchQuery] = useState('')

  // Watch view state
  const [watchMovie, setWatchMovie] = useState<Movie | null>(null)
  const [relatedMovies, setRelatedMovies] = useState<Movie[]>([])
  const [watchLoading, setWatchLoading] = useState(false)
  const [hasSubscription, setHasSubscription] = useState(false)
  const [checkingSubscription, setCheckingSubscription] = useState(true)
  const [subDaysRemaining, setSubDaysRemaining] = useState(0)
  const [subPlanName, setSubPlanName] = useState('')

  // Subscription modal state
  const [isSubModalOpen, setIsSubModalOpen] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)

  // Series watch state
  const [seriesData, setSeriesData] = useState<any>(null)
  const [selectedEpisode, setSelectedEpisode] = useState<any>(null)
  const [seriesLoading, setSeriesLoading] = useState(false)

  const { user, isAdmin } = useAuth()
  const router = useRouter()

useEffect(() => {
  if (user?.email === 'vjoneflex02@gmail.com') {
    router.replace('/admin')
  }
}, [user, router])

  // Fetch ALL content from Firebase (movies, series, originals, animations, music_videos) and merge
  useEffect(() => {
    const collections = [
      { name: 'movies', contentType: 'movie' },
      { name: 'series', contentType: 'series' },
      { name: 'originals', contentType: 'movie' },
      { name: 'animations', contentType: 'movie' },
      { name: 'music_videos', contentType: 'movie' },
    ]

    const dataMap: Record<string, Movie[]> = {}
    const loadedMap: Record<string, boolean> = {}
    collections.forEach((c) => { dataMap[c.name] = []; loadedMap[c.name] = false })

    const mergeAll = () => {
      if (!collections.every((c) => loadedMap[c.name])) return
      const all = Object.values(dataMap).flat().sort((a, b) => {
        const aTime = a.created_at?.toMillis?.() || a.created_at?.seconds * 1000 || 0
        const bTime = b.created_at?.toMillis?.() || b.created_at?.seconds * 1000 || 0
        return bTime - aTime
      })
      setMovies(all)
      setLoading(false)
    }

    const unsubscribers = collections.map((col) => {
      const q = query(collection(db, col.name), orderBy('created_at', 'desc'))
      return onSnapshot(
        q,
        (snap) => {
          dataMap[col.name] = snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
            content_type: col.contentType as 'movie' | 'series',
            _source: col.name,
          })) as Movie[]
          loadedMap[col.name] = true
          mergeAll()
        },
        () => { loadedMap[col.name] = true; mergeAll() }
      )
    })

    return () => unsubscribers.forEach((unsub) => unsub())
  }, [])

  // Check subscription status
  useEffect(() => {
    const checkSub = async () => {
      if (!user) {
        setHasSubscription(false)
        setCheckingSubscription(false)
        return
      }
      try {
        const { isActive, daysRemaining, subscription } = await checkSubscriptionStatus(user.uid)
        setHasSubscription(isActive)
        setSubDaysRemaining(daysRemaining)
        setSubPlanName(subscription?.planName || '')
      } catch {
        setHasSubscription(false)
      } finally {
        setCheckingSubscription(false)
      }
    }
    checkSub()
  }, [user])

  // Fetch movie details for watch view - search across all collections
  useEffect(() => {
    if (currentView !== 'watch' || !selectedMovieId) return

    const fetchMovie = async () => {
      setWatchLoading(true)
      try {
        // First, check if we already have the item in our local state with _source info
        const localItem = movies.find((m) => m.id === selectedMovieId)
        const sourceCollection = localItem?._source || 'movies'

        // Try the source collection first, then fall back to others
        const collectionsToSearch = [sourceCollection, 'movies', 'originals', 'animations', 'music_videos'].filter(
          (v, i, a) => a.indexOf(v) === i // deduplicate
        )

        let movieData: Movie | null = null

        for (const colName of collectionsToSearch) {
          const docRef = doc(db, colName, selectedMovieId)
          const docSnap = await getDoc(docRef)
          if (docSnap.exists()) {
            movieData = { id: docSnap.id, ...docSnap.data(), _source: colName } as Movie
            // Normalize fields from music_videos (thumbnail_url -> poster_url)
            if (colName === 'music_videos' && !movieData.poster_url && (docSnap.data() as any).thumbnail_url) {
              movieData.poster_url = (docSnap.data() as any).thumbnail_url
            }
            break
          }
        }

        if (movieData) {
          setWatchMovie(movieData)

          // Find related content from the same category across our local movies array
          const category = movieData.category
          if (category) {
            const related = movies
              .filter((m) => m.category === category && m.id !== selectedMovieId)
              .slice(0, 6)
            setRelatedMovies(related)
          } else {
            setRelatedMovies([])
          }
        } else {
          setWatchMovie(null)
        }
      } catch {
        setWatchMovie(null)
      } finally {
        setWatchLoading(false)
      }
    }

    fetchMovie()
  }, [currentView, selectedMovieId, movies])

  // Fetch series details for watch-series view
  useEffect(() => {
    if (currentView !== 'watch-series' || !selectedMovieId) return
    const fetchSeriesData = async () => {
      setSeriesLoading(true)
      try {
        const docRef = doc(db, 'series', selectedMovieId)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() }
          setSeriesData(data)
          if (data.episodes?.length > 0) {
            setSelectedEpisode(data.episodes[0])
          }
        }
      } catch {}
      setSeriesLoading(false)
    }
    fetchSeriesData()
  }, [currentView, selectedMovieId])

  const handleNavigate = useCallback((view: string) => {
    if (view === 'search-mobile') {
      setPreviousView(currentView)
      setCurrentView('search-mobile')
      window.scrollTo(0, 0)
      return
    }
    if (view === currentView && view !== 'watch') return
    setPreviousView(currentView)
    setCurrentView(view as ViewType)
    window.scrollTo(0, 0)
  }, [currentView])
  const handleDownloadClick = useCallback((id: string) => {
    const item = movies.find((m) => m.id === id)
    if (!item?.stream_url) return
    if (!hasSubscription && !isAdmin) {
      setIsSubModalOpen(true)
      return
    }
    const safeName = item.title.replace(/[^a-zA-Z0-9 _-]/g, '').trim() || 'video'
    downloadFile(item.stream_url, `${safeName}.mp4`)
  }, [movies, hasSubscription, isAdmin])

  const handleMovieClick = useCallback((id: string) => {
    // Check if the clicked item is a series - play inline with episodes
    const item = movies.find((m) => m.id === id)
    if (item?.content_type === 'series') {
      setPreviousView(currentView)
      setSelectedMovieId(id)
      setCurrentView('watch-series' as ViewType)
      window.scrollTo(0, 0)
      return
    }
    setPreviousView(currentView)
    setSelectedMovieId(id)
    setCurrentView('watch')
    window.scrollTo(0, 0)
  }, [currentView, movies])

  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q)
    setPreviousView(currentView)
    setCurrentView('search')
  }, [currentView])

  const handleBack = useCallback(() => {
    setCurrentView(previousView)
    window.scrollTo(0, 0)
  }, [previousView])

  const handleLogout = async () => {
    try {
      await signOut(auth)
      handleNavigate('home')
    } catch {}
  }

  // Filter movies based on current view
  const getFilteredMovies = () => {
    switch (currentView) {
      case 'movies':
        return movies.filter((m) => m.content_type !== 'series')
      case 'series':
        return movies.filter((m) => m.content_type === 'series')
      case 'nigerian':
        return movies.filter((m) =>
          m.category?.toLowerCase().includes('nigerian') ||
          m.category?.toLowerCase().includes('nollywood') ||
          m.genre?.toLowerCase().includes('nigerian')
        )
      case 'music':
        return movies.filter((m) => m.category?.toLowerCase().includes('music') || m.genre?.toLowerCase().includes('music'))
      case 'top-rated':
        return [...movies].sort((a, b) => (b.rating || 0) - (a.rating || 0))
      case 'anime':
        return movies.filter((m) =>
          m.category?.toLowerCase().includes('anime') ||
          m.category?.toLowerCase().includes('animation') ||
          m.genre?.toLowerCase().includes('anime') ||
          m.genre?.toLowerCase().includes('animation')
        )
      case 'search':
        return movies.filter((m) =>
          m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.genre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.category?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      case 'search-mobile':
        if (!mobileSearchQuery.trim()) return []
        return movies.filter((m) =>
          m.title.toLowerCase().includes(mobileSearchQuery.toLowerCase()) ||
          m.genre?.toLowerCase().includes(mobileSearchQuery.toLowerCase()) ||
          m.category?.toLowerCase().includes(mobileSearchQuery.toLowerCase())
        )
      default:
        return movies
    }
  }

  const getViewTitle = () => {
    switch (currentView) {
      case 'movies': return 'All Movies'
      case 'series': return 'TV Series'
      case 'nigerian': return 'Nigerian Movies'
      case 'music': return 'Music Videos'
      case 'top-rated': return 'Top Rated'
      case 'anime': return 'Anime & Animation'
      case 'search': return `Search: "${searchQuery}"`
      case 'search-mobile': return mobileSearchQuery.trim() ? `Results for "${mobileSearchQuery}"` : ''
      default: return 'Popular on VJ Oneflex Movies'
    }
  }

  // Mobile search view
  const renderMobileSearchView = () => {
    const results = getFilteredMovies()
    return (
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border px-3 py-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search movies, series, genres..."
              value={mobileSearchQuery}
              onChange={(e) => setMobileSearchQuery(e.target.value)}
              autoFocus
              className="w-full pl-10 pr-3 py-2.5 text-sm bg-muted rounded-lg border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        {mobileSearchQuery.trim() ? (
          results.length > 0 ? (
            <MovieGrid movies={results} title={getViewTitle()} onMovieClick={handleMovieClick} />
          ) : (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <Search className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No results for &ldquo;{mobileSearchQuery}&rdquo;</p>
              </div>
            </div>
          )
        ) : (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Search className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Search for movies, series, genres</p>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Watch view
  const renderWatchView = () => {
    if (watchLoading) {
      return (
        <div className="flex items-center justify-center py-24">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      )
    }

    if (!watchMovie) {
      return (
        <div className="flex flex-col items-center justify-center py-24">
          <h1 className="text-2xl font-bold text-foreground mb-4">Movie not found</h1>
          <button onClick={handleBack} className="text-primary hover:underline">Go back</button>
        </div>
      )
    }

    const stars = Math.round(watchMovie.rating || 4)
    const needsSub = !isAdmin && !hasSubscription && !checkingSubscription

    return (
      <div className="pb-20 md:pb-0">
        {/* Watch Header */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
          <div className="flex items-center justify-between px-3 py-1.5">
            <div className="flex items-center gap-2">
              <button onClick={handleBack} className="text-foreground hover:text-primary transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h1 className="text-xs font-semibold text-foreground truncate">{watchMovie.title}</h1>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                <Share2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Video Player */}
        <div className="w-full bg-black">
          <div className="mx-auto w-full max-w-5xl px-0 sm:px-2 lg:px-4 relative">
            {watchMovie.stream_url ? (
              <>
                <GoogleDrivePlayer videoUrl={watchMovie.stream_url} title={watchMovie.title} />
                {needsSub && (
                  <SubscriptionWall
                    contentTitle={watchMovie.title}
                    onSubscribe={() => setIsSubModalOpen(true)}
                  />
                )}
              </>
            ) : (
              <div className="aspect-video bg-muted flex items-center justify-center">
                <p className="text-muted-foreground text-sm">No stream available</p>
              </div>
            )}
          </div>
        </div>

        {/* Movie Info */}
        <div className="w-full mx-auto px-3 sm:px-4 lg:px-6 py-3 max-w-5xl">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-shrink-0">
              <div className="relative w-20 aspect-[2/3] rounded overflow-hidden">
                <Image
                  src={watchMovie.poster_url || '/placeholder.svg?height=240&width=160'}
                  alt={watchMovie.title}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-bold text-foreground mb-1">{watchMovie.title}</h2>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <div className="flex gap-px">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-3 h-3 ${i < stars ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                  ))}
                </div>
                <span className="text-muted-foreground text-[11px]">{watchMovie.year}</span>
                {watchMovie.category && (
                  <span className="px-1.5 py-px bg-primary/20 text-primary text-[10px] rounded">{watchMovie.category}</span>
                )}
              </div>
              {watchMovie.description && (
                <p className="text-muted-foreground text-[11px] mb-2 line-clamp-3">{watchMovie.description}</p>
              )}
              <div className="flex gap-2">
                {watchMovie.stream_url && (hasSubscription || isAdmin) ? (
                  <button
                    onClick={() => {
                      if (watchMovie.stream_url) {
                        const safeName = watchMovie.title.replace(/[^a-zA-Z0-9 _-]/g, '').trim() || 'video'
                        downloadFile(watchMovie.stream_url, `${safeName}.mp4`)
                      }
                    }}
                    className="inline-flex items-center gap-1 bg-primary hover:bg-primary/90 text-primary-foreground px-2 py-1 rounded text-[11px] font-medium transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    Download
                  </button>
                ) : watchMovie.stream_url && !hasSubscription && !isAdmin ? (
                  <button
                    onClick={() => setIsSubModalOpen(true)}
                    className="inline-flex items-center gap-1 bg-primary hover:bg-primary/90 text-primary-foreground px-2 py-1 rounded text-[11px] font-medium transition-colors"
                  >
                    <CreditCard className="w-3 h-3" />
                    Subscribe to Download
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          {relatedMovies.length > 0 && (
            <div className="mt-4">
              <h3 className="text-xs font-bold text-foreground mb-2">More {watchMovie.category} Movies</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                {relatedMovies.map((related) => (
                  <button key={related.id} onClick={() => handleMovieClick(related.id)} className="group text-left">
                    <div className="relative aspect-[2/3] rounded overflow-hidden bg-muted">
                      <Image
                        src={related.poster_url || '/placeholder.svg?height=300&width=200'}
                        alt={related.title}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                    <h4 className="mt-1 text-[10px] text-foreground truncate group-hover:text-primary">{related.title}</h4>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Series watch view - inline like movies
  const renderWatchSeriesView = () => {
    if (seriesLoading) {
      return (
        <div className="flex items-center justify-center py-24">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      )
    }
    if (!seriesData) {
      return (
        <div className="flex flex-col items-center justify-center py-24">
          <h1 className="text-2xl font-bold text-foreground mb-4">Series not found</h1>
          <button onClick={handleBack} className="text-primary hover:underline">Go back</button>
        </div>
      )
    }

    const stars = Math.round(seriesData.rating || 4)
    const needsSub = !isAdmin && !hasSubscription && !checkingSubscription
    const canAccess = hasSubscription || isAdmin
    const currentStreamUrl = selectedEpisode?.stream_url

    // Group episodes by season
    const episodesBySeason = new Map<number, any[]>()
    seriesData.episodes?.forEach((ep: any) => {
      const s = ep.season || 1
      if (!episodesBySeason.has(s)) episodesBySeason.set(s, [])
      episodesBySeason.get(s)!.push(ep)
    })
    const seasons = Array.from(episodesBySeason.keys()).sort((a, b) => a - b)

    return (
      <div className="pb-20 md:pb-0">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
          <div className="flex items-center justify-between px-3 py-1.5">
            <div className="flex items-center gap-2 min-w-0">
              <button onClick={handleBack} className="text-foreground hover:text-primary transition-colors flex-shrink-0">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="min-w-0">
                <h1 className="text-xs font-semibold text-foreground truncate">{seriesData.title}</h1>
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
        </div>

        {/* Player */}
        <div className="w-full bg-black">
          <div className="mx-auto w-full max-w-5xl px-0 sm:px-2 lg:px-4 relative">
            {currentStreamUrl ? (
              <>
                <GoogleDrivePlayer videoUrl={currentStreamUrl} title={`${seriesData.title} - S${selectedEpisode?.season} E${selectedEpisode?.episode_number}`} />
                {needsSub && (
                  <SubscriptionWall contentTitle={seriesData.title} onSubscribe={() => setIsSubModalOpen(true)} />
                )}
              </>
            ) : (
              <div className="aspect-video bg-muted flex items-center justify-center">
                <p className="text-muted-foreground text-sm">Select an episode to play</p>
              </div>
            )}
          </div>
        </div>

        {/* Download button + episode info - directly under player */}
        <div className="w-full mx-auto max-w-5xl px-3 sm:px-4 lg:px-6 pt-2 pb-1">
          <div className="flex items-center gap-2 flex-wrap">
            {selectedEpisode?.stream_url && canAccess ? (
              <button
                onClick={() => {
                  const safeName = `${seriesData.title} S${selectedEpisode.season}E${selectedEpisode.episode_number}`.replace(/[^a-zA-Z0-9 _-]/g, '').trim()
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
                    {eps.sort((a: any, b: any) => a.episode_number - b.episode_number).map((ep: any) => {
                      const isActive = selectedEpisode?.episode_number === ep.episode_number && selectedEpisode?.season === ep.season
                      return (
                        <button
                          key={`${ep.season}-${ep.episode_number}`}
                          onClick={() => { setSelectedEpisode(ep); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                          className={`flex flex-col items-center justify-center rounded px-1 py-1.5 transition-all ${
                            isActive
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                          }`}
                          title={ep.title || `Episode ${ep.episode_number}`}
                        >
                          <Play className="w-2.5 h-2.5 mb-px" />
                          <span className="text-[9px] font-bold leading-none">E{ep.episode_number}</span>
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
                <Image src={seriesData.poster_url || '/placeholder.svg?height=240&width=160'} alt={seriesData.title} fill className="object-cover" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-foreground mb-0.5">{seriesData.title}</h2>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <div className="flex gap-px">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-3 h-3 ${i < stars ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                  ))}
                </div>
                <span className="text-muted-foreground text-[11px]">{seriesData.year}</span>
                {seriesData.category && <span className="px-1.5 py-px bg-primary/20 text-primary text-[10px] rounded">{seriesData.category}</span>}
                <span className="text-muted-foreground text-[10px]">{seriesData.episodes?.length || 0} eps</span>
              </div>
              {seriesData.description && <p className="text-muted-foreground text-[11px] line-clamp-2">{seriesData.description}</p>}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Subscription view
  const renderSubscriptionView = () => {
    return (
      <div className="flex-1 overflow-y-auto px-3 py-4 pb-24 md:pb-4">
        <div className="max-w-3xl mx-auto">
          {/* Account Info */}
          {user && (
            <div className="bg-card border border-border rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                  {user.displayName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{user.displayName || 'User'}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-red-500 bg-red-500/10 rounded hover:bg-red-500/20 transition-colors"
                >
                  <LogOut className="w-3 h-3" />
                  Logout
                </button>
              </div>

              {/* Current subscription status */}
              {hasSubscription ? (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Crown className="w-4 h-4 text-green-500" />
                    <p className="text-xs font-semibold text-green-600 dark:text-green-400">Premium Active</p>
                  </div>
                  <p className="text-[11px] text-green-600 dark:text-green-400">{subPlanName} plan - {formatRemainingTime(subDaysRemaining)}</p>
                </div>
              ) : (
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <p className="text-xs font-semibold text-foreground">No Active Subscription</p>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Subscribe to unlock unlimited streaming and downloads</p>
                </div>
              )}
            </div>
          )}

          <div className="text-center mb-4">
            <h1 className="text-lg font-bold text-foreground mb-1 text-balance">VJ Oneflex Movies Premium</h1>
            <p className="text-xs text-muted-foreground text-pretty">
              Unlock unlimited entertainment with our flexible plans
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            {SUBSCRIPTION_PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-lg border-2 transition-all p-3 ${
                  plan.popular
                    ? 'border-primary bg-primary/5 ring-1 ring-primary ring-offset-1 ring-offset-background'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded-full text-[9px] font-bold">
                      POPULAR
                    </span>
                  </div>
                )}
                <h3 className="text-sm font-bold text-foreground mb-0.5">{plan.name}</h3>
                <p className="text-muted-foreground text-[10px] mb-2">{plan.duration}</p>
                <div className="mb-3">
                  <p className="text-lg font-bold text-primary">UGX {plan.price.toLocaleString()}</p>
                </div>
                <ul className="space-y-1 mb-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <Check className="w-3 h-3 text-green-500 flex-shrink-0 mt-px" />
                      <span className="text-[10px] text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => {
                    if (!user) { setIsLoginModalOpen(true); return }
                    setSelectedPlanId(plan.id)
                    setIsSubModalOpen(true)
                  }}
                  className={`w-full py-1.5 rounded text-xs font-semibold transition-colors ${
                    plan.popular
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'bg-muted text-foreground hover:bg-muted/80'
                  }`}
                >
                  Subscribe Now
                </button>
              </div>
            ))}
          </div>

          <div className="bg-card border border-border rounded-lg p-4 max-w-xl mx-auto">
            <h2 className="text-sm font-bold text-foreground mb-3">Premium Benefits</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                'Unlimited movies & series',
                'No ads',
                'Download & offline watch',
                'Multiple devices',
                '4K quality',
                'Early access to new content',
              ].map((benefit, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                  <span className="text-[11px] text-foreground">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Render main content area based on current view
  const renderContent = () => {
    if (currentView === 'watch') {
      return renderWatchView()
    }

    if (currentView === 'watch-series') {
      return renderWatchSeriesView()
    }

    if (currentView === 'search-mobile') {
      return renderMobileSearchView()
    }

    if (currentView === 'subscription') {
      return (
        <>
          <Header onNavigate={handleNavigate} activeView={currentView} onSearch={handleSearch} onLoginClick={() => setIsLoginModalOpen(true)} />
          {renderSubscriptionView()}
        </>
      )
    }

    // Default: home + filtered views
    const filteredMovies = getFilteredMovies()

    return (
      <>
        <Header onNavigate={handleNavigate} activeView={currentView} onSearch={handleSearch} onLoginClick={() => setIsLoginModalOpen(true)} />
        <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
            {currentView === 'home' && showInstallBanner && (
              <InstallBanner onDismiss={() => setShowInstallBanner(false)} />
            )}
            {currentView === 'home' && <HeroCarousel movies={movies} onWatchClick={handleMovieClick} />}
<MovieGrid movies={filteredMovies} title={getViewTitle()} onMovieClick={handleMovieClick} onDownloadClick={handleDownloadClick} />          {loading && (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Loading content...</p>
            </div>
          )}
          {!loading && filteredMovies.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">No content available. Check back soon!</p>
            </div>
          )}
      
        </div>
      </>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left sidebar hidden on mobile */}
      <div className="hidden md:block">
        <LeftSidebar
          onLoginClick={() => setIsLoginModalOpen(true)}
          onNavigate={handleNavigate}
          activeView={currentView}
        />
      </div>

      <main className="flex-1 flex flex-col min-h-screen">
        {renderContent()}
      </main>

      {/* Mobile bottom navigation */}
      {currentView !== 'watch' && currentView !== 'watch-series' && (
        <MobileBottomNav
          activeView={currentView}
          onNavigate={handleNavigate}
          onLoginClick={() => setIsLoginModalOpen(true)}
        />
      )}

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
      <SubscriptionModal
        isOpen={isSubModalOpen}
        onClose={() => {
          setIsSubModalOpen(false)
          setSelectedPlanId(null)
        }}
        preselectedPlanId={selectedPlanId}
      />
    </div>
  )
}
