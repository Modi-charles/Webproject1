import { MovieCard } from "./movie-card"

interface Movie {
  id: string
  title: string
  year: number
  genre?: string
  category?: string
  rating: number
  poster_url: string
  stream_url?: string
}

interface MovieGridProps {
  movies: Movie[]
  title?: string
  onMovieClick?: (id: string) => void
  onDownloadClick?: (id: string) => void
}

export function MovieGrid({ movies, title, onMovieClick, onDownloadClick }: MovieGridProps) {
  return (
    <section className="px-2 py-2">
      {title && <h2 className="text-xs font-semibold text-foreground mb-2">{title}</h2>}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2">
        {movies.map((movie) => (
          <MovieCard
            key={movie.id}
            id={movie.id}
            title={movie.title}
            year={movie.year || 2025}
            genre={movie.genre || movie.category || "Action"}
            rating={movie.rating || 4}
            posterUrl={movie.poster_url || "/placeholder.svg"}
            streamUrl={movie.stream_url}
            onMovieClick={onMovieClick}
            onDownloadClick={onDownloadClick}
          />
        ))}
      </div>
    </section>
  )
}