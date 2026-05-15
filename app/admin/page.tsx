'use client'



import type React from 'react'
import { useContext, useEffect, useState } from 'react'
import {
  Users, Film, Tv, Star, Music, ImageIcon, Sparkles, Wallet,
  Trash2, TrendingUp, Plus, DollarSign, CreditCard, User,
  ArrowDownCircle, Clock, CheckCircle, XCircle, Phone,
  Crown, ArrowUpCircle, ArrowDown, Power, PowerOff, Search, ChevronDown,
  Edit3, X, GripVertical, BarChart3,
} from 'lucide-react'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc, addDoc, getDocs, setDoc, getDoc, Timestamp } from 'firebase/firestore'
import { useAuth } from '@/lib/auth-context'
import {
  addMovie, deleteMovie, updateMovie,
  addSeries, deleteSeries,
  addOriginal, deleteOriginal, updateOriginal,
  addAnimation, deleteAnimation, updateAnimation,
  addMusicVideo, deleteMusicVideo, updateMusicVideo,
} from '@/lib/firebase-utils'
import { AdminViewContext } from './layout'
import {
  getWalletBalance as fetchRealBalance,
  getTransactions as fetchRealTransactions,
  sendPayment,
  isValidUgandaPhone,
  formatPhoneToInternational,
} from '@/lib/payment-api'

/* ───── shared compact input classes ───── */
const inputCls = 'w-full px-2 py-1 text-xs bg-muted border border-border rounded text-foreground placeholder:text-muted-foreground'
const labelCls = 'block text-[11px] text-foreground mb-0.5'
const btnCls = 'w-full py-1.5 text-xs bg-primary text-primary-foreground rounded font-medium hover:bg-primary/90 transition-colors disabled:opacity-50'

/* ═══════════════════════════════════════════
   DASHBOARD VIEW
   ═══════════════════════════════════════════ */
function DashboardView({ onNav }: { onNav: (v: string) => void }) {
  const { user } = useAuth()
  const [stats, setStats] = useState({ users: 0, movies: 0, series: 0, originals: 0, animations: 0, music: 0, carousel: 0 })

  useEffect(() => {
    const cols = [
      { name: 'users', key: 'users' }, { name: 'movies', key: 'movies' }, { name: 'series', key: 'series' },
      { name: 'originals', key: 'originals' }, { name: 'animations', key: 'animations' },
      { name: 'music_videos', key: 'music' }, { name: 'carousel', key: 'carousel' },
    ] as const
    const unsubs = cols.map(({ name, key }) =>
      onSnapshot(collection(db, name), (s) => setStats((p) => ({ ...p, [key]: s.size })), () => {})
    )
    return () => unsubs.forEach((u) => u())
  }, [])

  const cards = [
    { icon: Users, label: 'Users', value: stats.users, color: 'text-cyan-500', view: 'users' },
    { icon: Film, label: 'Movies', value: stats.movies, color: 'text-red-500', view: 'movies' },
    { icon: Tv, label: 'Series', value: stats.series, color: 'text-green-500', view: 'series' },
    { icon: Star, label: 'Originals', value: stats.originals, color: 'text-yellow-500', view: 'originals' },
    { icon: Sparkles, label: 'Animation', value: stats.animations, color: 'text-orange-500', view: 'animation' },
    { icon: Music, label: 'Music', value: stats.music, color: 'text-pink-500', view: 'music' },
    { icon: ImageIcon, label: 'Carousel', value: stats.carousel, color: 'text-blue-500', view: 'carousel' },
  ]

  return (
    <div className="space-y-2">
      <div>
        <h1 className="text-sm font-bold text-foreground">Dashboard</h1>
        <p className="text-[9px] text-muted-foreground">{user?.email || 'admin'}</p>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {cards.map((c) => (
          <button key={c.label} onClick={() => onNav(c.view)} className="bg-card rounded p-1.5 border border-border text-left hover:border-primary/50 transition-colors">
            <c.icon className={`w-3 h-3 ${c.color} mb-0.5`} />
            <p className="text-sm font-bold text-foreground">{c.value}</p>
            <p className="text-[9px] text-muted-foreground">{c.label}</p>
          </button>
        ))}
      </div>
      {/* Manage Content Section */}
      <div>
        <h2 className="text-xs font-bold text-foreground mb-1.5">Manage Content</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <a href="/admin/movies" className="bg-card rounded p-2 border border-border flex items-center gap-2 hover:border-primary/50 transition-colors">
            <Film className="w-3.5 h-3.5 text-red-500" />
            <div className="text-left">
              <p className="text-xs font-medium text-foreground">Manage Movies</p>
              <p className="text-[9px] text-muted-foreground">Add, edit, update & delete movies</p>
            </div>
          </a>
          <a href="/admin/series" className="bg-card rounded p-2 border border-border flex items-center gap-2 hover:border-primary/50 transition-colors">
            <Tv className="w-3.5 h-3.5 text-green-500" />
            <div className="text-left">
              <p className="text-xs font-medium text-foreground">Manage Series</p>
              <p className="text-[9px] text-muted-foreground">Add, edit series & manage episodes</p>
            </div>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <button onClick={() => onNav('subscriptions')} className="bg-card rounded p-2 border border-border flex items-center gap-2 hover:border-primary/50 transition-colors">
          <Crown className="w-3.5 h-3.5 text-yellow-500" />
          <div className="text-left">
            <p className="text-xs font-medium text-foreground">Subscription Management</p>
            <p className="text-[9px] text-muted-foreground">Activate, deactivate, upgrade user plans</p>
          </div>
        </button>
        <button onClick={() => onNav('wallet')} className="bg-card rounded p-2 border border-border flex items-center gap-2 hover:border-primary/50 transition-colors">
          <Wallet className="w-3.5 h-3.5 text-green-500" />
          <div className="text-left">
            <p className="text-xs font-medium text-foreground">Wallet & Revenue</p>
            <p className="text-[9px] text-muted-foreground">Manage withdrawals and view earnings</p>
          </div>
        </button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   MOVIES VIEW - Redirects to full manage page
   ═══════════════════════════════════════════ */
function MoviesView() {
  useEffect(() => { window.location.href = '/admin/movies' }, [])
  return (
    <div className="flex items-center justify-center py-12">
      <p className="text-sm text-muted-foreground">Redirecting to Manage Movies...</p>
    </div>
  )
}

/* ═══════════════════════════════════════════
   SERIES VIEW - Redirects to full manage page
   ═══════════════════════════════════════════ */
function SeriesView() {
  useEffect(() => { window.location.href = '/admin/series' }, [])
  return (
    <div className="flex items-center justify-center py-12">
      <p className="text-sm text-muted-foreground">Redirecting to Manage Series...</p>
    </div>
  )
}

/* ═══════════════════════������═══════════════════
   GENERIC CONTENT VIEW (Originals / Animation)
   Full CRUD with search, edit, description
   ═══════════════════════════════════════════ */
function GenericContentView({ collectionName, icon: Icon, title, addFn, deleteFn, updateFn, options }: {
  collectionName: string, icon: any, title: string, addFn: (d: any) => Promise<string>, deleteFn: (id: string) => Promise<void>, updateFn: (id: string, d: any) => Promise<void>, options: string[]
}) {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [editItem, setEditItem] = useState<any | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  const categoryField = collectionName === 'animations' ? 'genre' : 'category'
  const [form, setForm] = useState({ title: '', category: options[0], stream_url: '', rating: '7.5', year: '2026', poster_url: '', description: '' })

  useEffect(() => {
    const q = query(collection(db, collectionName), orderBy('created_at', 'desc'))
    return onSnapshot(q, (s) => setItems(s.docs.map((d) => ({ id: d.id, ...d.data() }))))
  }, [collectionName])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    try {
      await addFn({ title: form.title, [categoryField]: form.category, stream_url: form.stream_url, rating: +form.rating, year: +form.year, poster_url: form.poster_url, description: form.description })
      setForm({ title: '', category: options[0], stream_url: '', rating: '7.5', year: '2026', poster_url: '', description: '' })
    } catch {}
    setLoading(false)
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editItem) return
    setEditLoading(true)
    try {
      await updateFn(editItem.id, {
        title: editItem.title,
        [categoryField]: editItem[categoryField] || editItem.category,
        stream_url: editItem.stream_url || '',
        rating: +editItem.rating || 7.5,
        year: +editItem.year || 2026,
        poster_url: editItem.poster_url || '',
        description: editItem.description || '',
      })
      setEditItem(null)
    } catch {}
    setEditLoading(false)
  }

  const filtered = items.filter((it) =>
    !searchTerm.trim() ||
    it.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    it[categoryField]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    it.category?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-sm font-bold text-foreground flex items-center gap-1"><Icon className="w-4 h-4" /> {title} ({items.length})</h1>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input type="text" placeholder={`Search ${title.toLowerCase()}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`${inputCls} pl-7`} />
      </div>

      {/* Add Form */}
      <div className="bg-card rounded p-3 border border-border">
        <p className="text-xs font-semibold text-foreground mb-2">Add New {title.replace(/s$/, '')}</p>
        <form onSubmit={submit} className="space-y-2">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <div><label className={labelCls}>Title *</label><input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
            <div><label className={labelCls}>{collectionName === 'animations' ? 'Genre' : 'Category'}</label><select className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{options.map(c => <option key={c}>{c}</option>)}</select></div>
            <div><label className={labelCls}>Stream URL (Google Drive)</label><input className={inputCls} value={form.stream_url} onChange={(e) => setForm({ ...form, stream_url: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div><label className={labelCls}>Rating</label><input type="number" step="0.1" min="0" max="10" className={inputCls} value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} /></div>
            <div><label className={labelCls}>Year</label><input type="number" className={inputCls} value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} /></div>
            <div><label className={labelCls}>Poster URL</label><input className={inputCls} value={form.poster_url} onChange={(e) => setForm({ ...form, poster_url: e.target.value })} /></div>
          </div>
          <div><label className={labelCls}>Description</label><textarea className={`${inputCls} min-h-[50px]`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description..." /></div>
          <button type="submit" disabled={loading} className={btnCls}>{loading ? 'Adding...' : `Add ${title.replace(/s$/, '')}`}</button>
        </form>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
        {filtered.map((it) => (
          <div key={it.id} className="relative group">
            <div className="aspect-[2/3] rounded overflow-hidden bg-muted">
              <img src={it.poster_url || '/placeholder.svg'} alt={it.title} className="w-full h-full object-cover" />
              <div className="absolute top-1 left-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setEditItem({ ...it })} className="p-1 bg-blue-500 text-white rounded"><Edit3 className="w-3 h-3" /></button>
                <button onClick={() => { if (confirm(`Delete "${it.title}"?`)) deleteFn(it.id) }} className="p-1 bg-red-500 text-white rounded"><Trash2 className="w-3 h-3" /></button>
              </div>
            </div>
            <p className="mt-1 text-[10px] font-medium text-foreground truncate">{it.title}</p>
            <p className="text-[9px] text-muted-foreground truncate">{it[categoryField] || it.category || ''}</p>
          </div>
        ))}
        {filtered.length === 0 && <p className="col-span-full text-center text-[10px] text-muted-foreground py-6">No items found</p>}
      </div>

      {/* Edit Modal */}
      {editItem && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setEditItem(null)}>
          <div className="bg-card rounded-lg border border-border p-4 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold text-foreground">Edit {title.replace(/s$/, '')}</h2>
              <button onClick={() => setEditItem(null)} className="p-1 text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleEdit} className="space-y-2">
              <div><label className={labelCls}>Title *</label><input className={inputCls} value={editItem.title || ''} onChange={(e) => setEditItem({ ...editItem, title: e.target.value })} required /></div>
              <div><label className={labelCls}>{collectionName === 'animations' ? 'Genre' : 'Category'}</label><select className={inputCls} value={editItem[categoryField] || editItem.category || options[0]} onChange={(e) => setEditItem({ ...editItem, [categoryField]: e.target.value, category: e.target.value })}>{options.map(c => <option key={c}>{c}</option>)}</select></div>
              <div><label className={labelCls}>Stream URL</label><input className={inputCls} value={editItem.stream_url || ''} onChange={(e) => setEditItem({ ...editItem, stream_url: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className={labelCls}>Rating</label><input type="number" step="0.1" min="0" max="10" className={inputCls} value={editItem.rating || ''} onChange={(e) => setEditItem({ ...editItem, rating: e.target.value })} /></div>
                <div><label className={labelCls}>Year</label><input type="number" className={inputCls} value={editItem.year || ''} onChange={(e) => setEditItem({ ...editItem, year: e.target.value })} /></div>
              </div>
              <div><label className={labelCls}>Poster URL</label><input className={inputCls} value={editItem.poster_url || ''} onChange={(e) => setEditItem({ ...editItem, poster_url: e.target.value })} /></div>
              <div><label className={labelCls}>Description</label><textarea className={`${inputCls} min-h-[60px]`} value={editItem.description || ''} onChange={(e) => setEditItem({ ...editItem, description: e.target.value })} /></div>
              {editItem.poster_url && (
                <div className="flex justify-center"><img src={editItem.poster_url} alt="Preview" className="h-20 rounded object-cover" /></div>
              )}
              <div className="flex gap-2">
                <button type="submit" disabled={editLoading} className={`flex-1 ${btnCls}`}>{editLoading ? 'Saving...' : 'Save Changes'}</button>
                <button type="button" onClick={() => setEditItem(null)} className="px-3 py-1.5 text-xs bg-muted text-foreground rounded hover:bg-muted/80">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════
   MUSIC VIEW - Full CRUD with search & edit
   ═══════════════════════════════════════════ */
function MusicView() {
  const [videos, setVideos] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [editItem, setEditItem] = useState<any | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [form, setForm] = useState({ title: '', artist: '', stream_url: '', rating: '7.5', year: '2026', thumbnail_url: '', category: 'Music', description: '' })

  useEffect(() => {
    const q = query(collection(db, 'music_videos'), orderBy('created_at', 'desc'))
    return onSnapshot(q, (s) => setVideos(s.docs.map((d) => ({ id: d.id, ...d.data() }))))
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    try {
      await addMusicVideo({ title: form.title, artist: form.artist, stream_url: form.stream_url, rating: +form.rating, year: +form.year, thumbnail_url: form.thumbnail_url, poster_url: form.thumbnail_url, category: form.category, description: form.description })
      setForm({ title: '', artist: '', stream_url: '', rating: '7.5', year: '2026', thumbnail_url: '', category: 'Music', description: '' })
    } catch {}
    setLoading(false)
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editItem) return
    setEditLoading(true)
    try {
      await updateMusicVideo(editItem.id, {
        title: editItem.title,
        artist: editItem.artist || '',
        stream_url: editItem.stream_url || '',
        rating: +editItem.rating || 7.5,
        year: +editItem.year || 2026,
        thumbnail_url: editItem.thumbnail_url || '',
        poster_url: editItem.thumbnail_url || editItem.poster_url || '',
        category: editItem.category || 'Music',
        description: editItem.description || '',
      })
      setEditItem(null)
    } catch {}
    setEditLoading(false)
  }

  const filtered = videos.filter((v) =>
    !searchTerm.trim() ||
    v.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.artist?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-3">
      <h1 className="text-sm font-bold text-foreground flex items-center gap-1"><Music className="w-4 h-4" /> Music Videos ({videos.length})</h1>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input type="text" placeholder="Search music videos..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`${inputCls} pl-7`} />
      </div>

      {/* Add Form */}
      <div className="bg-card rounded p-3 border border-border">
        <p className="text-xs font-semibold text-foreground mb-2">Add New Music Video</p>
        <form onSubmit={submit} className="space-y-2">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <div><label className={labelCls}>Title *</label><input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
            <div><label className={labelCls}>Artist</label><input className={inputCls} value={form.artist} onChange={(e) => setForm({ ...form, artist: e.target.value })} /></div>
            <div><label className={labelCls}>Stream URL (Google Drive)</label><input className={inputCls} value={form.stream_url} onChange={(e) => setForm({ ...form, stream_url: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div><label className={labelCls}>Rating</label><input type="number" step="0.1" min="0" max="10" className={inputCls} value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} /></div>
            <div><label className={labelCls}>Year</label><input type="number" className={inputCls} value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} /></div>
            <div><label className={labelCls}>Thumbnail URL</label><input className={inputCls} value={form.thumbnail_url} onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })} /></div>
            <div><label className={labelCls}>Category</label><input className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Music" /></div>
          </div>
          <div><label className={labelCls}>Description</label><textarea className={`${inputCls} min-h-[50px]`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description..." /></div>
          <button type="submit" disabled={loading} className={btnCls}>{loading ? 'Adding...' : 'Add Music Video'}</button>
        </form>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
        {filtered.map((v) => (
          <div key={v.id} className="relative group">
            <div className="aspect-video rounded overflow-hidden bg-muted">
              <img src={v.thumbnail_url || v.poster_url || '/placeholder.svg'} alt={v.title} className="w-full h-full object-cover" />
              <div className="absolute top-1 left-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setEditItem({ ...v })} className="p-1 bg-blue-500 text-white rounded"><Edit3 className="w-3 h-3" /></button>
                <button onClick={() => { if (confirm(`Delete "${v.title}"?`)) deleteMusicVideo(v.id) }} className="p-1 bg-red-500 text-white rounded"><Trash2 className="w-3 h-3" /></button>
              </div>
            </div>
            <p className="mt-1 text-[10px] font-medium text-foreground truncate">{v.title}</p>
            <p className="text-[9px] text-muted-foreground truncate">{v.artist}</p>
          </div>
        ))}
        {filtered.length === 0 && <p className="col-span-full text-center text-[10px] text-muted-foreground py-6">No music videos found</p>}
      </div>

      {/* Edit Modal */}
      {editItem && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setEditItem(null)}>
          <div className="bg-card rounded-lg border border-border p-4 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold text-foreground">Edit Music Video</h2>
              <button onClick={() => setEditItem(null)} className="p-1 text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleEdit} className="space-y-2">
              <div><label className={labelCls}>Title *</label><input className={inputCls} value={editItem.title || ''} onChange={(e) => setEditItem({ ...editItem, title: e.target.value })} required /></div>
              <div><label className={labelCls}>Artist</label><input className={inputCls} value={editItem.artist || ''} onChange={(e) => setEditItem({ ...editItem, artist: e.target.value })} /></div>
              <div><label className={labelCls}>Stream URL</label><input className={inputCls} value={editItem.stream_url || ''} onChange={(e) => setEditItem({ ...editItem, stream_url: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className={labelCls}>Rating</label><input type="number" step="0.1" min="0" max="10" className={inputCls} value={editItem.rating || ''} onChange={(e) => setEditItem({ ...editItem, rating: e.target.value })} /></div>
                <div><label className={labelCls}>Year</label><input type="number" className={inputCls} value={editItem.year || ''} onChange={(e) => setEditItem({ ...editItem, year: e.target.value })} /></div>
              </div>
              <div><label className={labelCls}>Thumbnail URL</label><input className={inputCls} value={editItem.thumbnail_url || ''} onChange={(e) => setEditItem({ ...editItem, thumbnail_url: e.target.value })} /></div>
              <div><label className={labelCls}>Category</label><input className={inputCls} value={editItem.category || ''} onChange={(e) => setEditItem({ ...editItem, category: e.target.value })} /></div>
              <div><label className={labelCls}>Description</label><textarea className={`${inputCls} min-h-[60px]`} value={editItem.description || ''} onChange={(e) => setEditItem({ ...editItem, description: e.target.value })} /></div>
              {(editItem.thumbnail_url || editItem.poster_url) && (
                <div className="flex justify-center"><img src={editItem.thumbnail_url || editItem.poster_url} alt="Preview" className="h-16 rounded object-cover" /></div>
              )}
              <div className="flex gap-2">
                <button type="submit" disabled={editLoading} className={`flex-1 ${btnCls}`}>{editLoading ? 'Saving...' : 'Save Changes'}</button>
                <button type="button" onClick={() => setEditItem(null)} className="px-3 py-1.5 text-xs bg-muted text-foreground rounded hover:bg-muted/80">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════
   USERS VIEW
   ═══════════════════════════════════════════ */
const SUPER_ADMIN_EMAIL = 'vjoneflex02@gmail.com'
type ActivationPlan = 'none' | '1-day' | '2-days' | '1-week' | '2-weeks' | '1-month'

function UsersView() {
  const { user } = useAuth()
  const [users, setUsers] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [, setTick] = useState(0) // Force re-render for countdown timer
  const [showAddUser, setShowAddUser] = useState(false)
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserName, setNewUserName] = useState('')
  const [addingUser, setAddingUser] = useState(false)
  
  // Only vjoneflex02@gmail.com can activate/deactivate users
  const canManageUsers = user?.email === SUPER_ADMIN_EMAIL

  // Add user manually (for old users not in Firestore)
  const handleAddUser = async () => {
    if (!newUserEmail.trim()) {
      alert('Please enter an email address')
      return
    }
    setAddingUser(true)
    try {
      // Create a simple user ID from email
      const odNumber = (email: string) => {
        let hash = 0
        for (let i = 0; i < email.length; i++) {
          const chr = email.charCodeAt(i)
          hash = ((hash << 5) - hash) + chr
          hash |= 0
        }
        return Math.abs(hash).toString(36)
      }
      const odId = `manual_${odNumber(newUserEmail.toLowerCase())}`
      
      await setDoc(doc(db, 'users', odId), {
        uid: odId,
        email: newUserEmail.trim().toLowerCase(),
        displayName: newUserName.trim() || null,
        photoURL: null,
        provider: 'manual',
        created_at: new Date(),
        last_login: null,
        isActive: false,
        activationPlan: 'none',
        activationExpiry: null,
      })
      
      alert('User added successfully')
      setNewUserEmail('')
      setNewUserName('')
      setShowAddUser(false)
    } catch (error: any) {
      alert('Error adding user: ' + (error?.message || 'Unknown error'))
    } finally {
      setAddingUser(false)
    }
  }

  // Helper to check if user is currently active
  const isUserActive = (u: any): boolean => {
    if (!u.isActive || u.activationPlan === 'none') return false
    if (!u.activationExpiry) return u.isActive
    let expiry: Date | null = null
    if (u.activationExpiry?.toDate) expiry = u.activationExpiry.toDate()
    else if (u.activationExpiry?.seconds) expiry = new Date(u.activationExpiry.seconds * 1000)
    else expiry = new Date(u.activationExpiry)
    return expiry ? new Date() < expiry : false
  }

  useEffect(() => {
    // Fetch all users without orderBy to include users without created_at field
    const usersRef = collection(db, 'users')
    return onSnapshot(usersRef, (s) => {
      const allUsers = s.docs.map((d) => ({ id: d.id, ...d.data() }))
      // Sort: active users first, then by email
      allUsers.sort((a, b) => {
        const aActive = isUserActive(a)
        const bActive = isUserActive(b)
        if (aActive && !bActive) return -1
        if (!aActive && bActive) return 1
        return (a.email || '').localeCompare(b.email || '')
      })
      setUsers(allUsers)
    })
  }, [])

  // Update countdown every second
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase()
    return (
      u.email?.toLowerCase().includes(term) ||
      u.displayName?.toLowerCase().includes(term)
    )
  })

  // Calculate stats using the isUserActive helper
  const totalUsers = users.length
  const activeCount = users.filter(isUserActive).length
  const inactiveCount = totalUsers - activeCount

  const formatDate = (ts: any): string => {
    if (!ts) return 'Never'
    try {
      if (ts.toDate) return ts.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric' })
      if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric' })
      const date = new Date(ts)
      if (!isNaN(date.getTime())) return date.toLocaleDateString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric' })
      return 'Never'
    } catch {
      return 'Never'
    }
  }

  // Format remaining time as countdown
  const getTimeRemaining = (expiry: any): { text: string; isExpired: boolean; color: string } => {
    if (!expiry) return { text: 'No expiry', isExpired: true, color: 'text-gray-400' }
    
    try {
      // Parse Firestore Timestamp or Date
      let expiryDate: Date | null = null
      if (expiry.toDate && typeof expiry.toDate === 'function') {
        expiryDate = expiry.toDate()
      } else if (expiry.seconds) {
        expiryDate = new Date(expiry.seconds * 1000)
      } else if (expiry instanceof Date) {
        expiryDate = expiry
      } else {
        expiryDate = new Date(expiry)
      }
      
      if (!expiryDate || isNaN(expiryDate.getTime())) {
        return { text: 'Invalid', isExpired: true, color: 'text-gray-400' }
      }
      
      const now = new Date()
      const diff = expiryDate.getTime() - now.getTime()
      
      if (diff <= 0) return { text: 'Expired', isExpired: true, color: 'text-red-400' }
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      
      if (days > 0) {
        return { text: `${days}d ${hours}h ${minutes}m`, isExpired: false, color: 'text-green-400' }
      } else if (hours > 0) {
        return { text: `${hours}h ${minutes}m ${seconds}s`, isExpired: false, color: 'text-yellow-400' }
      } else {
        return { text: `${minutes}m ${seconds}s`, isExpired: false, color: 'text-orange-400' }
      }
    } catch {
      return { text: 'Invalid', isExpired: true, color: 'text-gray-400' }
    }
  }

  const getUserStatus = (u: any): { label: string; color: string; bgColor: string } => {
    if (!u.isActive || u.activationPlan === 'none') {
      return { label: 'Inactive', color: 'text-red-400', bgColor: 'bg-red-500/20' }
    }
    const timeInfo = getTimeRemaining(u.activationExpiry)
    if (timeInfo.isExpired) {
      return { label: 'Expired', color: 'text-red-400', bgColor: 'bg-red-500/20' }
    }
    return { label: 'Active', color: 'text-green-400', bgColor: 'bg-green-500/20' }
  }

  const handleSetActivation = async (userId: string, plan: ActivationPlan) => {
    if (!canManageUsers) {
      alert('You are not authorized to manage users')
      return
    }
    
    try {
      const userRef = doc(db, 'users', userId)
      
      if (plan === 'none') {
        await updateDoc(userRef, {
          isActive: false,
          activationExpiry: null,
          activationPlan: 'none',
        })
        alert('User deactivated successfully')
      } else {
        const now = Date.now()
        let expiryMs: number
        
        switch (plan) {
          case '1-day': expiryMs = now + 1 * 24 * 60 * 60 * 1000; break
          case '2-days': expiryMs = now + 2 * 24 * 60 * 60 * 1000; break
          case '1-week': expiryMs = now + 7 * 24 * 60 * 60 * 1000; break
          case '2-weeks': expiryMs = now + 14 * 24 * 60 * 60 * 1000; break
          case '1-month': expiryMs = now + 30 * 24 * 60 * 60 * 1000; break
          default: return
        }
        
        // Use Firestore Timestamp for proper storage and retrieval
        const expiryTimestamp = Timestamp.fromMillis(expiryMs)
        
        await updateDoc(userRef, {
          isActive: true,
          activationExpiry: expiryTimestamp,
          activationPlan: plan,
        })
        alert(`User activated for ${plan}`)
      }
    } catch (error: any) {
      console.error('Error updating user activation:', error)
      alert('Error: ' + (error?.message || 'Failed to update user'))
    }
  }

  const handleDelete = async (id: string) => {
    if (!canManageUsers) return
    if (!confirm('Are you sure you want to delete this user record?')) return
    try {
      await deleteDoc(doc(db, 'users', id))
    } catch (error) {
      console.error('Error deleting user:', error)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-sm font-bold text-foreground flex items-center gap-1">
        <Users className="w-4 h-4" /> Users ({users.length})
      </h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#1a1a2e] border border-[#2a2a4e] rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-white">{totalUsers}</p>
          <p className="text-xs text-gray-400">Total Users</p>
        </div>
        <div className="bg-[#1a1a2e] border border-green-500/30 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-green-400">{activeCount}</p>
          <p className="text-xs text-gray-400">Active</p>
        </div>
        <div className="bg-[#1a1a2e] border border-red-500/30 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-red-400">{inactiveCount}</p>
          <p className="text-xs text-gray-400">Inactive</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`${inputCls} pl-7`}
        />
      </div>

      {/* Users List */}
      <div className="space-y-3">
        {filteredUsers.map((u) => {
          const status = getUserStatus(u)
          const timeRemaining = u.isActive && u.activationExpiry ? getTimeRemaining(u.activationExpiry) : null
          
          return (
          <div 
            key={u.id} 
            className="bg-[#1a1a2e] border border-[#2a2a4e] rounded-xl p-4"
          >
            <div className="flex flex-col lg:flex-row lg:items-start gap-4">
              {/* User Info - Left Side */}
              <div className="flex-1">
                {/* Avatar and Name */}
                <div className="flex items-center gap-3 mb-3">
                  {u.photoURL ? (
                    <img
                      src={u.photoURL}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover border-2 border-blue-500"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                      {(u.displayName || u.email || '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-semibold text-sm">
                        {u.displayName || 'Unknown User'}
                      </h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${status.bgColor} ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <p className="text-blue-400 text-xs">{u.email}</p>
                  </div>
                </div>
                
                {/* Created, Last Login, and Timer */}
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs">
                  <div>
                    <span className="text-gray-500">Created</span>
                    <p className="text-gray-300">{formatDate(u.created_at)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Last Login</span>
                    <p className="text-gray-300">{formatDate(u.last_login)}</p>
                  </div>
                  {u.activationPlan && u.activationPlan !== 'none' && (
                    <div>
                      <span className="text-gray-500">Plan</span>
                      <p className="text-purple-400 capitalize">{u.activationPlan}</p>
                    </div>
                  )}
                  {timeRemaining && (
                    <div>
                      <span className="text-gray-500">Time Left</span>
                      <p className={`font-mono font-bold ${timeRemaining.color}`}>{timeRemaining.text}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Activation Buttons - Right Side - Only for Super Admin */}
              {canManageUsers && (
                <div className="flex flex-wrap lg:flex-col gap-2 min-w-[100px]">
                  {/* None Button - Red Outline */}
                  <button
                    type="button"
                    onClick={() => handleSetActivation(u.id, 'none')}
                    className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      u.activationPlan === 'none' || !u.isActive
                        ? 'bg-red-500 text-white'
                        : 'border border-red-500 text-red-500 hover:bg-red-500/10'
                    }`}
                  >
                    <Power className="w-3 h-3" />
                    None
                  </button>
                  
                  {/* 1-Day Button - Green */}
                  <button
                    type="button"
                    onClick={() => handleSetActivation(u.id, '1-day')}
                    className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      u.activationPlan === '1-day' && u.isActive
                        ? 'bg-green-400 text-white ring-2 ring-green-300'
                        : 'bg-green-500 text-white hover:bg-green-400'
                    }`}
                  >
                    <Power className="w-3 h-3" />
                    1-Day
                  </button>
                  
                  {/* 2-Days Button - Blue */}
                  <button
                    type="button"
                    onClick={() => handleSetActivation(u.id, '2-days')}
                    className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      u.activationPlan === '2-days' && u.isActive
                        ? 'bg-blue-400 text-white ring-2 ring-blue-300'
                        : 'bg-blue-500 text-white hover:bg-blue-400'
                    }`}
                  >
                    <Power className="w-3 h-3" />
                    2-Days
                  </button>
                  
                  {/* 1-Week Button - Blue */}
                  <button
                    type="button"
                    onClick={() => handleSetActivation(u.id, '1-week')}
                    className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      u.activationPlan === '1-week' && u.isActive
                        ? 'bg-blue-400 text-white ring-2 ring-blue-300'
                        : 'bg-blue-600 text-white hover:bg-blue-500'
                    }`}
                  >
                    <Power className="w-3 h-3" />
                    1-Week
                  </button>
                  
                  {/* 2-Weeks Button - Purple */}
                  <button
                    type="button"
                    onClick={() => handleSetActivation(u.id, '2-weeks')}
                    className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      u.activationPlan === '2-weeks' && u.isActive
                        ? 'bg-purple-400 text-white ring-2 ring-purple-300'
                        : 'bg-purple-500 text-white hover:bg-purple-400'
                    }`}
                  >
                    <Power className="w-3 h-3" />
                    2-Weeks
                  </button>
                  
                  {/* 1-Month Button - Pink */}
                  <button
                    type="button"
                    onClick={() => handleSetActivation(u.id, '1-month')}
                    className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      u.activationPlan === '1-month' && u.isActive
                        ? 'bg-pink-400 text-white ring-2 ring-pink-300'
                        : 'bg-pink-500 text-white hover:bg-pink-400'
                    }`}
                  >
                    <Power className="w-3 h-3" />
                    1-Month
                  </button>
                </div>
              )}
            </div>
          </div>
        )})}
        
        
        {filteredUsers.length === 0 && (
          <div className="bg-[#1a1a2e] border border-[#2a2a4e] rounded-xl p-6 text-center text-gray-400 text-xs">
            {searchTerm ? 'No users match your search' : 'No users found. Users will appear here once they log in.'}
          </div>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   CAROUSEL VIEW - Full CRUD with edit & reorder
   ═══════════════════════════════════════════ */
function CarouselView() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [editItem, setEditItem] = useState<any | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [form, setForm] = useState({ title: '', subtitle: '', banner_url: '', link_type: 'none', link_id: '', order: '0' })

  useEffect(() => {
    const q = query(collection(db, 'carousel'), orderBy('created_at', 'desc'))
    return onSnapshot(q, (s) => setItems(s.docs.map((d) => ({ id: d.id, ...d.data() }))))
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    try {
      await addDoc(collection(db, 'carousel'), { ...form, order: +form.order || items.length, created_at: new Date() })
      setForm({ title: '', subtitle: '', banner_url: '', link_type: 'none', link_id: '', order: '0' })
    } catch {}
    setLoading(false)
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editItem) return
    setEditLoading(true)
    try {
      await updateDoc(doc(db, 'carousel', editItem.id), {
        title: editItem.title,
        subtitle: editItem.subtitle || '',
        banner_url: editItem.banner_url || '',
        link_type: editItem.link_type || 'none',
        link_id: editItem.link_id || '',
        order: +editItem.order || 0,
      })
      setEditItem(null)
    } catch {}
    setEditLoading(false)
  }

  const moveItem = async (item: any, direction: 'up' | 'down') => {
    const idx = items.findIndex((it) => it.id === item.id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= items.length) return
    try {
      await updateDoc(doc(db, 'carousel', item.id), { order: swapIdx })
      await updateDoc(doc(db, 'carousel', items[swapIdx].id), { order: idx })
    } catch {}
  }

  return (
    <div className="space-y-3">
      <h1 className="text-sm font-bold text-foreground flex items-center gap-1"><ImageIcon className="w-4 h-4" /> Carousel ({items.length})</h1>

      {/* Add Form */}
      <div className="bg-card rounded p-3 border border-border">
        <p className="text-xs font-semibold text-foreground mb-2">Add New Carousel Item</p>
        <form onSubmit={submit} className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div><label className={labelCls}>Title *</label><input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
            <div><label className={labelCls}>Subtitle</label><input className={inputCls} value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} /></div>
          </div>
          <div><label className={labelCls}>Banner Image URL *</label><input className={inputCls} value={form.banner_url} onChange={(e) => setForm({ ...form, banner_url: e.target.value })} required /></div>
          <div className="grid grid-cols-3 gap-2">
            <div><label className={labelCls}>Link Type</label><select className={inputCls} value={form.link_type} onChange={(e) => setForm({ ...form, link_type: e.target.value })}><option value="none">None</option><option value="movie">Movie</option><option value="series">Series</option><option value="original">Original</option></select></div>
            <div><label className={labelCls}>Link ID</label><input className={inputCls} value={form.link_id} onChange={(e) => setForm({ ...form, link_id: e.target.value })} placeholder="Content ID (optional)" /></div>
            <div><label className={labelCls}>Order</label><input type="number" className={inputCls} value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} /></div>
          </div>
          <button type="submit" disabled={loading} className={btnCls}>{loading ? 'Adding...' : 'Add Carousel Item'}</button>
        </form>
      </div>

      {/* Items List */}
      <div className="space-y-2">
        {items.map((it, idx) => (
          <div key={it.id} className="flex items-center gap-2 bg-card rounded p-2 border border-border">
            <div className="flex flex-col gap-0.5 flex-shrink-0">
              <button onClick={() => moveItem(it, 'up')} disabled={idx === 0} className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"><ArrowUpCircle className="w-3 h-3" /></button>
              <button onClick={() => moveItem(it, 'down')} disabled={idx === items.length - 1} className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"><ArrowDown className="w-3 h-3" /></button>
            </div>
            <div className="w-20 h-12 rounded overflow-hidden bg-muted flex-shrink-0"><img src={it.banner_url || '/placeholder.svg'} alt={it.title} className="w-full h-full object-cover" /></div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-medium text-foreground truncate">{it.title}</p>
              {it.subtitle && <p className="text-[9px] text-muted-foreground truncate">{it.subtitle}</p>}
              <p className="text-[8px] text-muted-foreground">Type: {it.link_type || 'none'} | Order: {it.order ?? idx}</p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={() => setEditItem({ ...it, order: it.order ?? idx })} className="p-1 bg-blue-500/20 text-blue-500 rounded hover:bg-blue-500/30"><Edit3 className="w-3 h-3" /></button>
              <button onClick={() => { if (confirm(`Delete "${it.title}"?`)) deleteDoc(doc(db, 'carousel', it.id)) }} className="p-1 bg-red-500/20 text-red-500 rounded hover:bg-red-500/30"><Trash2 className="w-3 h-3" /></button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-center text-[10px] text-muted-foreground py-6">No carousel items</p>}
      </div>

      {/* Edit Modal */}
      {editItem && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setEditItem(null)}>
          <div className="bg-card rounded-lg border border-border p-4 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold text-foreground">Edit Carousel Item</h2>
              <button onClick={() => setEditItem(null)} className="p-1 text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleEdit} className="space-y-2">
              <div><label className={labelCls}>Title *</label><input className={inputCls} value={editItem.title || ''} onChange={(e) => setEditItem({ ...editItem, title: e.target.value })} required /></div>
              <div><label className={labelCls}>Subtitle</label><input className={inputCls} value={editItem.subtitle || ''} onChange={(e) => setEditItem({ ...editItem, subtitle: e.target.value })} /></div>
              <div><label className={labelCls}>Banner URL *</label><input className={inputCls} value={editItem.banner_url || ''} onChange={(e) => setEditItem({ ...editItem, banner_url: e.target.value })} required /></div>
              <div className="grid grid-cols-3 gap-2">
                <div><label className={labelCls}>Link Type</label><select className={inputCls} value={editItem.link_type || 'none'} onChange={(e) => setEditItem({ ...editItem, link_type: e.target.value })}><option value="none">None</option><option value="movie">Movie</option><option value="series">Series</option><option value="original">Original</option></select></div>
                <div><label className={labelCls}>Link ID</label><input className={inputCls} value={editItem.link_id || ''} onChange={(e) => setEditItem({ ...editItem, link_id: e.target.value })} /></div>
                <div><label className={labelCls}>Order</label><input type="number" className={inputCls} value={editItem.order ?? 0} onChange={(e) => setEditItem({ ...editItem, order: e.target.value })} /></div>
              </div>
              {editItem.banner_url && (
                <div className="flex justify-center"><img src={editItem.banner_url} alt="Preview" className="h-20 rounded object-cover" /></div>
              )}
              <div className="flex gap-2">
                <button type="submit" disabled={editLoading} className={`flex-1 ${btnCls}`}>{editLoading ? 'Saving...' : 'Save Changes'}</button>
                <button type="button" onClick={() => setEditItem(null)} className="px-3 py-1.5 text-xs bg-muted text-foreground rounded hover:bg-muted/80">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════
   SUBSCRIPTIONS MANAGEMENT VIEW
   ═══════════════════════════════════════════ */
const ADMIN_PLANS = [
  { id: 'one-day', name: '1 Day', price: 3000, durationDays: 1 },
  { id: 'two-days', name: '2 Days', price: 5000, durationDays: 2 },
  { id: 'one-week', name: '1 Week', price: 10000, durationDays: 7 },
]

function SubscriptionsManagementView() {
  const [users, setUsers] = useState<any[]>([])
  const [subscriptions, setSubMap] = useState<Map<string, any>>(new Map())
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState<any | null>(null)
  const [selectedPlan, setSelectedPlan] = useState(ADMIN_PLANS[0].id)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Load all users
  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('created_at', 'desc'))
    return onSnapshot(q, (s) => setUsers(s.docs.map((d) => ({ id: d.id, ...d.data() }))))
  }, [])

  // Load all subscriptions
  useEffect(() => {
    return onSnapshot(collection(db, 'subscriptions'), (s) => {
      const map = new Map<string, any>()
      s.docs.forEach((d) => map.set(d.id, { uid: d.id, ...d.data() }))
      setSubMap(map)
    })
  }, [])

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message })
    setTimeout(() => setFeedback(null), 4000)
  }

  const getSubStatus = (uid: string) => {
    const sub = subscriptions.get(uid)
    if (!sub) return { status: 'none', sub: null }
    const expiry = sub.expiryDate?.toDate?.() || (sub.expiryDate ? new Date(sub.expiryDate) : null)
    if (expiry && new Date() > expiry) return { status: 'expired', sub }
    if (sub.isActive && sub.status === 'active') return { status: 'active', sub }
    return { status: 'inactive', sub }
  }

  // Activate subscription for a user
  const activateUser = async (userId: string, userEmail: string, planId: string) => {
    setActionLoading(userId)
    try {
      const plan = ADMIN_PLANS.find((p) => p.id === planId)
      if (!plan) throw new Error('Plan not found')

      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + plan.durationDays)

      const subRef = doc(db, 'subscriptions', userId)
      await setDoc(subRef, {
        uid: userId,
        email: userEmail,
        planId: plan.id,
        planName: plan.name,
        amount: plan.price,
        currency: 'UGX',
        status: 'active',
        startDate: new Date(),
        expiryDate: expiryDate,
        isActive: true,
        activatedBy: 'admin',
        updated_at: new Date(),
      }, { merge: true })

      // Update user doc
      const userRef = doc(db, 'users', userId)
      await setDoc(userRef, {
        subscriptionStatus: 'active',
        subscriptionExpiryDate: expiryDate,
        subscriptionPlan: plan.id,
        updated_at: new Date(),
      }, { merge: true })

      showFeedback('success', `Activated ${plan.name} plan for ${userEmail}`)
    } catch (err) {
      showFeedback('error', 'Failed to activate subscription')
    }
    setActionLoading(null)
  }

  // Deactivate subscription
  const deactivateUser = async (userId: string, userEmail: string) => {
    setActionLoading(userId)
    try {
      const subRef = doc(db, 'subscriptions', userId)
      await setDoc(subRef, {
        status: 'inactive',
        isActive: false,
        deactivatedBy: 'admin',
        deactivatedAt: new Date(),
        updated_at: new Date(),
      }, { merge: true })

      const userRef = doc(db, 'users', userId)
      await setDoc(userRef, {
        subscriptionStatus: 'inactive',
        updated_at: new Date(),
      }, { merge: true })

      showFeedback('success', `Deactivated subscription for ${userEmail}`)
    } catch {
      showFeedback('error', 'Failed to deactivate subscription')
    }
    setActionLoading(null)
  }

  // Upgrade/Downgrade - change to a different plan
  const changePlan = async (userId: string, userEmail: string, newPlanId: string) => {
    setActionLoading(userId)
    try {
      const plan = ADMIN_PLANS.find((p) => p.id === newPlanId)
      if (!plan) throw new Error('Plan not found')

      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + plan.durationDays)

      const subRef = doc(db, 'subscriptions', userId)
      await setDoc(subRef, {
        uid: userId,
        email: userEmail,
        planId: plan.id,
        planName: plan.name,
        amount: plan.price,
        currency: 'UGX',
        status: 'active',
        startDate: new Date(),
        expiryDate: expiryDate,
        isActive: true,
        changedBy: 'admin',
        updated_at: new Date(),
      }, { merge: true })

      const userRef = doc(db, 'users', userId)
      await setDoc(userRef, {
        subscriptionStatus: 'active',
        subscriptionExpiryDate: expiryDate,
        subscriptionPlan: plan.id,
        updated_at: new Date(),
      }, { merge: true })

      showFeedback('success', `Changed ${userEmail} to ${plan.name} plan`)
    } catch {
      showFeedback('error', 'Failed to change plan')
    }
    setActionLoading(null)
  }

  const filteredUsers = users.filter((u) =>
    !searchTerm.trim() ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const fmtDate = (d: any) => {
    if (!d) return '-'
    const dt = d?.toDate?.() || new Date(d)
    return dt.toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-sm font-bold text-foreground flex items-center gap-1">
          <Crown className="w-4 h-4 text-yellow-500" /> Subscription Management
        </h1>
        <p className="text-[10px] text-muted-foreground">{users.length} users</p>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`p-2 rounded text-xs font-medium ${
          feedback.type === 'success'
            ? 'bg-green-500/15 text-green-600 dark:text-green-400 border border-green-500/20'
            : 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/20'
        }`}>
          {feedback.message}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search users by email or name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`${inputCls} pl-7`}
        />
      </div>

      {/* Users with subscription info */}
      <div className="space-y-2">
        {filteredUsers.map((u) => {
          const { status, sub } = getSubStatus(u.id)
          const isLoading = actionLoading === u.id
          const isExpanded = selectedUser?.id === u.id

          return (
            <div key={u.id} className="bg-card rounded-lg border border-border overflow-hidden">
              {/* User Row */}
              <button
                onClick={() => setSelectedUser(isExpanded ? null : u)}
                className="w-full flex items-center gap-2 p-2.5 text-left hover:bg-muted/50 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold flex-shrink-0">
                  {u.displayName?.charAt(0)?.toUpperCase() || u.email?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-foreground truncate">{u.email}</p>
                  <p className="text-[9px] text-muted-foreground">{u.displayName || 'No name'}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                    status === 'active' ? 'bg-green-500/15 text-green-600 dark:text-green-400' :
                    status === 'expired' ? 'bg-red-500/15 text-red-600 dark:text-red-400' :
                    status === 'inactive' ? 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {status === 'active' ? `${sub?.planName || 'Active'}` :
                     status === 'expired' ? 'Expired' :
                     status === 'inactive' ? 'Inactive' : 'No Plan'}
                  </span>
                  <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {/* Expanded Actions */}
              {isExpanded && (
                <div className="border-t border-border p-2.5 bg-muted/30 space-y-2">
                  {/* Current sub info */}
                  {sub && (
                    <div className="bg-background rounded p-2 border border-border">
                      <div className="grid grid-cols-2 gap-1 text-[10px]">
                        <div><span className="text-muted-foreground">Plan:</span> <span className="text-foreground font-medium">{sub.planName || '-'}</span></div>
                        <div><span className="text-muted-foreground">Amount:</span> <span className="text-foreground font-medium">UGX {(sub.amount || 0).toLocaleString()}</span></div>
                        <div><span className="text-muted-foreground">Start:</span> <span className="text-foreground">{fmtDate(sub.startDate)}</span></div>
                        <div><span className="text-muted-foreground">Expiry:</span> <span className="text-foreground">{fmtDate(sub.expiryDate)}</span></div>
                        {sub.activatedBy === 'admin' && <div className="col-span-2"><span className="text-[9px] text-primary font-medium">Activated by Admin</span></div>}
                      </div>
                    </div>
                  )}

                  {/* Activate with plan selector */}
                  <div className="flex items-center gap-1.5">
                    <select
                      value={selectedPlan}
                      onChange={(e) => setSelectedPlan(e.target.value)}
                      className="flex-1 px-2 py-1.5 text-[11px] bg-background border border-border rounded text-foreground"
                    >
                      {ADMIN_PLANS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} - UGX {p.price.toLocaleString()}
                        </option>
                      ))}
                    </select>

                    {status === 'active' ? (
                      <button
                        onClick={() => changePlan(u.id, u.email, selectedPlan)}
                        disabled={isLoading}
                        className="flex items-center gap-1 px-2 py-1.5 text-[10px] bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded font-medium hover:bg-blue-500/25 transition-colors disabled:opacity-50"
                      >
                        <ArrowUpCircle className="w-3 h-3" />
                        {isLoading ? '...' : 'Change'}
                      </button>
                    ) : (
                      <button
                        onClick={() => activateUser(u.id, u.email, selectedPlan)}
                        disabled={isLoading}
                        className="flex items-center gap-1 px-2 py-1.5 text-[10px] bg-green-500/15 text-green-600 dark:text-green-400 border border-green-500/20 rounded font-medium hover:bg-green-500/25 transition-colors disabled:opacity-50"
                      >
                        <Power className="w-3 h-3" />
                        {isLoading ? '...' : 'Activate'}
                      </button>
                    )}
                  </div>

                  {/* Deactivate button */}
                  {status === 'active' && (
                    <button
                      onClick={() => deactivateUser(u.id, u.email)}
                      disabled={isLoading}
                      className="w-full flex items-center justify-center gap-1 px-2 py-1.5 text-[10px] bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 rounded font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50"
                    >
                      <PowerOff className="w-3 h-3" />
                      {isLoading ? 'Processing...' : 'Deactivate Subscription'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {filteredUsers.length === 0 && (
          <p className="text-center text-[10px] text-muted-foreground py-6">No users found</p>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   WALLET VIEW (Real Backend Integration)
   ═══════════════════════════════════════════ */
function WalletView() {
  const [subscriptions, setSubs] = useState<any[]>([])
  const [usersMap, setUsersMap] = useState<Map<string, any>>(new Map())
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [wLoading, setWLoading] = useState(false)
  const [wForm, setWForm] = useState({ amount: '', phone: '' })
  const [wError, setWError] = useState('')
  const [wSuccess, setWSuccess] = useState('')

  // Real backend data
  const [realBalance, setRealBalance] = useState<number | null>(null)
  const [realTransactions, setRealTransactions] = useState<any[]>([])
  const [balanceLoading, setBalanceLoading] = useState(true)
  const [txLoading, setTxLoading] = useState(true)

  const [stats, setStats] = useState({ totalRevenue: 0, thisMonth: 0, active: 0 })

  // Fetch real wallet balance from backend
  useEffect(() => {
    const loadBalance = async () => {
      setBalanceLoading(true)
      try {
        const res = await fetchRealBalance()
        console.log('[v0] Wallet balance response:', JSON.stringify(res))
        if (res.success) {
          setRealBalance(typeof res.balance === 'number' ? res.balance : Number(res.balance) || 0)
        }
      } catch (err) {
        console.error('[v0] Error fetching wallet balance:', err)
      }
      setBalanceLoading(false)
    }
    loadBalance()
    // Refresh balance every 30 seconds
    const interval = setInterval(loadBalance, 30000)
    return () => clearInterval(interval)
  }, [])

  // Fetch real transactions from backend
  useEffect(() => {
    const loadTransactions = async () => {
      setTxLoading(true)
      try {
        const res = await fetchRealTransactions()
        console.log('[v0] Transactions response:', JSON.stringify(res))
        if (res.success && Array.isArray(res.transactions)) {
          setRealTransactions(res.transactions)
        }
      } catch (err) {
        console.error('[v0] Error fetching transactions:', err)
      }
      setTxLoading(false)
    }
    loadTransactions()
    const interval = setInterval(loadTransactions, 30000)
    return () => clearInterval(interval)
  }, [])

  // Fetch users for subscription display
  useEffect(() => {
    getDocs(collection(db, 'users')).then((s) => {
      const m = new Map<string, any>()
      s.forEach((d) => m.set(d.id, { uid: d.id, ...d.data() }))
      setUsersMap(m)
    }).catch(() => {})
  }, [])

  // Fetch Firebase subscriptions
  useEffect(() => {
    const q = query(collection(db, 'subscriptions'), orderBy('startDate', 'desc'))
    return onSnapshot(q, (s) => {
      const data = s.docs.map((d) => ({ uid: d.id, ...d.data() }))
      setSubs(data)
      let total = 0, month = 0, active = 0
      const now = new Date()
      data.forEach((sub: any) => {
        total += sub.amount || 0
        const d = sub.startDate?.toDate?.() || new Date(sub.startDate)
        if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) month += sub.amount || 0
        if (sub.isActive) active++
      })
      setStats({ totalRevenue: total, thisMonth: month, active })
      setLoading(false)
    }, () => setLoading(false))
  }, [])

  const fmt = (n: number) => `UGX ${n.toLocaleString()}`
  const fmtDate = (d: any) => { if (!d) return '-'; const dt = d?.toDate?.() || new Date(d); return dt.toLocaleDateString('en-UG') }

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault()
    setWError('')
    setWSuccess('')
    setWLoading(true)
    const amt = +wForm.amount

    if (amt <= 0) { setWError('Enter a valid amount'); setWLoading(false); return }
    if (!isValidUgandaPhone(wForm.phone)) { setWError('Enter a valid Uganda phone number (e.g. 0771234567)'); setWLoading(false); return }

    try {
      const formatted = formatPhoneToInternational(wForm.phone)
      const result = await sendPayment(formatted, amt, 'VJ Oneflex Movies Withdrawal')
      console.log('[v0] Withdrawal result:', JSON.stringify(result))

      if (result.success) {
        setWSuccess(`Withdrawal of ${fmt(amt)} to ${formatted} initiated successfully!`)
        setWForm({ amount: '', phone: '' })
        // Record in Firebase too
        await addDoc(collection(db, 'withdrawals'), {
          amount: amt,
          method: 'mobile_money',
          account: formatted,
          status: 'pending',
          reference: result.reference || null,
          created_at: new Date(),
        })
        // Refresh balance
        setTimeout(async () => {
          try {
            const res = await fetchRealBalance()
            if (res.success) setRealBalance(typeof res.balance === 'number' ? res.balance : Number(res.balance) || 0)
          } catch {}
        }, 5000)
      } else {
        setWError(result.relworx?.message || result.message || 'Withdrawal failed. Please try again.')
      }
    } catch (err) {
      console.error('[v0] Withdrawal error:', err)
      setWError('Network error. Please try again.')
    }
    setWLoading(false)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-sm font-bold text-foreground flex items-center gap-1"><Wallet className="w-4 h-4" /> Wallet</h1>
        <button onClick={() => { setShowForm(!showForm); setWError(''); setWSuccess('') }} className="flex items-center gap-1 px-2 py-1 text-[10px] bg-primary text-primary-foreground rounded hover:bg-primary/90 font-medium"><ArrowDownCircle className="w-3 h-3" />Withdraw</button>
      </div>

      {/* Real Backend Balance */}
      <div className="bg-card rounded p-3 border-2 border-primary/30">
        <p className="text-[10px] text-muted-foreground">Wallet Balance (Real)</p>
        {balanceLoading ? (
          <p className="text-2xl font-bold text-foreground animate-pulse">Loading...</p>
        ) : (
          <p className="text-2xl font-bold text-foreground">{fmt(realBalance ?? 0)}</p>
        )}
        <p className="text-[9px] text-muted-foreground mt-1">
          Live balance from payment provider | Subscriptions earned: {fmt(stats.totalRevenue)}
        </p>
      </div>

      {/* Withdraw Form */}
      {showForm && (
        <div className="bg-card rounded p-3 border border-border">
          <p className="text-xs font-semibold text-foreground mb-2">Withdraw via Mobile Money</p>
          {wError && <div className="mb-2 p-1.5 bg-red-500/20 border border-red-500/30 rounded"><p className="text-[10px] text-red-500">{wError}</p></div>}
          {wSuccess && <div className="mb-2 p-1.5 bg-green-500/20 border border-green-500/30 rounded"><p className="text-[10px] text-green-500">{wSuccess}</p></div>}
          <form onSubmit={handleWithdraw} className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div><label className={labelCls}>Amount (UGX) *</label><input type="number" min="1" className={inputCls} value={wForm.amount} onChange={(e) => setWForm({ ...wForm, amount: e.target.value })} required placeholder="e.g. 50000" /></div>
              <div>
                <label className={labelCls}>Phone Number *</label>
                <div className="relative"><Phone className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" /><input className={`${inputCls} pl-6`} value={wForm.phone} onChange={(e) => setWForm({ ...wForm, phone: e.target.value })} required placeholder="07XXXXXXXX" /></div>
                {wForm.phone && isValidUgandaPhone(wForm.phone) && <p className="text-[9px] text-green-500 mt-0.5">{formatPhoneToInternational(wForm.phone)}</p>}
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={wLoading} className={`flex-1 ${btnCls}`}>{wLoading ? 'Processing...' : 'Send Withdrawal'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 text-xs bg-muted text-foreground rounded">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="bg-card rounded p-2 border border-border"><DollarSign className="w-3.5 h-3.5 text-green-500 mb-1" /><p className="text-base font-bold text-foreground">{fmt(realBalance ?? 0)}</p><p className="text-[9px] text-muted-foreground">Wallet Balance</p></div>
        <div className="bg-card rounded p-2 border border-border"><TrendingUp className="w-3.5 h-3.5 text-blue-500 mb-1" /><p className="text-base font-bold text-foreground">{fmt(stats.thisMonth)}</p><p className="text-[9px] text-muted-foreground">This Month</p></div>
        <div className="bg-card rounded p-2 border border-border"><CreditCard className="w-3.5 h-3.5 text-yellow-500 mb-1" /><p className="text-base font-bold text-foreground">{stats.active}</p><p className="text-[9px] text-muted-foreground">Active Subs</p></div>
        <div className="bg-card rounded p-2 border border-border"><User className="w-3.5 h-3.5 text-cyan-500 mb-1" /><p className="text-base font-bold text-foreground">{usersMap.size}</p><p className="text-[9px] text-muted-foreground">Users</p></div>
      </div>

      {/* Real Transaction History from Backend */}
      <div className="bg-card rounded border border-border overflow-hidden">
        <div className="p-2 border-b border-border"><p className="text-xs font-semibold text-foreground">Transaction History (Live)</p></div>
        {txLoading ? (
          <p className="p-4 text-center text-[10px] text-muted-foreground">Loading transactions...</p>
        ) : realTransactions.length === 0 ? (
          <p className="p-4 text-center text-[10px] text-muted-foreground">No transactions found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-2 text-[9px] font-medium text-foreground">Date</th>
                  <th className="text-left p-2 text-[9px] font-medium text-foreground">Phone</th>
                  <th className="text-left p-2 text-[9px] font-medium text-foreground">Amount</th>
                  <th className="text-left p-2 text-[9px] font-medium text-foreground">Provider</th>
                  <th className="text-left p-2 text-[9px] font-medium text-foreground">Status</th>
                  <th className="text-left p-2 text-[9px] font-medium text-foreground">Reference</th>
                </tr>
              </thead>
              <tbody>
                {realTransactions.map((tx: any, i: number) => {
                  const txDate = tx.completed_at || tx.created_at || tx.updated_at
                  const status = tx.request_status || tx.status || 'unknown'
                  return (
                    <tr key={tx.internal_reference || tx.customer_reference || i} className="border-t border-border">
                      <td className="p-2 text-[9px] text-muted-foreground">{txDate ? new Date(txDate).toLocaleString('en-UG') : '-'}</td>
                      <td className="p-2 text-[9px] text-foreground">{tx.msisdn || '-'}</td>
                      <td className="p-2 text-[9px] font-medium text-green-500">{fmt(tx.amount || 0)}</td>
                      <td className="p-2 text-[9px] text-muted-foreground">{tx.provider?.replace(/_/g, ' ') || '-'}</td>
                      <td className="p-2">
                        <span className={`px-1 py-0.5 rounded text-[8px] flex items-center gap-0.5 w-fit ${
                          status === 'success' ? 'bg-green-500/20 text-green-500' :
                          status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                          'bg-red-500/20 text-red-500'
                        }`}>
                          {status === 'success' && <CheckCircle className="w-2 h-2" />}
                          {status === 'pending' && <Clock className="w-2 h-2" />}
                          {status === 'failed' && <XCircle className="w-2 h-2" />}
                          {status}
                        </span>
                      </td>
                      <td className="p-2 text-[9px] text-muted-foreground font-mono">{tx.customer_reference?.slice(0, 12) || tx.internal_reference?.slice(0, 12) || '-'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Firebase Subscriptions */}
      <div className="bg-card rounded border border-border overflow-hidden">
        <div className="p-2 border-b border-border"><p className="text-xs font-semibold text-foreground">Subscriptions</p></div>
        {loading ? <p className="p-4 text-center text-[10px] text-muted-foreground">Loading...</p> : subscriptions.length === 0 ? <p className="p-4 text-center text-[10px] text-muted-foreground">No subscriptions yet</p> : (
          <table className="w-full">
            <thead className="bg-muted"><tr><th className="text-left p-2 text-[9px] font-medium text-foreground">Email</th><th className="text-left p-2 text-[9px] font-medium text-foreground">Plan</th><th className="text-left p-2 text-[9px] font-medium text-foreground">Amount</th><th className="text-left p-2 text-[9px] font-medium text-foreground">Start</th><th className="text-left p-2 text-[9px] font-medium text-foreground">Expiry</th><th className="text-left p-2 text-[9px] font-medium text-foreground">Status</th></tr></thead>
            <tbody>
              {subscriptions.map((sub: any) => {
                const u = usersMap.get(sub.uid)
                const exp = sub.expiryDate?.toDate?.() ? new Date() > sub.expiryDate.toDate() : false
                return (
                  <tr key={sub.uid} className="border-t border-border">
                    <td className="p-2 text-[9px] text-foreground">{u?.email || sub.email}</td>
                    <td className="p-2 text-[9px] text-foreground">{sub.planName}</td>
                    <td className="p-2 text-[9px] text-green-500 font-medium">{fmt(sub.amount)}</td>
                    <td className="p-2 text-[9px] text-muted-foreground">{fmtDate(sub.startDate)}</td>
                    <td className="p-2 text-[9px] text-muted-foreground">{fmtDate(sub.expiryDate)}</td>
                    <td className="p-2"><span className={`px-1 py-0.5 rounded text-[8px] ${exp ? 'bg-red-500/20 text-red-500' : sub.isActive ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'}`}>{exp ? 'Expired' : sub.isActive ? 'Active' : 'Pending'}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

/* ══════════════════════���════════════════════
   MAIN ADMIN PAGE (view router)
   ═══════════════════════════════════════════ */
   function PaymentsView() {
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDocs(query(collection(db, 'payments'), orderBy('created_at', 'desc')))
      .then(s => { setPayments(s.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const total = payments.filter(p => p.status === 'successful').reduce((s, p) => s + (p.amount || 0), 0)

  return (
    <div className="space-y-3">
      <h1 className="text-sm font-bold text-foreground flex items-center gap-1">
        <CreditCard className="w-4 h-4" /> Payments ({payments.length})
      </h1>
      <div className="bg-card rounded p-3 border border-border">
        <p className="text-[10px] text-muted-foreground">Total Revenue</p>
        <p className="text-xl font-bold text-foreground">UGX {total.toLocaleString()}</p>
      </div>
      <div className="bg-card rounded border border-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              {['Email', 'Plan', 'Amount', 'Tx Ref', 'Status'].map(h => (
                <th key={h} className="text-left p-2 text-[9px] font-medium text-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-4 text-center text-[10px] text-muted-foreground">Loading...</td></tr>
            ) : payments.length === 0 ? (
              <tr><td colSpan={5} className="p-4 text-center text-[10px] text-muted-foreground">No payments yet</td></tr>
            ) : payments.map(p => (
              <tr key={p.id} className="border-t border-border">
                <td className="p-2 text-[9px] text-foreground">{p.email}</td>
                <td className="p-2 text-[9px] text-foreground capitalize">{p.plan}</td>
                <td className="p-2 text-[9px] text-green-500 font-medium">UGX {p.amount?.toLocaleString()}</td>
                <td className="p-2 text-[9px] text-muted-foreground font-mono">{p.tx_ref?.slice(0, 16)}…</td>
                <td className="p-2">
                  <span className={`px-1 py-0.5 rounded text-[8px] ${
                    p.status === 'successful' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                  }`}>{p.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AnalyticsView() {
  const [data, setData] = useState({ users: 0, active: 0, revenue: 0, plans: {} as Record<string, number> })

  useEffect(() => {
    Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'payments')),
    ]).then(([usersSnap, paymentsSnap]) => {
      const users = usersSnap.docs.map(d => d.data())
      const payments = paymentsSnap.docs.map(d => d.data())
      const plans: Record<string, number> = {}
      users.filter(u => u.isActive).forEach(u => {
        const p = u.activationPlan || 'unknown'
        plans[p] = (plans[p] || 0) + 1
      })
      setData({
        users: users.length,
        active: users.filter(u => u.isActive).length,
        revenue: payments.filter(p => p.status === 'successful').reduce((s, p) => s + (p.amount || 0), 0),
        plans,
      })
    }).catch(() => {})
  }, [])

  const conversion = data.users ? Math.round((data.active / data.users) * 100) : 0

  return (
    <div className="space-y-3">
      <h1 className="text-sm font-bold text-foreground flex items-center gap-1">
        <BarChart3 className="w-4 h-4" /> Analytics
      </h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { label: 'Total Users', value: data.users, color: 'text-blue-400' },
          { label: 'Active Subs', value: data.active, color: 'text-green-400' },
          { label: 'Revenue (UGX)', value: data.revenue.toLocaleString(), color: 'text-yellow-400' },
          { label: 'Conversion', value: `${conversion}%`, color: 'text-purple-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-card rounded p-3 border border-border">
            <p className={`text-lg font-bold ${color}`}>{value}</p>
            <p className="text-[9px] text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
      <div className="bg-card rounded p-3 border border-border">
        <p className="text-xs font-semibold text-foreground mb-3">Plan Breakdown</p>
        {Object.keys(data.plans).length === 0 ? (
          <p className="text-[10px] text-muted-foreground">No active subscribers yet</p>
        ) : Object.entries(data.plans).map(([plan, count]) => (
          <div key={plan} className="mb-2">
            <div className="flex justify-between mb-1">
              <span className="text-[10px] capitalize text-foreground">{plan}</span>
              <span className="text-[10px] text-muted-foreground">{count} users</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${Math.round((count / data.active) * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
export default function AdminPage() {
  const { activeView, setActiveView } = useContext(AdminViewContext)
  const catOpts = ['Action', 'Animation', 'Comedy', 'Drama', 'Horror', 'Romance', 'Thriller', 'Sci-Fi']
  const animeOpts = ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Romance', 'Sci-Fi', 'Slice of Life']

  switch (activeView) {
    case 'movies': return <MoviesView />
    case 'series': return <SeriesView />
    case 'originals': return <GenericContentView collectionName="originals" icon={Star} title="Originals" addFn={addOriginal} deleteFn={deleteOriginal} updateFn={updateOriginal} options={catOpts} />
    case 'animation': return <GenericContentView collectionName="animations" icon={Sparkles} title="Animations" addFn={addAnimation} deleteFn={deleteAnimation} updateFn={updateAnimation} options={animeOpts} />
    case 'music': return <MusicView />
    case 'users': return <UsersView />
    case 'carousel': return <CarouselView />
    case 'subscriptions': return <SubscriptionsManagementView />
    case 'wallet': return <WalletView />
    case 'payments': return <PaymentsView />
     case 'analytics': return <AnalyticsView />
    default: return <DashboardView onNav={setActiveView} />
  }
}
