'use client'

import type React from 'react'

import { useEffect, useState } from 'react'
import { ImageIcon, Trash2 } from 'lucide-react'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc } from 'firebase/firestore'

interface CarouselItem {
  id: string
  title: string
  subtitle: string
  banner_url: string
  link_type: string
  link_id?: string | null
}

export default function ManageCarousel() {
  const [items, setItems] = useState<CarouselItem[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    banner_url: '',
    link_type: 'none',
  })

  useEffect(() => {
    // Real-time listener for carousel
    const q = query(collection(db, 'carousel'), orderBy('created_at', 'desc'))
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const itemsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as CarouselItem[]
      setItems(itemsData)
    })

    return () => unsubscribe()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      await addDoc(collection(db, 'carousel'), {
        title: formData.title,
        subtitle: formData.subtitle,
        banner_url: formData.banner_url,
        link_type: formData.link_type,
        created_at: new Date(),
      })

      setFormData({
        title: '',
        subtitle: '',
        banner_url: '',
        link_type: 'none',
      })
    } catch (error) {
      console.error('Error adding carousel item:', error)
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    try {
      await deleteDoc(doc(db, 'carousel', id))
    } catch (error) {
      console.error('Error deleting carousel item:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <ImageIcon className="w-8 h-8" />
          Manage Carousel
        </h1>
        <p className="text-muted-foreground">Total: {items.length} items</p>
      </div>

      {/* Add Carousel Form */}
      <div className="bg-card rounded-lg p-6 border border-border">
        <h2 className="text-lg font-semibold text-foreground mb-4">Add Carousel Item</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <label className="block text-sm text-foreground mb-1">Subtitle</label>
              <input
                type="text"
                placeholder="Enter subtitle"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                className="w-full px-3 py-2 bg-muted border border-border rounded-md text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-foreground mb-1">
              Banner Image URL <span className="text-primary">*</span>
            </label>
            <input
              type="url"
              placeholder="https://example.com/image.jpg"
              value={formData.banner_url}
              onChange={(e) => setFormData({ ...formData, banner_url: e.target.value })}
              className="w-full px-3 py-2 bg-muted border border-border rounded-md text-foreground placeholder:text-muted-foreground"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-foreground mb-1">Link to Content (Optional)</label>
            <select
              value={formData.link_type}
              onChange={(e) => setFormData({ ...formData, link_type: e.target.value })}
              className="w-full px-3 py-2 bg-muted border border-border rounded-md text-foreground"
            >
              <option value="none">No Link</option>
              <option value="movie">Movie</option>
              <option value="series">Series</option>
              <option value="original">Original</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add Item"}
          </button>
        </form>
      </div>

      {/* Carousel Items List */}
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-4 bg-card rounded-lg p-4 border border-border">
            <div className="w-20 h-14 rounded overflow-hidden bg-muted flex-shrink-0">
              <img
                src={item.banner_url || "/placeholder.svg?height=56&width=80&query=banner"}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">{item.title}</p>
              {item.subtitle && <p className="text-sm text-muted-foreground">{item.subtitle}</p>}
            </div>
            <button
              onClick={() => handleDelete(item.id)}
              className="p-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
