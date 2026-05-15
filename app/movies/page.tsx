'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/header'
import { LeftSidebar } from '@/components/left-sidebar'
import { RightSidebar } from '@/components/right-sidebar'
import { MovieGrid } from '@/components/movie-grid'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'

interface Movie {
  id: string
  title: string
  year: number
  genre?: string
  category?: string
  rating: number
  poster_url: string
}

export default function MoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Real-time listener for all movies
    const q = query(collection(db, 'movies'), orderBy('created_at', 'desc'))
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const moviesData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Movie[]
        setMovies(moviesData)
        setLoading(false)
      },
      (error) => {
        console.error('[v0] Error fetching movies:', error)
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
              <h1 className="text-2xl font-bold text-foreground mb-2">Movies</h1>
              <p className="text-muted-foreground mb-4">Browse all available movies</p>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Loading movies...</p>
              </div>
            ) : movies.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">No movies available</p>
              </div>
            ) : (
              <MovieGrid movies={movies} />
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
