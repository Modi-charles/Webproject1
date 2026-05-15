import { Header } from "@/components/header"
import { LeftSidebar } from "@/components/left-sidebar"
import { RightSidebar } from "@/components/right-sidebar"
import Image from "next/image"
import Link from "next/link"
import { Star, Play } from "lucide-react"

type MusicVideo = {
  id: string
  title: string
  artist: string
  stream_url: string
  rating: number
  year: number
  thumbnail_url: string
}

export default async function MusicPage() {
  const musicVideos: MusicVideo[] = []

  return (
    <div className="flex min-h-screen bg-background">
      <LeftSidebar />

      <div className="flex flex-1 flex-col lg:flex-row">
        <main className="flex-1 flex flex-col min-h-screen">
          <Header />
          <div className="flex-1 overflow-y-auto p-4">
            <h2 className="text-xl font-bold text-foreground mb-4">Music Videos</h2>

            {musicVideos.length === 0 ? (
              <p className="text-muted-foreground">No music videos available yet.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {musicVideos.map((video) => (
                  <Link
                    key={video.id}
                    href={`/watch/${video.id}?type=music`}
                    className="group relative rounded-lg overflow-hidden bg-card"
                  >
                    <div className="aspect-video relative">
                      <Image
                        src={video.thumbnail_url || "/placeholder.svg?height=200&width=300&query=music video thumbnail"}
                        alt={video.title}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play className="w-12 h-12 text-white" />
                      </div>
                    </div>
                    <div className="p-2">
                      <h3 className="text-sm font-medium text-foreground truncate">{video.title}</h3>
                      <p className="text-xs text-muted-foreground truncate">{video.artist}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${i < Math.floor(video.rating / 2) ? "text-yellow-400 fill-yellow-400" : "text-gray-600"}`}
                          />
                        ))}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
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
