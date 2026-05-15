import { Header } from "@/components/header"
import { LeftSidebar } from "@/components/left-sidebar"
import { RightSidebar } from "@/components/right-sidebar"
import Image from "next/image"
import Link from "next/link"

const defaultGenres = [
  { name: "Action", image: "/action-movie-genre.jpg" },
  { name: "Animation", image: "/animation-movie-genre.jpg" },
  { name: "Drama", image: "/drama-movie-genre.jpg" },
  { name: "Horror", image: "/horror-movie-genre.jpg" },
  { name: "Comedy", image: "/comedy-movie-genre.jpg" },
  { name: "Thriller", image: "/thriller-movie-genre.jpg" },
  { name: "Romance", image: "/romance-movie-genre.jpg" },
  { name: "Sci-Fi", image: "/scifi-movie-genre.jpg" },
]

export default async function GenresPage() {
  const genres = defaultGenres.map((g) => ({
    ...g,
    count: 0,
  }))

  return (
    <div className="flex min-h-screen bg-background">
      <LeftSidebar />

      <div className="flex flex-1 flex-col lg:flex-row">
        <main className="flex-1 flex flex-col min-h-screen">
          <Header />
          <div className="flex-1 overflow-y-auto p-4">
            <h1 className="text-2xl font-bold text-foreground mb-2">All Genres</h1>
            <p className="text-muted-foreground mb-6">Browse movies by genre</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {genres.map((genre) => (
                <Link
                  key={genre.name}
                  href={`/genre/${genre.name.toLowerCase()}`}
                  className="relative rounded-lg overflow-hidden group aspect-video"
                >
                  <Image
                    src={genre.image || `/placeholder.svg?height=200&width=300&query=${genre.name} movie genre`}
                    alt={genre.name}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition-colors" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold text-white">{genre.name}</span>
                    <span className="text-sm text-gray-300">({genre.count} movies)</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </main>

        <div className="hidden lg:block">
          <RightSidebar />
        </div>
      </div>
    </div>
  )
}
