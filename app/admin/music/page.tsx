"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Music, Trash2 } from "lucide-react"
import { addMusicVideo, deleteMusicVideo } from "@/lib/firebase-utils"
import { db } from "@/lib/firebase"
import { collection, onSnapshot, query, orderBy } from "firebase/firestore"

interface MusicVideo {
  id: string
  title: string
  artist: string
  stream_url: string
  rating: number
  year: number
  thumbnail_url: string
}

export default function ManageMusic() {
  const [videos, setVideos] = useState<MusicVideo[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    artist: "",
    stream_url: "",
    rating: "7.5",
    year: "2026",
    thumbnail_url: "",
  })

  useEffect(() => {
    const q = query(collection(db, "music_videos"), orderBy("created_at", "desc"))
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as MusicVideo[]
      setVideos(data)
    })
    return () => unsubscribe()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await addMusicVideo({
        title: formData.title,
        artist: formData.artist,
        stream_url: formData.stream_url,
        rating: Number.parseFloat(formData.rating),
        year: Number.parseInt(formData.year),
        thumbnail_url: formData.thumbnail_url,
      })
      setFormData({
        title: "",
        artist: "",
        stream_url: "",
        rating: "7.5",
        year: "2026",
        thumbnail_url: "",
      })
    } catch (error) {
      console.error("Error adding music video:", error)
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    try {
      await deleteMusicVideo(id)
    } catch (error) {
      console.error("Error deleting music video:", error)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Music className="w-8 h-8" />
          Manage Music Videos
        </h1>
        <p className="text-muted-foreground">Total: {videos.length} music videos</p>
      </div>

      <div className="bg-card rounded-lg p-6 border border-border">
        <h2 className="text-lg font-semibold text-foreground mb-4">Add New Music Video</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-foreground mb-1">
                Video Title <span className="text-primary">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter music video title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 bg-muted border border-border rounded-md text-foreground placeholder:text-muted-foreground"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-foreground mb-1">Artist Name</label>
              <input
                type="text"
                placeholder="Enter artist name"
                value={formData.artist}
                onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                className="w-full px-3 py-2 bg-muted border border-border rounded-md text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div>
              <label className="block text-sm text-foreground mb-1">
                Stream Link <span className="text-primary">*</span>
              </label>
              <input
                type="url"
                placeholder="https://example.com/stream/video.mp4"
                value={formData.stream_url}
                onChange={(e) => setFormData({ ...formData, stream_url: e.target.value })}
                className="w-full px-3 py-2 bg-muted border border-border rounded-md text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-foreground mb-1">Rating (0-10)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                placeholder="7.5"
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                className="w-full px-3 py-2 bg-muted border border-border rounded-md text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm text-foreground mb-1">Year</label>
              <input
                type="number"
                placeholder="2026"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                className="w-full px-3 py-2 bg-muted border border-border rounded-md text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm text-foreground mb-1">
                Thumbnail Image URL <span className="text-primary">*</span>
              </label>
              <input
                type="url"
                placeholder="https://example.com/image.jpg"
                value={formData.thumbnail_url}
                onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                className="w-full px-3 py-2 bg-muted border border-border rounded-md text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add Music Video"}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {videos.map((video) => (
          <div key={video.id} className="relative group">
            <div className="aspect-video rounded-lg overflow-hidden bg-muted">
              <img
                src={video.thumbnail_url || "/placeholder.svg?height=200&width=300&query=music video thumbnail"}
                alt={video.title}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => handleDelete(video.id)}
                className="absolute top-2 left-2 p-2 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <p className="mt-2 text-sm font-medium text-foreground truncate">{video.title}</p>
            <p className="text-xs text-muted-foreground truncate">{video.artist}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
