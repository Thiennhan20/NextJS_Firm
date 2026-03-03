'use client'

import { motion } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import {
  StarIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TrophyIcon,
  FireIcon,
  SparklesIcon,
} from '@heroicons/react/24/solid'
import Link from 'next/link'
import Image from 'next/image'
import { useTopComments, useRecentComments } from '@/hooks/useCommentsOptimized'

interface RankingItem {
  id: number
  title: string
  poster: string
  trend: 'up' | 'down' | 'same'
  rating?: number
  change?: number
  type?: 'movie' | 'tv'
}

// Mock data arrays removed – state versions are used instead

// Custom avatar generator function
const generateAvatar = (name: string) => {
  const colors = [
    'from-purple-500 to-pink-500',
    'from-blue-500 to-cyan-500',
    'from-green-500 to-emerald-500',
    'from-orange-500 to-red-500',
    'from-indigo-500 to-purple-500',
    'from-teal-500 to-blue-500'
  ]
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase()
  const color = colors[name.length % colors.length]

  return (
    <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${color} rounded-full flex items-center justify-center shadow-md`}>
      <span className="text-white font-semibold text-sm">{initials}</span>
    </div>
  )
}

export default function TopComments() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const carouselRef = useRef<HTMLDivElement>(null)
  const [trendingMovies, setTrendingMovies] = useState<RankingItem[]>([])
  const [mostLikedMovies, setMostLikedMovies] = useState<RankingItem[]>([])

  // Use optimized hooks with SWR caching and batch fetching
  const { comments: topComments, isLoading: loading, isError: error } = useTopComments(9)
  const { comments: newComments, isLoading: newCommentsLoading } = useRecentComments(4)

  // Fetch trending and top rated movies from TMDB
  useEffect(() => {
    const fetchTMDBData = async () => {
      try {
        const [trendingRes, topRatedRes] = await Promise.all([
          axios.get('/api/tmdb-proxy?endpoint=/trending/movie/week'),
          axios.get('/api/tmdb-proxy?endpoint=/movie/top_rated')
        ]);

        // Process trending movies
        const trending = trendingRes.data.results.slice(0, 5).map((movie: { id: number; title: string; poster_path?: string }, index: number) => ({
          id: movie.id,
          title: movie.title,
          poster: movie.poster_path ? `https://image.tmdb.org/t/p/w92${movie.poster_path}` : '',
          trend: index < 3 ? 'up' as const : 'down' as const,
          change: Math.floor(Math.random() * 20) + 5,
          type: 'movie' as const
        }));

        // Process top rated movies
        const topRated = topRatedRes.data.results.slice(0, 5).map((movie: { id: number; title: string; poster_path?: string; vote_average?: number }, index: number) => ({
          id: movie.id,
          title: movie.title,
          poster: movie.poster_path ? `https://image.tmdb.org/t/p/w92${movie.poster_path}` : '',
          trend: index % 2 === 0 ? 'up' as const : 'same' as const,
          rating: movie.vote_average ? Number((movie.vote_average / 2).toFixed(1)) : 0,
          type: 'movie' as const
        }));

        setTrendingMovies(trending);
        setMostLikedMovies(topRated);
      } catch (error) {
        console.error('Error fetching TMDB data:', error);
      }
    };

    fetchTMDBData();
  }, []);

  // Helper function to build movie/TV URL with comment anchor
  const getCommentUrl = (movieId: number, type: 'movie' | 'tvshow', commentId: string | number) => {
    const basePath = type === 'movie' ? '/movies' : '/tvshows'
    return `${basePath}/${movieId}#comment-${commentId}`
  }

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth
      setIsMobile(width < 768)
      setIsTablet(width >= 768 && width < 1024)
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  const getItemsPerSlide = () => {
    if (isMobile) return 1
    if (isTablet) return 2
    return 3
  }

  const itemsPerSlide = getItemsPerSlide()
  const totalSlides = Math.ceil(topComments.length / itemsPerSlide)

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides)
  }

  const getCurrentComments = () => {
    const start = currentSlide * itemsPerSlide
    return topComments.slice(start, start + itemsPerSlide)
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'same') => {
    switch (trend) {
      case 'up':
        return <span className="text-green-400 text-sm">↑</span>
      case 'down':
        return <span className="text-red-400 text-sm">↓</span>
      default:
        return <span className="text-gray-400 text-sm">→</span>
    }
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "text-green-400"
    if (rating >= 4.0) return "text-yellow-400"
    if (rating >= 3.0) return "text-orange-400"
    return "text-red-400"
  }

  return (
    <section className="py-8 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-900 to-black relative overflow-hidden">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            rotate: [0, 360],
            scale: [1, 1.1, 1]
          }}
          transition={{
            rotate: { duration: 50, repeat: Infinity, ease: "linear" },
            scale: { duration: 20, repeat: Infinity, repeatType: "mirror" }
          }}
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            rotate: [360, 0],
            scale: [1.1, 1, 1.1]
          }}
          transition={{
            rotate: { duration: 45, repeat: Infinity, ease: "linear" },
            scale: { duration: 25, repeat: Infinity, repeatType: "mirror" }
          }}
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0]
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            repeatType: "mirror"
          }}
          className="absolute top-1/4 left-1/4 w-40 h-40 bg-yellow-500/10 rounded-full blur-2xl"
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Top Comments Carousel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 lg:mb-16"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-lg shadow-lg">
                <TrophyIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">TOP COMMENTS</h2>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <div className="flex items-center gap-1 text-sm text-gray-400">
                <span>{currentSlide + 1}</span>
                <span className="text-gray-600">/</span>
                <span>{totalSlides}</span>
              </div>
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.05, backgroundColor: "rgba(55, 65, 81, 0.7)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={prevSlide}
                  className="p-2 bg-gray-800/50 rounded-full transition-colors border border-gray-700/50"
                  aria-label="Previous comments"
                >
                  <ChevronLeftIcon className="w-5 h-5 text-white" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05, backgroundColor: "rgba(55, 65, 81, 0.7)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={nextSlide}
                  className="p-2 bg-gray-800/50 rounded-full transition-colors border border-gray-700/50"
                  aria-label="Next comments"
                >
                  <ChevronRightIcon className="w-5 h-5 text-white" />
                </motion.button>
              </div>
            </div>
          </div>

          <div
            ref={carouselRef}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 transition-all duration-500"
          >
            {loading ? (
              // Loading skeleton
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 sm:p-5 border border-gray-700/50 animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gray-700 rounded-full" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-700 rounded w-24 mb-2" />
                      <div className="h-3 bg-gray-700 rounded w-16" />
                    </div>
                  </div>
                  <div className="h-16 bg-gray-700 rounded mb-4" />
                  <div className="h-4 bg-gray-700 rounded w-full mb-2" />
                  <div className="h-4 bg-gray-700 rounded w-3/4" />
                </div>
              ))
            ) : error ? (
              // Error state
              <div className="col-span-full flex flex-col items-center justify-center py-12">
                <p className="text-red-400 mb-2">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="text-sm text-blue-400 hover:text-blue-300 underline"
                >
                  Retry
                </button>
              </div>
            ) : topComments.length === 0 ? (
              // Empty state
              <div className="col-span-full flex flex-col items-center justify-center py-12">
                <ChatBubbleLeftIcon className="w-16 h-16 text-gray-600 mb-4" />
                <p className="text-gray-400 text-lg">No comments yet</p>
                <p className="text-gray-500 text-sm">Be the first to share your thoughts!</p>
              </div>
            ) : (
              getCurrentComments().map((comment, index) => (
                <Link
                  key={comment.id}
                  href={getCommentUrl(comment.movieId, comment.type, comment.id)}
                  className="block h-full"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                    className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 sm:p-5 border border-gray-700/50 hover:border-gray-600/70 transition-all duration-300 flex flex-col h-full group cursor-pointer"
                  >
                    {/* User Info */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="relative flex-shrink-0">
                        {comment.user.avatar ? (
                          <Image
                            src={comment.user.avatar}
                            alt={comment.user.name}
                            width={48}
                            height={48}
                            className="w-12 h-12 rounded-full object-cover border-2 border-gray-700"
                          />
                        ) : (
                          generateAvatar(comment.user.name)
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-white text-sm sm:text-base truncate">{comment.user.name}</h3>
                        </div>
                        <p className="text-gray-400 text-xs">{comment.timestamp}</p>
                      </div>
                    </div>

                    {/* Movie Info */}
                    <div className="flex items-start gap-3 mb-4">
                      <div className="relative flex-shrink-0">
                        {comment.movie.poster ? (
                          <Image
                            src={comment.movie.poster}
                            alt={comment.movie.title}
                            width={48}
                            height={64}
                            className="w-12 h-16 object-cover rounded-md shadow-md"
                          />
                        ) : (
                          <div className="w-12 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-md flex items-center justify-center shadow-inner">
                            <span className="text-white text-xs font-bold">MOVIE</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-medium text-sm sm:text-base truncate group-hover:text-blue-300 transition-colors">
                          {comment.movie.title}
                        </h4>
                        <p className="text-gray-300 text-sm leading-relaxed mt-1 line-clamp-3">
                          {comment.content}
                        </p>
                      </div>
                    </div>

                    {/* Engagement Stats */}
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-700/50">
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <motion.span
                          whileHover={{ scale: 1.1 }}
                          className="flex items-center gap-1.5 hover:text-red-400 transition-colors cursor-pointer group/like"
                        >
                          <HeartIcon className="w-4 h-4 group-hover/like:fill-red-400 transition-colors" />
                          <span>{comment.likes}</span>
                        </motion.span>
                        <motion.span
                          whileHover={{ scale: 1.1 }}
                          className="flex items-center gap-1.5 hover:text-blue-400 transition-colors cursor-pointer group/reply"
                        >
                          <ChatBubbleLeftIcon className="w-4 h-4 group-hover/reply:fill-blue-400 transition-colors" />
                          <span>{comment.replies}</span>
                        </motion.span>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium bg-blue-400/10 hover:bg-blue-400/20 px-3 py-1 rounded-full"
                      >
                        Reply
                      </motion.button>
                    </div>
                  </motion.div>
                </Link>
              ))
            )}
          </div>
        </motion.div>

        {/* Three Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Trending Now */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-gray-800/40 backdrop-blur-sm rounded-xl p-5 sm:p-6 border border-gray-700/50 hover:border-gray-600/50 transition-colors"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg shadow-md">
                <FireIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white">TRENDING NOW</h3>
              </div>
            </div>
            <div className="space-y-4">
              {trendingMovies.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500 text-sm">Loading trending...</p>
                </div>
              ) : (
                trendingMovies.map((movie, index) => (
                  <Link key={movie.id} href={`/movies/${movie.id}`}>
                    <motion.div
                      whileHover={{ x: 5, backgroundColor: "rgba(55, 65, 81, 0.5)" }}
                      className="flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer group/trending"
                    >
                      <span className={`text-lg font-bold w-6 text-center ${index === 0 ? "text-yellow-400" :
                        index === 1 ? "text-gray-300" :
                          index === 2 ? "text-amber-700" : "text-gray-500"
                        }`}>
                        {index + 1}
                      </span>
                      {getTrendIcon(movie.trend)}
                      {movie.poster ? (
                        <Image
                          src={movie.poster}
                          alt={movie.title}
                          width={32}
                          height={48}
                          className="w-8 h-12 object-cover rounded shadow-inner flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-12 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded flex items-center justify-center shadow-inner flex-shrink-0">
                          <span className="text-white text-xs font-bold">M</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="text-white text-sm font-medium truncate block group-hover/trending:text-orange-300 transition-colors">
                          {movie.title}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs font-semibold ${movie.trend === 'up' ? 'text-green-400' : movie.trend === 'down' ? 'text-red-400' : 'text-gray-400'}`}>
                            {movie.trend === 'up' ? '+' : ''}{movie.change}%
                          </span>
                          <span className="text-gray-500 text-xs">this week</span>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                ))
              )}
            </div>
          </motion.div>

          {/* Most Liked */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-gray-800/40 backdrop-blur-sm rounded-xl p-5 sm:p-6 border border-gray-700/50 hover:border-gray-600/50 transition-colors"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg shadow-md">
                <HeartIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white">MOST LIKED</h3>
              </div>
            </div>
            <div className="space-y-4">
              {mostLikedMovies.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500 text-sm">Loading top rated...</p>
                </div>
              ) : (
                mostLikedMovies.map((movie, index) => (
                  <Link key={movie.id} href={`/movies/${movie.id}`}>
                    <motion.div
                      whileHover={{ x: 5, backgroundColor: "rgba(55, 65, 81, 0.5)" }}
                      className="flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer group/liked"
                    >
                      <span className={`text-lg font-bold w-6 text-center ${index === 0 ? "text-yellow-400" :
                        index === 1 ? "text-gray-300" :
                          index === 2 ? "text-amber-700" : "text-gray-500"
                        }`}>
                        {index + 1}
                      </span>
                      {getTrendIcon(movie.trend)}
                      {movie.poster ? (
                        <Image
                          src={movie.poster}
                          alt={movie.title}
                          width={32}
                          height={48}
                          className="w-8 h-12 object-cover rounded shadow-inner flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-12 bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded flex items-center justify-center shadow-inner flex-shrink-0">
                          <span className="text-white text-xs font-bold">M</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="text-white text-sm font-medium truncate block group-hover/liked:text-pink-300 transition-colors">
                          {movie.title}
                        </span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <StarIcon className={`w-3 h-3 ${getRatingColor(movie.rating || 0)}`} />
                          <span className={`text-xs font-semibold ${getRatingColor(movie.rating || 0)}`}>
                            {movie.rating}
                          </span>
                          <span className="text-gray-500 text-xs">rating</span>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                ))
              )}
            </div>
          </motion.div>

          {/* New Comments */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-gray-800/40 backdrop-blur-sm rounded-xl p-5 sm:p-6 border border-gray-700/50 hover:border-gray-600/50 transition-colors"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg shadow-md">
                <SparklesIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white">NEW COMMENTS</h3>
              </div>
            </div>
            <div className="space-y-4">
              {newCommentsLoading ? (
                // Loading skeleton for new comments
                Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="p-3 rounded-lg animate-pulse">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gray-700 rounded-full flex-shrink-0" />
                      <div className="flex-1">
                        <div className="h-3 bg-gray-700 rounded w-24 mb-2" />
                        <div className="h-3 bg-gray-700 rounded w-full mb-1" />
                        <div className="h-3 bg-gray-700 rounded w-3/4" />
                      </div>
                    </div>
                  </div>
                ))
              ) : newComments.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500 text-sm">No recent comments</p>
                </div>
              ) : (
                newComments.map((comment) => (
                  <Link
                    key={comment.id}
                    href={getCommentUrl(comment.movieId, comment.type, comment.id)}
                    className="block"
                  >
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="p-3 rounded-lg hover:bg-gray-700/30 transition-all border border-transparent hover:border-gray-600/30 group/comment cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative flex-shrink-0">
                          {comment.user.avatar ? (
                            <Image
                              src={comment.user.avatar}
                              alt={comment.user.name}
                              width={40}
                              height={40}
                              className="w-10 h-10 rounded-full object-cover border-2 border-gray-700"
                            />
                          ) : (
                            generateAvatar(comment.user.name)
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-white text-sm group-hover/comment:text-blue-300 transition-colors">
                              {comment.user.name}
                            </span>
                          </div>
                          <p className="text-gray-300 text-sm leading-relaxed mb-2 line-clamp-2">
                            {comment.content}
                          </p>
                          <div className="flex items-center justify-between text-xs text-gray-400">
                            <span className="text-blue-400 font-medium truncate max-w-[120px] bg-blue-400/10 px-2 py-1 rounded">
                              ▶ {comment.movie}
                            </span>
                            <span className="bg-gray-700/50 px-2 py-1 rounded">{comment.timestamp}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}