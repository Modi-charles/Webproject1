import { Header } from "@/components/header"
import { LeftSidebar } from "@/components/left-sidebar"
import { RightSidebar } from "@/components/right-sidebar"
import { MovieGrid } from "@/components/movie-grid"
import { Search } from "lucide-react"

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q: query } = await searchParams
  const results: any[] = []

  return (
    <div className="flex min-h-screen bg-background">
      <LeftSidebar />

      <div className="flex flex-1 flex-col lg:flex-row">
        <main className="flex-1 flex flex-col min-h-screen">
          <Header />
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <h1 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
                <Search className="w-6 h-6" />
                Search Results
              </h1>
              {query ? (
                <p className="text-muted-foreground mb-4">
                  {results.length} result{results.length !== 1 ? "s" : ""} for "{query}"
                </p>
              ) : (
                <p className="text-muted-foreground mb-4">Enter a search term to find movies, series, and more</p>
              )}
            </div>

            {results.length > 0 ? (
              <MovieGrid movies={results} title="" />
            ) : query ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Search className="w-16 h-16 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold text-foreground mb-2">No results found</h2>
                <p className="text-muted-foreground">Try searching with different keywords</p>
              </div>
            ) : null}
          </div>
        </main>

        <div className="hidden lg:block">
          <RightSidebar />
        </div>
      </div>
    </div>
  )
}
