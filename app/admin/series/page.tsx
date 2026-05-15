'use client'

import type React from 'react'
import { useEffect, useState } from 'react'
import { Tv, Trash2, Plus, Pencil, X, Save, Search, ChevronDown, ChevronUp, Play } from 'lucide-react'
import { addSeries, deleteSeries, updateSeries } from '@/lib/firebase-utils'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'

interface Episode {
  season: number
  episode_number: number
  title: string
  stream_url: string
}

interface Series {
  id: string
  title: string
  category: string
  poster_url: string
  rating: number
  year: number
  description?: string
  episodes?: Episode[]
}

const categories = ['Action', 'Animation', 'Comedy', 'Drama', 'Horror', 'Romance', 'Thriller', 'Sci-Fi', 'Nigerian', 'Nollywood']

const labelCls = 'block text-[11px] font-medium text-foreground mb-0.5'
const inputCls = 'w-full px-2 py-1.5 text-xs bg-muted border border-border rounded text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary'

export default function ManageSeries() {
  const [series, setSeries] = useState<Series[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Add form
  const [episodes, setEpisodes] = useState<Episode[]>([{ season: 1, episode_number: 1, title: '', stream_url: '' }])
  const [formData, setFormData] = useState({
    title: '', category: 'Action', poster_url: '', rating: '7.5', year: '2026', description: '',
  })

  // Edit state
  const [editingSeries, setEditingSeries] = useState<Series | null>(null)
  const [editForm, setEditForm] = useState<Partial<Series>>({})
  const [editEpisodes, setEditEpisodes] = useState<Episode[]>([])
  const [editLoading, setEditLoading] = useState(false)

  // Expanded series (show episodes)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    const q = query(collection(db, 'series'), orderBy('created_at', 'desc'))
    return onSnapshot(q, (snap) => {
      setSeries(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Series[])
    })
  }, [])

  // Add form helpers
  function addEpisodeToForm() {
    const last = episodes[episodes.length - 1]
    setEpisodes([...episodes, { season: last?.season || 1, episode_number: (last?.episode_number || 0) + 1, title: '', stream_url: '' }])
  }

  function updateFormEpisode(index: number, field: keyof Episode, value: string | number) {
    const updated = [...episodes]
    ;(updated[index] as any)[field] = value
    setEpisodes(updated)
  }

  function removeFormEpisode(index: number) {
    setEpisodes(episodes.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const validEpisodes = episodes.filter((ep) => ep.title.trim() || ep.stream_url.trim())
      await addSeries({
        title: formData.title,
        category: formData.category,
        poster_url: formData.poster_url,
        rating: Number.parseFloat(formData.rating),
        year: Number.parseInt(formData.year),
        description: formData.description,
        episodes: validEpisodes,
      })
      setFormData({ title: '', category: 'Action', poster_url: '', rating: '7.5', year: '2026', description: '' })
      setEpisodes([{ season: 1, episode_number: 1, title: '', stream_url: '' }])
    } catch (error) {
      console.error('Error adding series:', error)
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this series and all its episodes?')) return
    try { await deleteSeries(id) } catch (error) { console.error('Error:', error) }
  }

  // Edit helpers
  function openEdit(s: Series) {
    setEditingSeries(s)
    setEditForm({
      title: s.title, category: s.category, poster_url: s.poster_url,
      rating: s.rating, year: s.year, description: s.description || '',
    })
    setEditEpisodes(s.episodes ? [...s.episodes.map((ep) => ({ ...ep }))] : [])
  }

  function addEditEpisode() {
    const last = editEpisodes[editEpisodes.length - 1]
    setEditEpisodes([...editEpisodes, { season: last?.season || 1, episode_number: (last?.episode_number || 0) + 1, title: '', stream_url: '' }])
  }

  function updateEditEpisode(index: number, field: keyof Episode, value: string | number) {
    const updated = [...editEpisodes]
    ;(updated[index] as any)[field] = value
    setEditEpisodes(updated)
  }

  function removeEditEpisode(index: number) {
    setEditEpisodes(editEpisodes.filter((_, i) => i !== index))
  }

  async function handleEditSave() {
    if (!editingSeries) return
    setEditLoading(true)
    try {
      const validEpisodes = editEpisodes.filter((ep) => ep.title.trim() || ep.stream_url.trim())
      await updateSeries(editingSeries.id, {
        title: editForm.title,
        category: editForm.category,
        poster_url: editForm.poster_url,
        rating: Number(editForm.rating),
        year: Number(editForm.year),
        description: editForm.description,
        episodes: validEpisodes,
        updated_at: new Date(),
      })
      setEditingSeries(null)
    } catch (error) {
      console.error('Error updating series:', error)
    }
    setEditLoading(false)
  }

  const filtered = series.filter((s) =>
    !searchTerm.trim() || s.title.toLowerCase().includes(searchTerm.toLowerCase()) || s.category?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Episode row component for forms
  const EpisodeRow = ({
    ep, index, onUpdate, onRemove
  }: { ep: Episode; index: number; onUpdate: (i: number, f: keyof Episode, v: string | number) => void; onRemove: (i: number) => void }) => (
    <div className="bg-background rounded border border-border p-2 space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold text-foreground">S{ep.season} E{ep.episode_number}</p>
        <button type="button" onClick={() => onRemove(index)} className="p-0.5 text-red-400 hover:text-red-500"><X className="w-3 h-3" /></button>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        <input type="number" placeholder="S" min="1" value={ep.season} onChange={(e) => onUpdate(index, 'season', Number(e.target.value))} className={`${inputCls} text-center`} />
        <input type="number" placeholder="Ep" min="1" value={ep.episode_number} onChange={(e) => onUpdate(index, 'episode_number', Number(e.target.value))} className={`${inputCls} text-center`} />
        <input type="text" placeholder="Episode title" value={ep.title} onChange={(e) => onUpdate(index, 'title', e.target.value)} className={`${inputCls} col-span-2`} />
      </div>
      <input type="url" placeholder="Stream URL (Google Drive link)" value={ep.stream_url} onChange={(e) => onUpdate(index, 'stream_url', e.target.value)} className={inputCls} />
    </div>
  )

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Tv className="w-5 h-5" /> Manage Series
        </h1>
        <p className="text-xs text-muted-foreground">{series.length} series total</p>
      </div>

      {/* Add Series Form */}
      <div className="bg-card rounded-lg p-4 border border-border">
        <h2 className="text-sm font-semibold text-foreground mb-3">Add New Series</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Title *</label>
              <input type="text" placeholder="Series title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className={inputCls} required />
            </div>
            <div>
              <label className={labelCls}>Category *</label>
              <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className={inputCls}>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
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
            <textarea placeholder="Series description..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className={`${inputCls} min-h-[50px]`} />
          </div>

          {/* Episodes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-semibold text-foreground">Episodes ({episodes.length})</label>
              <button type="button" onClick={addEpisodeToForm} className="flex items-center gap-1 px-2 py-1 text-[10px] bg-green-600 text-white rounded hover:bg-green-700 font-medium">
                <Plus className="w-2.5 h-2.5" /> Add Episode
              </button>
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {episodes.map((ep, i) => (
                <EpisodeRow key={i} ep={ep} index={i} onUpdate={updateFormEpisode} onRemove={removeFormEpisode} />
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full py-2 text-xs bg-primary text-primary-foreground rounded font-medium hover:bg-primary/90 disabled:opacity-50">
            {loading ? 'Adding...' : 'Add Series'}
          </button>
        </form>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input type="text" placeholder="Search series..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`${inputCls} pl-8`} />
      </div>

      {/* Edit Modal */}
      {editingSeries && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setEditingSeries(null)}>
          <div className="bg-card border border-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-foreground">Edit Series: {editingSeries.title}</h2>
              <button onClick={() => setEditingSeries(null)} className="p-1 text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Title</label>
                  <input type="text" value={editForm.title || ''} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Category</label>
                  <select value={editForm.category || ''} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} className={inputCls}>
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Poster URL</label>
                  <input type="url" value={editForm.poster_url || ''} onChange={(e) => setEditForm({ ...editForm, poster_url: e.target.value })} className={inputCls} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelCls}>Rating</label>
                    <input type="number" step="0.1" min="0" max="10" value={editForm.rating || ''} onChange={(e) => setEditForm({ ...editForm, rating: Number(e.target.value) })} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Year</label>
                    <input type="number" value={editForm.year || ''} onChange={(e) => setEditForm({ ...editForm, year: Number(e.target.value) })} className={inputCls} />
                  </div>
                </div>
              </div>
              <div>
                <label className={labelCls}>Description</label>
                <textarea value={editForm.description || ''} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className={`${inputCls} min-h-[50px]`} />
              </div>

              {/* Edit Episodes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-semibold text-foreground">Episodes ({editEpisodes.length})</label>
                  <button type="button" onClick={addEditEpisode} className="flex items-center gap-1 px-2 py-1 text-[10px] bg-green-600 text-white rounded hover:bg-green-700 font-medium">
                    <Plus className="w-2.5 h-2.5" /> Add Episode
                  </button>
                </div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {editEpisodes.map((ep, i) => (
                    <EpisodeRow key={i} ep={ep} index={i} onUpdate={updateEditEpisode} onRemove={removeEditEpisode} />
                  ))}
                  {editEpisodes.length === 0 && (
                    <p className="text-center text-[10px] text-muted-foreground py-3">No episodes. Click &quot;Add Episode&quot; to add one.</p>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button onClick={handleEditSave} disabled={editLoading} className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded font-medium hover:bg-primary/90 disabled:opacity-50">
                  <Save className="w-3 h-3" /> {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button onClick={() => setEditingSeries(null)} className="px-3 py-1.5 text-xs bg-muted text-foreground rounded">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Series List */}
      <div className="space-y-2">
        {filtered.map((s) => {
          const isExpanded = expandedId === s.id
          const epCount = s.episodes?.length || 0
          return (
            <div key={s.id} className="bg-card rounded-lg border border-border overflow-hidden">
              {/* Series header row */}
              <div className="flex items-center gap-2.5 p-2.5">
                <div className="w-12 h-16 rounded overflow-hidden bg-muted flex-shrink-0">
                  <img src={s.poster_url || '/placeholder.svg?height=64&width=48'} alt={s.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{s.title}</p>
                  <p className="text-[10px] text-muted-foreground">{s.year} &middot; {s.category} &middot; {epCount} episode{epCount !== 1 ? 's' : ''}</p>
                  {s.description && <p className="text-[9px] text-muted-foreground truncate mt-0.5">{s.description}</p>}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => openEdit(s)} className="p-1.5 bg-blue-500/15 text-blue-500 rounded hover:bg-blue-500/25 transition-colors" title="Edit">
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button onClick={() => handleDelete(s.id)} className="p-1.5 bg-red-500/15 text-red-500 rounded hover:bg-red-500/25 transition-colors" title="Delete">
                    <Trash2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : s.id)}
                    className="p-1.5 bg-muted text-foreground rounded hover:bg-muted/80 transition-colors"
                    title={isExpanded ? 'Collapse' : 'Show episodes'}
                  >
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              {/* Expanded episodes */}
              {isExpanded && (
                <div className="border-t border-border bg-muted/30 p-2.5">
                  {epCount > 0 ? (
                    <div className="space-y-1">
                      <p className="text-[10px] font-semibold text-foreground mb-1.5">Episodes</p>
                      {s.episodes!.map((ep, i) => (
                        <div key={i} className="flex items-center gap-2 bg-background rounded p-1.5 border border-border">
                          <div className="w-7 h-7 rounded bg-primary/15 flex items-center justify-center flex-shrink-0">
                            <Play className="w-3 h-3 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-medium text-foreground truncate">
                              S{ep.season} E{ep.episode_number}: {ep.title || 'Untitled'}
                            </p>
                            {ep.stream_url && (
                              <p className="text-[9px] text-muted-foreground truncate">{ep.stream_url.substring(0, 50)}...</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-[10px] text-muted-foreground py-2">No episodes yet. Click edit to add episodes.</p>
                  )}
                  <button onClick={() => openEdit(s)} className="mt-2 w-full flex items-center justify-center gap-1 px-2 py-1.5 text-[10px] bg-primary/15 text-primary rounded font-medium hover:bg-primary/25 transition-colors">
                    <Pencil className="w-2.5 h-2.5" /> Edit Series & Episodes
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">
          {searchTerm ? `No series found for "${searchTerm}"` : 'No series yet. Add your first series above.'}
        </p>
      )}
    </div>
  )
}
