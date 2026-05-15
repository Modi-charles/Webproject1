"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Star, Trash2 } from "lucide-react"
import { addOriginal, deleteOriginal } from "@/lib/firebase-utils"
import { db } from "@/lib/firebase"
import { collection, onSnapshot, query, orderBy } from "firebase/firestore"

interface Original {
  id: string
  title: string
  category: string
  stream_url: string
  rating: number
  year: number
  poster_url: string
}

const categories = ["Action", "Animation", "Comedy", "Drama", "Horror", "Romance", "Thriller", "Sci-Fi"]

export default function ManageOriginals() {
  const [originals, setOriginals] = useState<Original[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    category: "Animation",
    stream_url: "",
    rating: "7.5",
    year: "2026",
    poster_url: "",
  })

  useEffect(() => {
    const q = query(collection(db, "originals"), orderBy("created_at", "desc"))
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Original[]
      setOriginals(data)
    })
    return () => unsubscribe()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await addOriginal({
        title: formData.title,
        category: formData.category,
        stream_url: formData.stream_url,
        rating: Number.parseFloat(formData.rating),
        year: Number.parseInt(formData.year),
        poster_url: formData.poster_url,
      })
      setFormData({
        title: "",
        category: "Animation",
        stream_url: "",
        rating: "7.5",
        year: "2026",
        poster_url: "",
      })
    } catch (error) {
      console.error("Error adding original:", error)
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    try {
      await deleteOriginal(id)
    } catch (error) {
      console.error("Error deleting original:", error)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Star className="w-8 h-8" />
          Manage Originals
        </h1>
        <p className="text-muted-foreground">Total: {originals.length} originals</p>
      </div>

      <div className="bg-card rounded-lg p-6 border border-border">
        <h2 className="text-lg font-semibold text-foreground mb-4">Add New Original</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-foreground mb-1">
                Title <span className="text-primary">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 bg-muted border border-border rounded-md text-foreground placeholder:text-muted-foreground"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-foreground mb-1">
                Category <span className="text-primary">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-muted border border-border rounded-md text-foreground"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
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
                Poster Image URL <span className="text-primary">*</span>
              </label>
              <input
                type="url"
                placeholder="https://example.com/image.jpg"
                value={formData.poster_url}
                onChange={(e) => setFormData({ ...formData, poster_url: e.target.value })}
                className="w-full px-3 py-2 bg-muted border border-border rounded-md text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add Original"}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {originals.map((item) => (
          <div key={item.id} className="relative group">
            <div className="aspect-[2/3] rounded-lg overflow-hidden bg-muted">
              <img
                src={item.poster_url || "/placeholder.svg?height=400&width=280&query=original content poster"}
                alt={item.title}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => handleDelete(item.id)}
                className="absolute top-2 left-2 p-2 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <p className="mt-2 text-sm font-medium text-foreground truncate">{item.title}</p>
            <p className="text-xs text-muted-foreground">
              {item.year} - {item.category}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
