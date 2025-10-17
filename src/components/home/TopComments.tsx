'use client'

import { motion } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { 
  StarIcon, 
  HeartIcon, 
  ChatBubbleLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TrophyIcon,
  FireIcon,
  SparklesIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/solid'

interface TopComment {
  id: number
  user: {
    name: string
    avatar: string
    verified: boolean
  }
  movie: {
    title: string
    poster: string
    rating: number
  }
  content: string
  likes: number
  replies: number
  timestamp: string
}

interface RankingItem {
  id: number
  title: string
  poster: string
  trend: 'up' | 'down' | 'same'
  rating?: number
  change?: number
}

interface NewComment {
  id: number
  user: {
    name: string
    avatar: string
    verified: boolean
  }
  content: string
  movie: string
  timestamp: string
}

// Beautiful mock data for top comments carousel
const topComments: TopComment[] = [
  {
    id: 1,
    user: { name: "Alex Thompson", avatar: "/api/placeholder/60/60", verified: true },
    movie: { title: "Eternal Sunshine", poster: "/api/placeholder/80/120", rating: 4.8 },
    content: "This film completely redefined cinema for me. The cinematography is breathtaking and the emotional depth is unparalleled.",
    likes: 248,
    replies: 42,
    timestamp: "2 hours ago"
  },
  {
    id: 2,
    user: { name: "Sophia Chen", avatar: "/api/placeholder/60/60", verified: true },
    movie: { title: "Midnight in Paris", poster: "/api/placeholder/80/120", rating: 4.6 },
    content: "Woody Allen's masterpiece! The way he blends romance with magical realism is pure genius. A love letter to literature and art.",
    likes: 189,
    replies: 31,
    timestamp: "5 hours ago"
  },
  {
    id: 3,
    user: { name: "Marcus Rivera", avatar: "/api/placeholder/60/60", verified: false },
    movie: { title: "The Grand Budapest Hotel", poster: "/api/placeholder/80/120", rating: 4.9 },
    content: "Wes Anderson's visual storytelling reaches its peak. Every frame is a painting, every character is memorable. Absolute perfection!",
    likes: 312,
    replies: 56,
    timestamp: "1 day ago"
  },
  {
    id: 4,
    user: { name: "Emma Watson", avatar: "/api/placeholder/60/60", verified: true },
    movie: { title: "La La Land", poster: "/api/placeholder/80/120", rating: 4.7 },
    content: "The ending had me in tears. A beautiful tribute to dreams, love, and the sacrifices we make for our passions.",
    likes: 427,
    replies: 89,
    timestamp: "1 day ago"
  },
  {
    id: 5,
    user: { name: "James Cameron", avatar: "/api/placeholder/60/60", verified: true },
    movie: { title: "Inception", poster: "/api/placeholder/80/120", rating: 4.8 },
    content: "Nolan's mind-bending masterpiece gets better with every viewing. The layers of reality and dreams are brilliantly executed.",
    likes: 521,
    replies: 127,
    timestamp: "2 days ago"
  },
  {
    id: 6,
    user: { name: "Luna Park", avatar: "/api/placeholder/60/60", verified: false },
    movie: { title: "Spirited Away", poster: "/api/placeholder/80/120", rating: 4.9 },
    content: "Miyazaki's imagination knows no bounds. This film is a beautiful journey that touches the soul. Pure magic from start to finish.",
    likes: 398,
    replies: 74,
    timestamp: "3 days ago"
  }
]

// Mock data for trending movies
const trendingMovies: RankingItem[] = [
  { id: 1, title: "Dune: Part Two", poster: "/api/placeholder/40/60", trend: "up", change: 24 },
  { id: 2, title: "Oppenheimer", poster: "/api/placeholder/40/60", trend: "up", change: 18 },
  { id: 3, title: "Past Lives", poster: "/api/placeholder/40/60", trend: "up", change: 15 },
  { id: 4, title: "The Batman", poster: "/api/placeholder/40/60", trend: "down", change: 8 },
  { id: 5, title: "Everything Everywhere", poster: "/api/placeholder/40/60", trend: "down", change: 12 }
]

// Mock data for most liked movies
const mostLikedMovies: RankingItem[] = [
  { id: 1, title: "The Shawshank Redemption", poster: "/api/placeholder/40/60", trend: "up", rating: 4.9 },
  { id: 2, title: "The Godfather", poster: "/api/placeholder/40/60", trend: "same", rating: 4.8 },
  { id: 3, title: "Pulp Fiction", poster: "/api/placeholder/40/60", trend: "up", rating: 4.7 },
  { id: 4, title: "Forrest Gump", poster: "/api/placeholder/40/60", trend: "up", rating: 4.6 },
  { id: 5, title: "Fight Club", poster: "/api/placeholder/40/60", trend: "same", rating: 4.5 }
]

// Mock data for new comments
const newComments: NewComment[] = [
  {
    id: 1,
    user: { name: "CinemaLover42", avatar: "/api/placeholder/40/40", verified: true },
    content: "Just rewatched this masterpiece and it hits even harder the second time. The character development is phenomenal!",
    movie: "The Dark Knight",
    timestamp: "2 minutes ago"
  },
  {
    id: 2,
    user: { name: "FilmBuff99", avatar: "/api/placeholder/40/40", verified: false },
    content: "The cinematography in this film is absolutely stunning! Every shot could be a wallpaper. Villeneuve is a visual genius.",
    movie: "Blade Runner 2049",
    timestamp: "5 minutes ago"
  },
  {
    id: 3,
    user: { name: "MovieCriticPro", avatar: "/api/placeholder/40/40", verified: true },
    content: "While the visuals are impressive, I felt the emotional core was missing. Great spectacle but lacks heart in my opinion.",
    movie: "Avatar: The Way of Water",
    timestamp: "10 minutes ago"
  },

]

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
                <p className="text-gray-400 text-sm">Most engaging discussions from our community</p>
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
            {getCurrentComments().map((comment, index) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 sm:p-5 border border-gray-700/50 hover:border-gray-600/70 transition-all duration-300 flex flex-col h-full group"
              >
                {/* User Info */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative flex-shrink-0">
                    {generateAvatar(comment.user.name)}
                    {comment.user.verified && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-gray-900 shadow-md">
                        <CheckBadgeIcon className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white text-sm sm:text-base truncate">{comment.user.name}</h3>
                      {comment.user.verified && (
                        <span className="text-xs text-blue-400 flex-shrink-0 bg-blue-400/10 px-2 py-0.5 rounded-full">Verified</span>
                      )}
                    </div>
                    <p className="text-gray-400 text-xs">{comment.timestamp}</p>
                  </div>
                </div>

                {/* Movie Info */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-md flex items-center justify-center shadow-inner">
                      <span className="text-white text-xs font-bold">MOVIE</span>
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-gray-900 rounded-full p-1 shadow-md border border-gray-700">
                      <div className={`flex items-center gap-0.5 ${getRatingColor(comment.movie.rating)}`}>
                        <StarIcon className="w-3 h-3 fill-current" />
                        <span className="text-xs font-bold">{comment.movie.rating}</span>
                      </div>
                    </div>
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
            ))}
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
                <p className="text-gray-400 text-sm">Movies gaining popularity</p>
              </div>
            </div>
            <div className="space-y-4">
              {trendingMovies.map((movie, index) => (
                <motion.div
                  key={movie.id}
                  whileHover={{ x: 5, backgroundColor: "rgba(55, 65, 81, 0.5)" }}
                  className="flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer group/trending"
                >
                  <span className={`text-lg font-bold w-6 text-center ${
                    index === 0 ? "text-yellow-400" : 
                    index === 1 ? "text-gray-300" : 
                    index === 2 ? "text-amber-700" : "text-gray-500"
                  }`}>
                    {index + 1}
                  </span>
                  {getTrendIcon(movie.trend)}
                  <div className="w-8 h-12 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded flex items-center justify-center shadow-inner flex-shrink-0">
                    <span className="text-white text-xs font-bold">M</span>
                  </div>
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
              ))}
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
                <p className="text-gray-400 text-sm">Community favorites</p>
              </div>
            </div>
            <div className="space-y-4">
              {mostLikedMovies.map((movie, index) => (
                <motion.div
                  key={movie.id}
                  whileHover={{ x: 5, backgroundColor: "rgba(55, 65, 81, 0.5)" }}
                  className="flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer group/liked"
                >
                  <span className={`text-lg font-bold w-6 text-center ${
                    index === 0 ? "text-yellow-400" : 
                    index === 1 ? "text-gray-300" : 
                    index === 2 ? "text-amber-700" : "text-gray-500"
                  }`}>
                    {index + 1}
                  </span>
                  {getTrendIcon(movie.trend)}
                  <div className="w-8 h-12 bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded flex items-center justify-center shadow-inner flex-shrink-0">
                    <span className="text-white text-xs font-bold">M</span>
                  </div>
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
              ))}
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
                <p className="text-gray-400 text-sm">Fresh from the community</p>
              </div>
            </div>
            <div className="space-y-4">
              {newComments.map((comment) => (
                <motion.div
                  key={comment.id}
                  whileHover={{ scale: 1.02 }}
                  className="p-3 rounded-lg hover:bg-gray-700/30 transition-all border border-transparent hover:border-gray-600/30 group/comment"
                >
                  <div className="flex items-start gap-3">
                    <div className="relative flex-shrink-0">
                      {generateAvatar(comment.user.name)}
                      {comment.user.verified && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center border border-gray-900 shadow-sm">
                          <CheckBadgeIcon className="w-2 h-2 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-white text-sm group-hover/comment:text-blue-300 transition-colors">
                          {comment.user.name}
                        </span>
                        {comment.user.verified && (
                          <span className="text-xs text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded">Verified</span>
                        )}
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
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}