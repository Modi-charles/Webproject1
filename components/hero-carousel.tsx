'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'

type CarouselItem = {
  id: string
  title: string
  subtitle?: string
  banner_url: string
  link_type?: string
  link_id?: string
}

type Movie = {
  id: string
  title: string
  poster_url: string
  year?: number
  rating?: number
}

interface HeroCarouselProps {
  movies?: Movie[]
  onWatchClick?: (id: string) => void
}

export function HeroCarousel({ movies, onWatchClick }: HeroCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [slides, setSlides] = useState<CarouselItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'carousel'), orderBy('created_at', 'desc'))
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const carouselItems = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as CarouselItem[]

      setSlides(carouselItems)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  // Auto-advance slides
  useEffect(() => {
    const timer = setInterval(nextSlide, 5000)
    return () => clearInterval(timer)
  }, [slides.length])

  if (loading) {
    return (
      <div className="relative rounded-lg overflow-hidden mx-2 mt-2">
        <div className="relative h-40 md:h-52 bg-muted animate-pulse" />
      </div>
    )
  }

  if (slides.length === 0) {
    return null
  }

  const slide = slides[currentSlide]

  const handleWatch = () => {
    if (slide.link_id && onWatchClick) {
      onWatchClick(slide.link_id)
    }
  }

  return (
    <div className="relative rounded-lg overflow-hidden mx-2 mt-2">
      <div className="relative h-40 md:h-52">
        <Image
          src={slide.banner_url || "/placeholder.svg?height=400&width=1200&query=movie banner"}
          alt={slide.title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-black/30" />

        <div className="absolute bottom-3 left-3">
          <p className="text-[10px] text-gray-300 mb-0.5">{slide.subtitle}</p>
          <h2 className="text-lg md:text-xl font-bold text-white mb-2">{slide.title}</h2>
          <button
            onClick={handleWatch}
            className="bg-primary text-primary-foreground px-3 py-1 rounded text-xs font-medium hover:bg-primary/90 transition-colors inline-block"
          >
            Watch Now
          </button>
        </div>

        <button
          onClick={prevSlide}
          className="absolute left-1 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${i === currentSlide ? "bg-primary" : "bg-white/50"}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
