'use client'

import type React from 'react'
import { useEffect, useState } from 'react'
import { Film, Trash2, TrendingUp, Pencil, X, Save, Search } from 'lucide-react'
import { addMovie, deleteMovie, updateMovie } from '@/lib/firebase-utils'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'

interface Movie {
  id: string
  title: string
  category: string
  stream_url: string
  rating: number
  year: number
  poster_url: string
  is_trending?: boolean
  description?: string
}

const categories = ['Action', 'Animation', 'Comedy', 'Drama', 'Horror', 'Romance', 'Thriller', 'Sci-Fi', 'Nigerian', 'Nollywood', 'Music']

const labelCls = 'block text-[11px] font-medium text-foreground mb-0.5'
const inputCls = 'w-full px-2 py-1.5 text-xs bg-muted border border-border rounded text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary'

export default function ManageMovies() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null)
  const [editForm, setEditForm] = useState<Partial<Movie>>({})
  const [editLoading, setEditLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    category: 'Action',
    stream_url: '',
    rating: '7.5',
    year: '2026',
    poster_url: '',
    description: '',
    is_trending: false,
  })

  useEffect(() => {
    const q = query(collection(db, 'movies'), orderBy('created_at', 'desc'))
    const unsubscribe = onSnapshot(q, (snap) => {
      setMovies(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Movie[])
    })
    return () => unsubscribe()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await addMovie({
        title: formData.title,
        category: formData.category,
        stream_url: formData.stream_url,
        rating: Number.parseFloat(formData.rating),
        year: Number.parseInt(formData.year),
        poster_url: formData.poster_url,
        description: formData.description,
        is_trending: formData.is_trending,
      })
      setFormData({ title: '', category: 'Action', stream_url: '', rating: '7.5', year: '2026', poster_url: '', description: '', is_trending: false })
    } catch (error) {
      console.error('Error adding movie:', error)
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this movie?')) return
    try {
      await deleteMovie(id)
    } catch (error) {
      console.error('Error deleting movie:', error)
    }
  }

  function openEdit(movie: Movie) {
    setEditingMovie(movie)
    setEditForm({
      title: movie.title,
      category: movie.category,
      stream_url: movie.stream_url,
      rating: movie.rating,
      year: movie.year,
      poster_url: movie.poster_url,
      description: movie.description || '',
      is_trending: movie.is_trending || false,
    })
  }

  async function handleEditSave() {
    if (!editingMovie) return
    setEditLoading(true)
    try {
      await updateMovie(editingMovie.id, {
        title: editForm.title,
        category: editForm.category,
        stream_url: editForm.stream_url,
        rating: Number(editForm.rating),
        year: Number(editForm.year),
        poster_url: editForm.poster_url,
        description: editForm.description,
        is_trending: editForm.is_trending,
        updated_at: new Date(),
      })
      setEditingMovie(null)
    } catch (error) {
      console.error('Error updating movie:', error)
    }
    setEditLoading(false)
  }

  async function toggleTrending(id: string, current: boolean) {
    try {
      await updateMovie(id, { is_trending: !current })
    } catch (error) {
      console.error('Error updating trending:', error)
    }
  }

  const filtered = movies.filter((m) =>
    !searchTerm.trim() || m.title.toLowerCase().includes(searchTerm.toLowerCase()) || m.category?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Film className="w-5 h-5" /> Manage Movies
          </h1>
          <p className="text-xs text-muted-foreground">{movies.length} movies total</p>
        </div>
      </div>

      {/* Add Movie Form */}
      <div className="bg-card rounded-lg p-4 border border-border">
        <h2 className="text-sm font-semibold text-foreground mb-3">Add New Movie</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Title *</label>
              <input type="text" placeholder="Movie title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className={inputCls} required />
            </div>
            <div>
              <label className={labelCls}>Category *</label>
              <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className={inputCls}>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Stream URL *</label>
              <input type="url" placeholder="https://drive.google.com/..." value={formData.stream_url} onChange={(e) => setFormData({ ...formData, stream_url: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Poster URL *</label>
              <input type="url" placeholder="https://example.com/poster.jpg" value={formData.poster_url} onChange={(e) => setFormData({ ...formData, poster_url: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Rating (0-10)</label>
              <input type="number" step="0.1" min="0" max="10" value={formData.rating} onChange={(e) => setFormData({ ...formData, rating: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Year</label>
              <input type="number" value={formData.year} onChange={(e) => setFormData({ ...formData, year: e.target.value })} className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea placeholder="Movie description..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className={`${inputCls} min-h-[60px]`} />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 text-xs text-foreground cursor-pointer">
              <input type="checkbox" checked={formData.is_trending} onChange={(e) => setFormData({ ...formData, is_trending: e.target.checked })} className="w-3.5 h-3.5 rounded" />
              Mark as Trending
            </label>
            <button type="submit" disabled={loading} className="ml-auto px-4 py-1.5 text-xs bg-primary text-primary-foreground rounded font-medium hover:bg-primary/90 disabled:opacity-50">
              {loading ? 'Adding...' : 'Add Movie'}
            </button>
          </div>
        </form>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input type="text" placeholder="Search movies..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`${inputCls} pl-8`} />
      </div>

      {/* Edit Modal */}
      {editingMovie && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setEditingMovie(null)}>
          <div className="bg-card border border-border rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-foreground">Edit Movie</h2>
              <button onClick={() => setEditingMovie(null)} className="p-1 text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className={labelCls}>Title</label>
                <input type="text" value={editForm.title || ''} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Category</label>
                  <select value={editForm.category || ''} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} className={inputCls}>
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Year</label>
                  <input type="number" value={editForm.year || ''} onChange={(e) => setEditForm({ ...editForm, year: Number(e.target.value) })} className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Stream URL</label>
                <input type="url" value={editForm.stream_url || ''} onChange={(e) => setEditForm({ ...editForm, stream_url: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Poster URL</label>
                <input type="url" value={editForm.poster_url || ''} onChange={(e) => setEditForm({ ...editForm, poster_url: e.target.value })} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Rating</label>
                  <input type="number" step="0.1" min="0" max="10" value={editForm.rating || ''} onChange={(e) => setEditForm({ ...editForm, rating: Number(e.target.value) })} className={inputCls} />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-1.5 text-xs text-foreground cursor-pointer pb-1.5">
                    <input type="checkbox" checked={editForm.is_trending || false} onChange={(e) => setEditForm({ ...editForm, is_trending: e.target.checked })} className="w-3.5 h-3.5 rounded" />
                    Trending
                  </label>
                </div>
              </div>
              <div>
                <label className={labelCls}>Description</label>
                <textarea value={editForm.description || ''} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className={`${inputCls} min-h-[60px]`} />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={handleEditSave} disabled={editLoading} className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded font-medium hover:bg-primary/90 disabled:opacity-50">
                  <Save className="w-3 h-3" /> {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button onClick={() => setEditingMovie(null)} className="px-3 py-1.5 text-xs bg-muted text-foreground rounded">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Movies List */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {filtered.map((movie) => (
          <div key={movie.id} className="relative group bg-card rounded-lg border border-border overflow-hidden">
            <div className="aspect-[2/3] bg-muted relative">
              <img src={movie.poster_url || '/placeholder.svg?height=400&width=280'} alt={movie.title} className="w-full h-full object-cover" />
              {movie.is_trending && (
                <div className="absolute top-1.5 right-1.5 bg-primary text-primary-foreground px-1.5 py-0.5 rounded text-[9px] flex items-center gap-0.5 font-medium">
                  <TrendingUp className="w-2.5 h-2.5" /> Trending
                </div>
              )}
              {/* Hover actions */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button onClick={() => openEdit(movie)} className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors" title="Edit">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => toggleTrending(movie.id, movie.is_trending || false)} className="p-2 bg-yellow-500 text-white rounded-full hover:bg-yellow-600 transition-colors" title="Toggle Trending">
                  <TrendingUp className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(movie.id)} className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors" title="Delete">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="p-1.5">
              <p className="text-[11px] font-medium text-foreground truncate">{movie.title}</p>
              <p className="text-[9px] text-muted-foreground">{movie.year} &middot; {movie.category}</p>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">
          {searchTerm ? `No movies found for "${searchTerm}"` : 'No movies yet. Add your first movie above.'}
        </p>
      )}
    </div>
  )
}
