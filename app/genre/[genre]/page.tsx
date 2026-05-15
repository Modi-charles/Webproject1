import { Header } from "@/components/header"
import { LeftSidebar } from "@/components/left-sidebar"
import { RightSidebar } from "@/components/right-sidebar"
import { MovieGrid } from "@/components/movie-grid"

export default async function GenrePage({ params }: { params: Promise<{ genre: string }> }) {
  const { genre } = await params
  const genreName = genre.charAt(0).toUpperCase() + genre.slice(1)
  const movies: any[] = []

  return (
    <div className="flex min-h-screen bg-background">
      <LeftSidebar />

      <div className="flex flex-1 flex-col lg:flex-row">
        <main className="flex-1 flex flex-col min-h-screen">
          <Header />
          <div className="flex-1 overflow-y-auto">
            <MovieGrid movies={movies} title={`${genreName} Movies`} />
          </div>
        </main>

        <div className="hidden lg:block">
          <RightSidebar />
        </div>
      </div>
    </div>
  )
}
