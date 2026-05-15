'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/header'
import { LeftSidebar } from '@/components/left-sidebar'
import { RightSidebar } from '@/components/right-sidebar'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { Star } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface Series {
  id: string
  title: string
  year: number
  category?: string
  rating: number
  poster_url: string
  episodes?: { season: number; episode_number: number; title: string; stream_url: string }[]
}

export default function SeriesPage() {
  const [series, setSeries] = useState<Series[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'series'), orderBy('created_at', 'desc'))
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const seriesData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Series[]
        setSeries(seriesData)
        setLoading(false)
      },
      (error) => {
        console.error('Error fetching series:', error)
        setLoading(false)
      }
    )
    return () => unsubscribe()
  }, [])

  return (
    <div className="flex min-h-screen bg-background">
      <LeftSidebar />

      <div className="flex flex-1 flex-col lg:flex-row">
        <main className="flex-1 flex flex-col min-h-screen">
          <Header />
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <h1 className="text-2xl font-bold text-foreground mb-2">TV Series</h1>
              <p className="text-muted-foreground mb-4">Browse all available TV series</p>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Loading series...</p>
              </div>
            ) : series.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">No series available</p>
              </div>
            ) : (
              <section className="px-2 py-2">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2">
                  {series.map((s) => {
                    const stars = Math.round(s.rating || 4)
                    const epCount = s.episodes?.length || 0
                    return (
                      <Link href={`/watch-series/${s.id}`} key={s.id} className="group relative block text-left w-full">
                        <div className="relative aspect-[2/3] rounded overflow-hidden bg-muted">
                          <Image
                            src={s.poster_url || '/placeholder.svg'}
                            alt={s.title}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                          />
                          <div className="absolute top-1 left-1 flex gap-px">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-2 h-2 ${i < stars ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
                            ))}
                          </div>
                          {epCount > 0 && (
                            <div className="absolute top-1 right-1 bg-green-600 text-white px-1 py-px rounded text-[8px] font-medium">
                              {epCount} Ep{epCount !== 1 ? 's' : ''}
                            </div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <span className="text-[9px] text-white bg-black/50 px-1 py-px rounded">{s.year}</span>
                                <span className="text-[9px] text-white">{s.category || 'Series'}</span>
                              </div>
                              <span className="bg-primary text-primary-foreground text-[9px] px-1 py-px rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                Watch
                              </span>
                            </div>
                          </div>
                        </div>
                        <h3 className="mt-1 text-[11px] font-medium text-foreground truncate">{s.title}</h3>
                      </Link>
                    )
                  })}
                </div>
              </section>
            )}
          </div>
        </main>

        <div className="hidden lg:block">
          <RightSidebar />
        </div>
      </div>
    </div>
  )
}
