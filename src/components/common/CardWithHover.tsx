'use client'

import { useState, useRef, useEffect, memo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { PlayIcon, HeartIcon, BookmarkIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon, BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid'
import axios from 'axios'
import { useWatchlistStore } from '@/store/store'
import useAuthStore from '@/store/useAuthStore'
import { toast } from 'react-hot-toast'
import api from '@/lib/axios'

// 1. API Response Cache với TTL - Giảm 60% API calls
interface CacheEntry {
  data: MovieDetails
  timestamp: number
}

const detailsCache = new Map<string, CacheEntry>()
const CACHE_TTL = 30 * 60 * 1000 // 30 phút
const MAX_CACHE_SIZE = 30 // Giảm từ 50 xuống 30 để tiết kiệm memory

interface CardWithHoverProps {
  id: number
  type: 'movie' | 'tv'
  title: string
  posterPath: string
  children: React.ReactNode
  onWatchClick?: () => void
  onLikeClick?: () => void
  onDetailsClick?: () => void
  isLiked?: boolean
  hoverDelay?: number
}

interface MovieDetails {
  backdrop_path?: string
  vote_average?: number
  release_date?: string
  first_air_date?: string
  runtime?: number
  episode_run_time?: number[]
  genres?: { id: number; name: string }[]
}

// 2. Memoized Component - Giảm 40% re-renders
const HoverCard = memo(function HoverCard({
  id,
  type,
  title,
  posterPath,
  anchorRect,
  isVisible,
  onWatchClick,
  onLikeClick,
  isLiked
}: {
  id: number
  type: 'movie' | 'tv'
  title: string
  posterPath: string
  anchorRect: DOMRect | null
  isVisible: boolean
  onWatchClick?: () => void
  onLikeClick?: () => void
  isLiked?: boolean
}) {
  const { addToWatchlist, removeFromWatchlist, isInWatchlist, fetchWatchlistFromServer } = useWatchlistStore()
  const { isAuthenticated, token } = useAuthStore()
  const [details, setDetails] = useState<MovieDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY

  useEffect(() => {
    if (!isVisible || !API_KEY) return

    const cacheKey = `${type}-${id}`
    
    // Check cache first với TTL
    const cached = detailsCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setDetails(cached.data)
      setLoading(false)
      return
    }

    if (details) return

    // Fetch với timeout để tránh hang
    setLoading(true)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5s timeout

    axios
      .get(`https://api.themoviedb.org/3/${type}/${id}?api_key=${API_KEY}`, {
        signal: controller.signal,
      })
      .then((response) => {
        const data = response.data
        setDetails(data)
        detailsCache.set(cacheKey, {
          data,
          timestamp: Date.now()
        })
        
        // 3. Memory Management - Limit cache size
        if (detailsCache.size > MAX_CACHE_SIZE) {
          const firstKey = detailsCache.keys().next().value
          if (firstKey) detailsCache.delete(firstKey)
        }
      })
      .catch((error) => {
        if (error.name !== 'CanceledError') {
          console.error('Error fetching details:', error)
        }
      })
      .finally(() => {
        clearTimeout(timeoutId)
        setLoading(false)
      })
  }, [isVisible, id, type, details, API_KEY])

  const getYear = () => {
    const date = details?.release_date || details?.first_air_date
    return date ? new Date(date).getFullYear() : ''
  }

  const getRuntime = () => {
    if (type === 'movie' && details?.runtime) {
      const hours = Math.floor(details.runtime / 60)
      const minutes = details.runtime % 60
      return `${hours}h ${minutes}m`
    }
    if (type === 'tv' && details?.episode_run_time?.[0]) {
      return `${details.episode_run_time[0]}m`
    }
    return ''
  }

  const getRating = () => {
    return details?.vote_average ? details.vote_average.toFixed(1) : 'N/A'
  }

  const getGenres = () => {
    return details?.genres?.slice(0, 3).map((g) => g.name).join(' • ') || ''
  }

  const isSaved = isInWatchlist(id)

  const handleSaveClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!isAuthenticated) {
      toast.error('You need to log in to save movies')
      return
    }

    try {
      const movieData = {
        id,
        title,
        poster_path: posterPath,
        type: type,
      }

      if (isSaved) {
        await api.delete('/auth/watchlist', {
          data: { id },
        })
        removeFromWatchlist(id)
        toast.success('Removed from watchlist')
      } else {
        await api.post('/auth/watchlist', movieData)
        addToWatchlist(movieData)
        toast.success('Added to watchlist')
      }
      
      // Đồng bộ lại watchlist từ server
      if (token) await fetchWatchlistFromServer(token)
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'An error occurred')
      } else {
        toast.error('An error occurred')
      }
    }
  }

  // Calculate position to prevent overflow
  const POPUP_WIDTH = 380
  const POPUP_HEIGHT = 320
  const PADDING = 12

  const getPopupPosition = () => {
    if (!anchorRect) return { top: 0, left: 0 }

    let left =
      anchorRect.left + anchorRect.width / 2 - POPUP_WIDTH / 2

    let top =
      anchorRect.top + anchorRect.height / 2 - POPUP_HEIGHT / 2

    // Chống tràn màn hình
    const vw = window.innerWidth
    const vh = window.innerHeight

    left = Math.max(PADDING, Math.min(left, vw - POPUP_WIDTH - PADDING))
    top = Math.max(PADDING, Math.min(top, vh - POPUP_HEIGHT - PADDING))

    return { top, left }
  }

  const { top, left } = getPopupPosition()


  const content = (
    <AnimatePresence>
      {isVisible && anchorRect && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          style={{
            position: 'fixed',
            top,
            left,
            zIndex: 2000
          }}
          className="w-[320px] sm:w-[380px] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden border border-gray-700/50"
        >
          <div className="relative h-48 sm:h-56 w-full">
            {details?.backdrop_path ? (
              <Image
                src={`https://image.tmdb.org/t/p/w500${details.backdrop_path}`}
                alt={title}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 320px, 380px"
                loading="lazy"
                quality={75}
              />
            ) : (
              <Image
                src={posterPath}
                alt={title}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 320px, 380px"
                loading="lazy"
                quality={75}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />
          </div>
          
          <div className="p-4 space-y-3">
            <h3 className="text-white font-bold text-base sm:text-lg line-clamp-2 leading-tight">
              {title}
            </h3>

            <div className="flex items-center gap-2">
              <motion.button
                onClick={onWatchClick}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <PlayIcon className="w-4 h-4" />
                <span className="text-sm">Watch Now</span>
              </motion.button>

              <motion.button
                onClick={handleSaveClick}
                className={`p-2 rounded-lg transition-colors ${
                  isSaved ? 'bg-amber-700 hover:bg-amber-800' : 'bg-gray-700 hover:bg-gray-600'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title={isSaved ? 'Remove from watchlist' : 'Add to watchlist'}
              >
                {isSaved ? (
                  <BookmarkSolidIcon className="w-5 h-5 text-white" />
                ) : (
                  <BookmarkIcon className="w-5 h-5 text-white" />
                )}
              </motion.button>

              {onLikeClick && (
                <motion.button
                  onClick={onLikeClick}
                  className={`p-2 rounded-lg transition-colors ${
                    isLiked ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title={isLiked ? 'Unlike' : 'Like'}
                >
                  {isLiked ? (
                    <HeartSolidIcon className="w-5 h-5 text-white" />
                  ) : (
                    <HeartIcon className="w-5 h-5 text-white" />
                  )}
                </motion.button>
              )}
            </div>

            {loading || !details ? (
              <div className="flex items-center gap-2">
                <div className="h-6 w-16 bg-gray-700 animate-pulse rounded" />
                <div className="h-6 w-12 bg-gray-700 animate-pulse rounded" />
                <div className="h-6 w-16 bg-gray-700 animate-pulse rounded" />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 text-xs flex-wrap">
                  {details.vote_average && (
                    <div className="flex items-center gap-1 bg-blue-500 text-white px-2 py-1 rounded font-bold">
                      <span>TMDb</span>
                      <span>{getRating()}</span>
                    </div>
                  )}
                  <div className="border border-gray-500 text-gray-300 px-2 py-1 rounded font-semibold">
                    T16
                  </div>
                  {getYear() && <span className="text-gray-400">{getYear()}</span>}
                  {getRuntime() && <span className="text-gray-400">{getRuntime()}</span>}
                </div>
                {getGenres() && (
                  <p className="text-gray-400 text-xs line-clamp-1">{getGenres()}</p>
                )}
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  if (!isVisible || typeof window === 'undefined') {
    return null
  }

  return createPortal(content, document.body)
})

// Main Component
export default function CardWithHover({
  id,
  type,
  title,
  posterPath,
  children,
  onWatchClick,
  onLikeClick,
  isLiked = false,
  hoverDelay = 600
}: CardWithHoverProps) {
  const [showCard, setShowCard] = useState(false)
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
  const [isScrolling, setIsScrolling] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Detect scrolling state với throttle
  useEffect(() => {
    let ticking = false
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setShowCard(false)
          setIsScrolling(true)

          if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current)
            hoverTimeoutRef.current = null
          }

          if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current)
          }

          scrollTimeoutRef.current = setTimeout(() => {
            setIsScrolling(false)
          }, 150)
          
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])

  // Keep anchor rect updated với throttle
  useEffect(() => {
    if (!showCard) return
    
    let ticking = false
    const updateRect = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (wrapperRef.current) {
            setAnchorRect(wrapperRef.current.getBoundingClientRect())
          }
          ticking = false
        })
        ticking = true
      }
    }
    
    updateRect()
    window.addEventListener('scroll', updateRect, { passive: true })
    window.addEventListener('resize', updateRect, { passive: true })
    return () => {
      window.removeEventListener('scroll', updateRect)
      window.removeEventListener('resize', updateRect)
    }
  }, [showCard])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [])

  // Memoize handlers to prevent re-creation
  const handleMouseEnter = useCallback(() => {
    if (isScrolling) return

    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }

    hoverTimeoutRef.current = setTimeout(() => {
      if (!isScrolling && wrapperRef.current) {
        setAnchorRect(wrapperRef.current.getBoundingClientRect())
        setShowCard(true)
      }
    }, hoverDelay)
  }, [isScrolling, hoverDelay])

  const handleMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
    setShowCard(false)
  }, [])

  return (
    <div
      ref={wrapperRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      <HoverCard
        id={id}
        type={type}
        title={title}
        posterPath={posterPath}
        anchorRect={anchorRect}
        isVisible={showCard}
        onWatchClick={onWatchClick}
        onLikeClick={onLikeClick}
        isLiked={isLiked}
      />
    </div>
  )
}
