import { Star, Download } from "lucide-react"
import Image from "next/image"

interface MovieCardProps {
  id: string
  title: string
  year: number
  genre: string
  rating: number
  posterUrl: string
  streamUrl?: string
  onMovieClick?: (id: string) => void
  onDownloadClick?: (id: string) => void
}

export function MovieCard({ id, title, year, genre, rating, posterUrl, streamUrl, onMovieClick, onDownloadClick }: MovieCardProps) {
  const stars = Math.round(rating)

  return (
    <div className="group relative block text-left w-full">
      <div className="relative aspect-[2/3] rounded overflow-hidden bg-muted">
        <Image
          src={posterUrl || "/placeholder.svg"}
          alt={title}
          fill
          className="object-cover transition-transform group-hover:scale-105"
        />

        <div className="absolute top-1 left-1 flex gap-px">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className={`w-2 h-2 ${i < stars ? "fill-yellow-400 text-yellow-400" : "text-gray-400"}`} />
          ))}
        </div>

        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-white bg-black/50 px-1 py-px rounded">{year}</span>
              <span className="text-[9px] text-white">{genre}</span>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* Watch button */}
              <button
                onClick={() => onMovieClick?.(id)}
className="bg-red-600 text-white text-[15px] px-2.5 py-px rounded flex items-center gap-0.5 hover:bg-red-700 transition-colors"
              >
                Watch
              </button>
              {/* Download button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDownloadClick?.(id)
                }}
className="bg-red-600 text-white text-[9px] px-1.5 py-px rounded flex items-center gap-0.5 hover:bg-red-700 transition-colors"
              >
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
      <h3 className="mt-1 text-[11px] font-medium text-foreground truncate">{title}</h3>
    </div>
  )
}