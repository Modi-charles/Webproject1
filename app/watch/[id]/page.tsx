'use client'

import { GoogleDrivePlayer } from '@/components/google-drive-player'
import { SubscriptionWall } from '@/components/subscription-wall'
import { SubscriptionModal } from '@/components/subscription-modal'
import { Star, ArrowLeft, Download, Share2, CreditCard } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { db } from '@/lib/firebase'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { checkSubscriptionStatus } from '@/lib/subscription-utils'
import { downloadFile } from '@/lib/download'

interface Movie {
  id: string
  title: string
  year: number
  category?: string
  rating: number
  poster_url: string
  stream_url: string
  description?: string
}

export default function WatchPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const [movieId, setMovieId] = useState<string | null>(null)
  const { user, isAdmin } = useAuth()
  const [movie, setMovie] = useState<Movie | null>(null)
  const [relatedMovies, setRelatedMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [hasSubscription, setHasSubscription] = useState(false)
  const [checkingSubscription, setCheckingSubscription] = useState(true)
  const [isSubModalOpen, setIsSubModalOpen] = useState(false)

  useEffect(() => {
    const getParams = async () => {
      if (params instanceof Promise) {
        const resolved = await params
        setMovieId(resolved.id)
      } else {
        setMovieId(params.id)
      }
    }
    getParams()
  }, [params])

  useEffect(() => {
    if (!movieId) return

    const fetchMovie = async () => {
      try {
        // Search across all content collections
        const collectionsToSearch = ['movies', 'originals', 'animations', 'music_videos']
        let movieData: Movie | null = null
        let foundCollection = ''

        for (const colName of collectionsToSearch) {
          const docRef = doc(db, colName, movieId)
          const docSnap = await getDoc(docRef)
          if (docSnap.exists()) {
            movieData = { id: docSnap.id, ...docSnap.data() } as Movie
            foundCollection = colName
            // Normalize fields from music_videos
            if (colName === 'music_videos' && !movieData.poster_url && (docSnap.data() as any).thumbnail_url) {
              movieData.poster_url = (docSnap.data() as any).thumbnail_url
            }
            break
          }
        }

        if (movieData) {
          setMovie(movieData)

          const category = movieData.category
          if (category) {
            // Search related content from the same collection
            const q = query(collection(db, foundCollection), where('category', '==', category))
            const querySnapshot = await getDocs(q)
            const related = querySnapshot.docs
              .map((d) => ({ id: d.id, ...d.data() } as Movie))
              .filter((m) => m.id !== movieId)
              .slice(0, 6)
            setRelatedMovies(related)
          }
        }
      } catch {}
      setLoading(false)
    }

    fetchMovie()
  }, [movieId])

  useEffect(() => {
    const checkSub = async () => {
      if (!user) {
        setHasSubscription(false)
        setCheckingSubscription(false)
        return
      }
      try {
        const { isActive } = await checkSubscriptionStatus(user.uid)
        setHasSubscription(isActive)
      } catch {
        setHasSubscription(false)
      }
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

  if (!movie) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-foreground mb-4">Movie not found</h1>
        <Link href="/" className="text-primary hover:underline">Back to home</Link>
      </div>
    )
  }

  const stars = Math.round(movie.rating || 4)
  const needsSub = !isAdmin && !hasSubscription && !checkingSubscription

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-foreground hover:text-primary transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-lg font-semibold text-foreground truncate">{movie.title}</h1>
          </div>
          <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="w-full bg-black">
        <div className="mx-auto w-full max-w-7xl px-0 sm:px-4 lg:px-8 relative">
          {movie.stream_url && (
            <>
              <GoogleDrivePlayer videoUrl={movie.stream_url} title={movie.title} />
              {needsSub && (
                <SubscriptionWall
                  contentTitle={movie.title}
                  onSubscribe={() => setIsSubModalOpen(true)}
                />
              )}
            </>
          )}
        </div>
      </div>

      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-shrink-0">
            <div className="relative w-32 aspect-[2/3] rounded-lg overflow-hidden">
              <Image
                src={movie.poster_url || '/placeholder.svg?height=240&width=160'}
                alt={movie.title}
                fill
                className="object-cover"
              />
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-foreground mb-2">{movie.title}</h2>
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < stars ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                ))}
              </div>
              <span className="text-muted-foreground text-sm">{movie.year}</span>
              {movie.category && (
                <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded">{movie.category}</span>
              )}
            </div>
            {movie.description && (
              <p className="text-muted-foreground text-sm mb-4">{movie.description}</p>
            )}
            {movie.stream_url && (hasSubscription || isAdmin) ? (
              <button
                onClick={() => {
                  if (movie.stream_url) {
                    const safeName = movie.title.replace(/[^a-zA-Z0-9 _-]/g, '').trim() || 'video'
                    downloadFile(movie.stream_url, `${safeName}.mp4`)
                  }
                }}
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            ) : movie.stream_url && !hasSubscription && !isAdmin ? (
              <button
                onClick={() => setIsSubModalOpen(true)}
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors text-sm"
              >
                <CreditCard className="w-4 h-4" />
                Subscribe to Download
              </button>
            ) : null}
          </div>
        </div>

        {relatedMovies.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-bold text-foreground mb-4">More {movie.category} Movies</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {relatedMovies.map((related) => (
                <Link key={related.id} href={`/watch/${related.id}`} className="group">
                  <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted">
                    <Image
                      src={related.poster_url || '/placeholder.svg?height=300&width=200'}
                      alt={related.title}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                  <h4 className="mt-2 text-xs text-foreground truncate group-hover:text-primary">{related.title}</h4>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <SubscriptionModal
        isOpen={isSubModalOpen}
        onClose={() => setIsSubModalOpen(false)}
      />
    </div>
  )
}
