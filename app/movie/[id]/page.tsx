import { Header } from "@/components/header"
import { LeftSidebar } from "@/components/left-sidebar"
import { Play, Download, Star, ArrowLeft } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default async function MoviePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Sample movie data
  const movie = {
    id,
    title: "Rapid Action",
    year: 2025,
    genre: "Action",
    rating: 4.5,
    poster_url: "/action-soldier-military-movie-poster.jpg",
    description:
      "An elite soldier must fight his way through an army of enemies to save his family and prevent a global catastrophe. Packed with non-stop action and thrilling sequences.",
  }

  const stars = Math.round(movie.rating)

  return (
    <div className="flex min-h-screen bg-background">
      <LeftSidebar />

      <main className="flex-1 flex flex-col">
        <Header />

        <div className="flex-1 overflow-y-auto p-6">
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="flex flex-col md:flex-row gap-8">
            <div className="relative w-full md:w-80 aspect-[2/3] rounded-xl overflow-hidden flex-shrink-0">
              <Image src={movie.poster_url || "/placeholder.svg"} alt={movie.title} fill className="object-cover" />
            </div>

            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground mb-2">{movie.title}</h1>

              <div className="flex items-center gap-4 mb-4">
                <span className="text-muted-foreground">{movie.year}</span>
                <span className="px-2 py-1 bg-muted rounded text-sm">{movie.genre}</span>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < stars ? "fill-yellow-400 text-yellow-400" : "text-gray-400"}`}
                    />
                  ))}
                </div>
              </div>

              <p className="text-muted-foreground mb-6 max-w-2xl">{movie.description}</p>

              <div className="flex gap-4">
                <button className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors">
                  <Play className="w-5 h-5" />
                  Watch Now
                </button>
                <button className="flex items-center gap-2 bg-muted text-foreground px-6 py-3 rounded-lg font-medium hover:bg-muted/80 transition-colors">
                  <Download className="w-5 h-5" />
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
