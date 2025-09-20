'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import axios from 'axios'
import Link from 'next/link'
import { ChevronLeftIcon, ChevronRightIcon, PlayIcon, BookmarkIcon, XMarkIcon, ArrowUpRightIcon } from '@heroicons/react/24/outline'
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid'
import { useWatchlistStore } from '@/store/store'
import useAuthStore from '@/store/useAuthStore'
import { toast } from 'react-hot-toast'
import api from '@/lib/axios'

interface Movie {
  id: number;
  title: string;
  poster_path: string;
  backdrop_path?: string;
  year?: number;
  poster?: string;
  description?: string;
  genre?: string;
  director?: string;
  cast?: string[];
  trailer?: string;
  vote_average?: number;
}

interface TVShow {
  id: number;
  name: string;
  poster_path: string;
  backdrop_path?: string;
  year?: number;
  poster?: string;
  description?: string;
  genre?: string;
  director?: string;
  cast?: string[];
  trailer?: string;
  vote_average?: number;
}

type HeroItem = (Movie | TVShow) & { 
  image: string; 
  backdrop: string;
  type: 'movie' | 'tv';
  status?: string;
  release_date?: string;
  first_air_date?: string;
  original_language?: string;
  vote_average?: number;
};

// Type for TMDB API responses
interface TMDBMovie {
  id: number;
  title: string;
  poster_path?: string;
  backdrop_path?: string;
  vote_average: number;
  release_date?: string;
  original_language?: string;
  overview?: string;
}

interface TMDBTVShow {
  id: number;
  name: string;
  poster_path?: string;
  backdrop_path?: string;
  vote_average: number;
  first_air_date?: string;
  original_language?: string;
  overview?: string;
}

// Hàm chuyển đổi language code thành tên quốc gia
const getCountryName = (languageCode?: string): string => {
  const countryMap: { [key: string]: string } = {
    'en': 'USA',
    'ja': 'Japan',
    'ko': 'Korea',
    'zh': 'China',
    'hi': 'India',
    'fr': 'France',
    'de': 'Germany',
    'es': 'Spain',
    'it': 'Italy',
    'pt': 'Brazil',
    'ru': 'Russia',
    'ar': 'Egypt',
    'th': 'Thailand',
    'vi': 'Vietnam',
    'id': 'Indonesia',
    'ms': 'Malaysia',
    'tl': 'Philippines',
    'my': 'Myanmar',
    'km': 'Cambodia',
    'lo': 'Laos'
  };
  return countryMap[languageCode || 'en'] || 'USA';
};

// Hàm format ngày tháng năm
const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Component cho mũi tên và hướng dẫn trên Mobile
const MobileTrailerHint = () => (
  <motion.div
    className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full"
    initial={{ opacity: 0, x: 10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.5, delay: 0.3 }}
  >
    <ArrowUpRightIcon className="w-4 h-4 text-white/80" />
    <span className="text-xs text-white/80 font-light">Tap for trailer</span>
  </motion.div>
);

// Component cho mũi tên và hướng dẫn trên Desktop
const DesktopTrailerHint = () => (
  <motion.div
    className="absolute left-full ml-4 top-1/2 -translate-y-1/2 flex items-center gap-2"
    initial={{ opacity: 0, x: 10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.5, delay: 0.3 }}
  >
    <ArrowUpRightIcon className="w-5 h-5 text-white/80" />
    <span className="text-sm text-white/80 font-light">Click for trailer</span>
  </motion.div>
);

// Component cho navigation controls trên Desktop
const DesktopNavigationControls = ({ 
  prevSlide, 
  nextSlide, 
  goToSlide, 
  heroItems, 
  currentIndex, 
  isTransitioning, 
  showTrailer 
}: {
  prevSlide: () => void;
  nextSlide: () => void;
  goToSlide: (index: number) => void;
  heroItems: HeroItem[];
  currentIndex: number;
  isTransitioning: boolean;
  showTrailer: boolean;
}) => (
  <div className="hidden lg:flex absolute bottom-8 left-1/2 transform -translate-x-1/2 items-center gap-4">
    <motion.button
      onClick={prevSlide}
      className="w-12 h-12 rounded-full border border-white/30 bg-black/50 backdrop-blur-sm text-white hover:bg-white/20 transition-all duration-300 flex items-center justify-center disabled:opacity-50"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      disabled={isTransitioning || showTrailer}
    >
      <ChevronLeftIcon className="w-6 h-6" />
    </motion.button>

    {/* Dots Indicator */}
    <div className="flex items-center gap-2">
      {heroItems.map((_, index) => (
        <motion.button
          key={index}
          className={`w-3 h-3 rounded-full transition-all duration-300 ${
            index === currentIndex 
              ? 'bg-red-500 w-8' 
              : 'bg-white/30 hover:bg-white/50'
          }`}
          onClick={() => goToSlide(index)}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.8 }}
        />
      ))}
    </div>

    <motion.button
      onClick={nextSlide}
      className="w-12 h-12 rounded-full border border-white/30 bg-black/50 backdrop-blur-sm text-white hover:bg-white/20 transition-all duration-300 flex items-center justify-center disabled:opacity-50"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      disabled={isTransitioning || showTrailer}
    >
      <ChevronRightIcon className="w-6 h-6" />
    </motion.button>
  </div>
);

// Component cho navigation controls trên Mobile & Tablet
const MobileNavigationControls = ({ 
  prevSlide, 
  nextSlide, 
  goToSlide, 
  heroItems, 
  currentIndex, 
  isTransitioning, 
  showTrailer 
}: {
  prevSlide: () => void;
  nextSlide: () => void;
  goToSlide: (index: number) => void;
  heroItems: HeroItem[];
  currentIndex: number;
  isTransitioning: boolean;
  showTrailer: boolean;
}) => (
  <>
    {/* Mobile & Tablet Swipe Indicators */}
    <div className="lg:hidden text-center mt-8 mb-4">
      <motion.p
        className="text-gray-400 text-sm"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        Swipe or tap arrows to navigate
      </motion.p>
    </div>

    {/* Mobile & Tablet Navigation Controls */}
    <div className="lg:hidden flex justify-center items-center gap-4 mt-2">
      <motion.button
        onClick={prevSlide}
        className="w-10 h-10 rounded-full border border-white/30 bg-black/50 backdrop-blur-sm text-white active:bg-white/20 transition-all duration-300 flex items-center justify-center disabled:opacity-50"
        whileTap={{ scale: 0.9 }}
        disabled={isTransitioning || showTrailer}
      >
        <ChevronLeftIcon className="w-5 h-5" />
      </motion.button>

      {/* Mobile Dots Indicator */}
      <div className="flex items-center gap-2">
        {heroItems.map((_, index) => (
          <motion.button
            key={index}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              index === currentIndex 
                ? 'bg-red-500 w-6' 
                : 'bg-white/30'
            }`}
            onClick={() => goToSlide(index)}
            whileTap={{ scale: 0.8 }}
          />
        ))}
      </div>

      <motion.button
        onClick={nextSlide}
        className="w-10 h-10 rounded-full border border-white/30 bg-black/50 backdrop-blur-sm text-white active:bg-white/20 transition-all duration-300 flex items-center justify-center disabled:opacity-50"
        whileTap={{ scale: 0.9 }}
        disabled={isTransitioning || showTrailer}
      >
        <ChevronRightIcon className="w-5 h-5" />
      </motion.button>
    </div>
  </>
);

export default function HeroMovies() {
  const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
  const [heroItems, setHeroItems] = useState<HeroItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [currentTrailer, setCurrentTrailer] = useState<string>('');
  const [isMobile, setIsMobile] = useState(false);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  // Watchlist functionality
  const { addToWatchlist, removeFromWatchlist, isInWatchlist, fetchWatchlistFromServer } = useWatchlistStore();
  const { isAuthenticated, token } = useAuthStore();

  // Enhanced slider functions with smooth transitions
  const nextSlide = useCallback(() => {
    if (isTransitioning || heroItems.length === 0 || showTrailer) return;
    
    setIsTransitioning(true);
    setCurrentIndex(prev => (prev + 1) % heroItems.length);
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 600);
  }, [heroItems.length, isTransitioning, showTrailer]);

  const prevSlide = useCallback(() => {
    if (isTransitioning || heroItems.length === 0 || showTrailer) return;
    
    setIsTransitioning(true);
    setCurrentIndex(prev => (prev - 1 + heroItems.length) % heroItems.length);
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 600);
  }, [heroItems.length, isTransitioning, showTrailer]);

  const goToSlide = useCallback((index: number) => {
    if (isTransitioning || index === currentIndex || showTrailer) return;
    
    setIsTransitioning(true);
    setCurrentIndex(index);
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 600);
  }, [currentIndex, isTransitioning, showTrailer]);

  // Auto-play functionality - Optimized interval
  const startAutoPlay = useCallback(() => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    autoPlayRef.current = setInterval(() => {
      if (!isTransitioning && !showTrailer && heroItems.length > 0) {
        nextSlide();
      }
    }, 8000); // Increased interval for better performance
  }, [isTransitioning, nextSlide, showTrailer, heroItems.length]);

  const stopAutoPlay = useCallback(() => {
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
    }
  }, []);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  useEffect(() => {
    const fetchHeroItems = async () => {
      setLoading(true);
      try {
        const [moviesResponse, tvShowsResponse] = await Promise.all([
          axios.get(`https://api.themoviedb.org/3/trending/movie/week?api_key=${API_KEY}`),
          axios.get(`https://api.themoviedb.org/3/trending/tv/week?api_key=${API_KEY}`)
        ]);

        const movies = moviesResponse.data.results.slice(0, 3).map((movie: TMDBMovie) => ({
          id: movie.id,
          title: movie.title,
          image: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '',
          backdrop: movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : '',
          year: movie.release_date ? Number(movie.release_date.slice(0, 4)) : 0,
          type: 'movie' as const,
          status: '🔥 Trending',
          release_date: movie.release_date || '',
          original_language: movie.original_language || 'en',
          description: movie.overview || '',
          vote_average: movie.vote_average || 0
        }));

        const tvShows = tvShowsResponse.data.results.slice(0, 2).map((tvShow: TMDBTVShow) => ({
          id: tvShow.id,
          name: tvShow.name,
          image: tvShow.poster_path ? `https://image.tmdb.org/t/p/w500${tvShow.poster_path}` : '',
          backdrop: tvShow.backdrop_path ? `https://image.tmdb.org/t/p/w1280${tvShow.backdrop_path}` : '',
          year: tvShow.first_air_date ? Number(tvShow.first_air_date.slice(0, 4)) : 0,
          type: 'tv' as const,
          status: '⭐ Popular',
          first_air_date: tvShow.first_air_date || '',
          original_language: tvShow.original_language || 'en',
          description: tvShow.overview || '',
          vote_average: tvShow.vote_average || 0
        }));

        // Combine movies first, then TV shows
        const combined = [...movies, ...tvShows];
        setHeroItems(combined);
      } catch (error) {
        console.error('Error fetching data:', error);
        setHeroItems([]);
      }
      setLoading(false);
    };
    
    if (API_KEY) {
      fetchHeroItems();
    }
  }, [API_KEY]);

  // Start auto-play when component mounts and items are loaded
  useEffect(() => {
    if (heroItems.length > 0 && !showTrailer) {
      startAutoPlay();
    }
    return () => stopAutoPlay();
  }, [heroItems, startAutoPlay, stopAutoPlay, showTrailer]);

  // Fetch watchlist when component mounts and user is authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      fetchWatchlistFromServer(token);
    }
  }, [isAuthenticated, token, fetchWatchlistFromServer]);

  // Stop auto-play when trailer is shown and restart when closed
  useEffect(() => {
    if (showTrailer) {
      stopAutoPlay();
    } else if (heroItems.length > 0) {
      startAutoPlay();
    }
  }, [showTrailer, heroItems.length, startAutoPlay, stopAutoPlay]);

  // Helper function to get title for both movies and TV shows
  const getTitle = (item: HeroItem) => {
    return 'title' in item ? item.title : item.name;
  };

  // Helper function to get route for both movies and TV shows
  const getRoute = (item: HeroItem) => {
    return item.type === 'movie' ? `/movies/${item.id}` : `/tvshows/${item.id}`;
  };

  // Handle toggle watchlist
  const handleToggleWatchlist = async (item: HeroItem) => {
    if (!isAuthenticated) {
      toast.error('You need to log in to save movies');
      return;
    }

    try {
      const movieData = {
        id: item.id,
        title: 'title' in item ? item.title : item.name,
        poster_path: item.image,
      };

      if (isInWatchlist(item.id)) {
        await api.delete('/auth/watchlist', {
          data: { id: item.id },
        });
        removeFromWatchlist(item.id);
        toast.success('Removed from watchlist');
      } else {
        await api.post('/auth/watchlist', movieData);
        addToWatchlist(movieData);
        toast.success('Added to watchlist');
      }
      
      // Đồng bộ lại watchlist từ server
      if (token) await fetchWatchlistFromServer(token);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'An error occurred');
      } else {
        toast.error('An error occurred');
      }
    }
  };

  // Handle trailer functionality
  const handleTrailerClick = async (item: HeroItem) => {
    try {
      // Stop auto-play immediately when trailer is clicked
      stopAutoPlay();
      
      // Fetch trailer from TMDB API
      const response = await axios.get(
        `https://api.themoviedb.org/3/${item.type}/${item.id}/videos?api_key=${API_KEY}`
      );
      
             const trailers = response.data.results.filter((video: { type: string; site: string }) => 
         video.type === 'Trailer' && video.site === 'YouTube'
       );
      
      if (trailers.length > 0) {
        const trailerKey = trailers[0].key;
        const trailerUrl = `https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0&modestbranding=1`;
        setCurrentTrailer(trailerUrl);
        setShowTrailer(true);
      } else {
        toast.error('No trailer available for this content');
      }
    } catch (error) {
      console.error('Error fetching trailer:', error);
      toast.error('Failed to load trailer');
    }
  };

  const closeTrailer = () => {
    setShowTrailer(false);
    setCurrentTrailer('');
    // Restart auto-play when trailer is closed
    if (heroItems.length > 0) {
      startAutoPlay();
    }
  };

  // Enhanced slider functions moved above to fix dependency issue

  if (loading) {
    return (
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-900 via-black to-gray-800">
        <motion.div
          className="flex flex-col items-center space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative">
            <motion.div
              className="w-16 h-16 border-4 border-red-500/20 border-t-red-500 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>
          <motion.p
            className="text-gray-400 text-lg font-medium"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Loading amazing content...
          </motion.p>
        </motion.div>
      </section>
    );
  }

  if (!heroItems.length) {
    return (
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-900 via-black to-gray-800">
        <div className="text-center">
          <h2 className="text-2xl text-gray-300 mb-4">No content available</h2>
          <p className="text-gray-500">Please check your API configuration</p>
        </div>
      </section>
    );
  }

  const currentItem = heroItems[currentIndex];
  const visibleItems = heroItems; // Show all 5 items in thumbnail row

  return (
    <section 
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      onMouseEnter={stopAutoPlay}
      onMouseLeave={startAutoPlay}
    >
      {/* Dynamic Background with Parallax Effect */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          className="absolute inset-0 scale-110"
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1.05 }}
          exit={{ opacity: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          <div
            className="w-full h-full bg-cover bg-center"
            style={{
              backgroundImage: `url(${currentItem.backdrop || currentItem.image})`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
        </motion.div>
      </AnimatePresence>

      {/* Floating Particles Effect - Optimized for performance */}
      {!isMobile && (
        <div className="absolute inset-0">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/20 rounded-full performance-particle"
              style={{
                left: `${20 + i * 15}%`,
                top: `${25 + (i % 2) * 30}%`,
                willChange: 'transform, opacity',
                animation: `particleFloat ${4 + i * 0.5}s ease-in-out infinite`,
                animationDelay: `${i * 0.3}s`
              }}
            />
          ))}
        </div>
      )}
      
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 py-4 sm:py-8">
        {/* Custom CSS to hide scrollbars */}
        <style jsx>{`
          .scrollbar-hide {
            -ms-overflow-style: none;  /* Internet Explorer 10+ */
            scrollbar-width: none;  /* Firefox */
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;  /* Safari and Chrome */
          }
        `}</style>
        
        {/* Mobile Layout */}
        <div className="block lg:hidden">
          <motion.div
            className="text-white text-center space-y-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.6 }}
                className="space-y-3"
              >
                {/* Mobile Badges */}
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <motion.span
                    className="px-3 py-1.5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full text-xs font-bold shadow-lg"
                    whileHover={{ scale: 1.05 }}
                  >
                    {currentItem.status}
                  </motion.span>
                  <motion.span
                    className="px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-full text-xs font-semibold border border-white/20"
                    whileHover={{ scale: 1.05 }}
                  >
                    {currentItem.type === 'movie' ? '🎬 Movie' : '📺 TV Show'}
                  </motion.span>
                </div>

                {/* Mobile Title */}
                <motion.h1
                  className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold uppercase tracking-tight leading-tight px-4"
                  style={{
                    background: 'linear-gradient(135deg, #fff 0%, #f0f0f0 50%, #ddd 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
                  }}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  {getTitle(currentItem)}
                </motion.h1>

                {/* Mobile Meta */}
                <div className="flex items-center justify-center gap-2 text-xs sm:text-sm flex-wrap">
                  <span className="text-gray-300 text-center">
                    {formatDate(currentItem.release_date || currentItem.first_air_date || '')}
                  </span>
                  <span className="text-gray-300 hidden sm:inline">•</span>
                  <span className="text-gray-300 text-center">
                    {getCountryName(currentItem.original_language)}
                  </span>
                </div>

                {/* Mobile Poster */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentIndex}
                    className="relative group flex justify-center my-6"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.6 }}
                  >
                    <div 
                      className="w-48 h-64 sm:w-56 sm:h-72 md:w-64 md:h-80 rounded-2xl overflow-hidden shadow-2xl relative cursor-pointer transition-transform duration-300 hover:scale-105"
                      onClick={() => handleTrailerClick(currentItem)}
                    >
                      <Image
                        src={currentItem.image || '/placeholder-poster.jpg'}
                        alt={getTitle(currentItem)}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 192px, (max-width: 768px) 224px, 256px"
                        priority
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                             {/* Mobile Trailer Hint */}
                       <MobileTrailerHint />
                    </div>
                    
                    
                    
                    
                  </motion.div>
                </AnimatePresence>


                {/* Mobile Action Buttons */}
                <motion.div
                  className="flex items-center justify-center gap-3 px-4 pt-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                >
                  <Link href={getRoute(currentItem)} className="w-auto">
                    <motion.button
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-full font-semibold text-sm shadow-lg transition-all duration-300"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <PlayIcon className="w-4 h-4" />
                      Watch
                    </motion.button>
                  </Link>
                  
                  <motion.button
                    onClick={() => handleToggleWatchlist(currentItem)}
                    className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-full font-semibold text-sm transition-all duration-300 ${
                      isInWatchlist(currentItem.id)
                        ? 'bg-yellow-600 text-black hover:bg-yellow-700'
                        : 'bg-gray-700 hover:bg-gray-600 text-white'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isInWatchlist(currentItem.id) ? (
                      <BookmarkSolidIcon className="w-4 h-4" />
                    ) : (
                      <BookmarkIcon className="w-4 h-4" />
                    )}
                    {isInWatchlist(currentItem.id) ? 'Added' : 'Save'}
                  </motion.button>
                </motion.div>

                {/* Mobile Thumbnails */}
                <div className="flex items-center justify-center gap-2 px-4 pt-2 overflow-x-auto pb-2 scrollbar-hide">
                  {visibleItems.map((item, index) => (
                    <motion.button
                      key={item.id}
                      className={`relative flex-shrink-0 w-12 h-16 sm:w-14 sm:h-18 rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                        index === currentIndex 
                          ? 'border-red-500 shadow-lg shadow-red-500/30' 
                          : 'border-white/20'
                      }`}
                      onClick={() => goToSlide(index)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Image
                        src={item.image || '/placeholder-poster.jpg'}
                        alt={getTitle(item)}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                      {index === currentIndex && (
                        <motion.div
                          className="absolute inset-0 bg-red-500/20"
                          layoutId="activeThumbMobile"
                        />
                      )}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:grid lg:grid-cols-2 gap-8 items-center min-h-[600px]">
          
          {/* Left Side - Main Content */}
          <motion.div
            className="text-white space-y-4"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.6 }}
                className="space-y-3"
              >
                {/* Status and Type Badges */}
                <div className="flex items-center gap-3">
                  <motion.span
                    className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-full text-sm font-bold shadow-lg"
                    whileHover={{ scale: 1.05 }}
                  >
                    {currentItem.status}
                  </motion.span>
                  <motion.span
                    className="px-4 py-2 bg-black/50 backdrop-blur-sm rounded-full text-sm font-semibold border border-white/20"
                    whileHover={{ scale: 1.05 }}
                  >
                    {currentItem.type === 'movie' ? '🎬 Movie' : '📺 TV Show'}
                  </motion.span>
                </div>

                {/* Title */}
                <motion.h1
                  className="text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-bold uppercase tracking-tight leading-tight"
                  style={{
                    background: 'linear-gradient(135deg, #fff 0%, #f0f0f0 50%, #ddd 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
                  }}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                >
                  {getTitle(currentItem)}
                </motion.h1>

                {/* Rating and Meta Info */}
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-300">
                    {formatDate(currentItem.release_date || currentItem.first_air_date || '')}
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className="text-gray-300">
                    {getCountryName(currentItem.original_language)}
                  </span>
                </div>


                {/* Action Buttons */}
                <motion.div
                  className="flex items-center gap-4 pt-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                >
                  <Link href={getRoute(currentItem)}>
                    <motion.button
                      className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-full font-bold text-base shadow-xl transition-all duration-300"
                      whileHover={{ scale: 1.05, boxShadow: "0 25px 50px rgba(239, 68, 68, 0.4)" }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <PlayIcon className="w-5 h-5" />
                      Watch Now
                    </motion.button>
                  </Link>
                  
                  <motion.button
                    onClick={() => handleToggleWatchlist(currentItem)}
                    className={`flex items-center gap-3 px-6 py-3 rounded-full font-semibold text-base transition-all duration-300 ${
                      isInWatchlist(currentItem.id)
                        ? 'bg-yellow-600 text-black hover:bg-yellow-700'
                        : 'bg-gray-700 hover:bg-gray-600 text-white'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isInWatchlist(currentItem.id) ? (
                      <BookmarkSolidIcon className="w-5 h-5" />
                    ) : (
                      <BookmarkIcon className="w-5 h-5" />
                    )}
                    {isInWatchlist(currentItem.id) ? 'Added to list' : 'Save to list'}
                  </motion.button>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* Right Side - Poster and Thumbnails */}
          <motion.div
            className="flex flex-col items-center space-y-4"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
                         {/* Main Poster */}
             <AnimatePresence mode="wait">
               <motion.div
                 key={currentIndex}
                 className="relative group"
                 initial={{ opacity: 0, rotateY: 90 }}
                 animate={{ opacity: 1, rotateY: 0 }}
                 exit={{ opacity: 0, rotateY: -90 }}
                 transition={{ duration: 0.6 }}
                 whileHover={{ scale: 1.05 }}
               >
                                   <div 
                    className="w-80 h-96 rounded-2xl overflow-hidden shadow-2xl relative cursor-pointer transition-transform duration-300 hover:scale-105"
                    onClick={() => handleTrailerClick(currentItem)}
                  >
                   <Image
                     src={currentItem.image || '/placeholder-poster.jpg'}
                     alt={getTitle(currentItem)}
                     fill
                     className="object-cover"
                     sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                   />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                   
                   
                 </div>
                 
                 {/* Glow effect */}
                 <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-red-500/20 to-pink-500/20 blur-xl -z-10 opacity-60" />
                 
                                   {/* Desktop Trailer Hint */}
                  <DesktopTrailerHint />
               </motion.div>
             </AnimatePresence>

            {/* Thumbnail Navigation */}
            <div className="flex items-center gap-3 max-w-full overflow-x-auto pb-2 scrollbar-hide">
              {visibleItems.map((item, index) => (
                <motion.button
                  key={item.id}
                  className={`relative flex-shrink-0 w-16 h-20 rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                    index === currentIndex 
                      ? 'border-red-500 shadow-lg shadow-red-500/30' 
                      : 'border-white/20 hover:border-white/40'
                  }`}
                  onClick={() => goToSlide(index)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Image
                    src={item.image || '/placeholder-poster.jpg'}
                    alt={getTitle(item)}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                  {index === currentIndex && (
                    <motion.div
                      className="absolute inset-0 bg-red-500/20"
                      layoutId="activeThumb"
                    />
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Navigation Controls - Hidden on Mobile & Tablet */}
        <DesktopNavigationControls 
          prevSlide={prevSlide} 
          nextSlide={nextSlide} 
          goToSlide={goToSlide} 
          heroItems={heroItems} 
          currentIndex={currentIndex} 
          isTransitioning={isTransitioning} 
          showTrailer={showTrailer} 
        />

        {/* Mobile & Tablet Swipe Indicators */}
        <MobileNavigationControls 
          prevSlide={prevSlide} 
          nextSlide={nextSlide} 
          goToSlide={goToSlide} 
          heroItems={heroItems} 
          currentIndex={currentIndex} 
          isTransitioning={isTransitioning} 
          showTrailer={showTrailer} 
        />
      </div>

       {/* Trailer Modal */}
       <AnimatePresence>
         {showTrailer && (
           <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
             onClick={closeTrailer}
           >
             <motion.div
               initial={{ scale: 0.8, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.8, opacity: 0 }}
               transition={{ type: "spring", damping: 25, stiffness: 300 }}
               className="relative w-full max-w-4xl mx-4 aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl"
               onClick={(e) => e.stopPropagation()}
             >
               {/* Close Button */}
               <motion.button
                 onClick={closeTrailer}
                 className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/70 hover:bg-black/90 rounded-full flex items-center justify-center text-white transition-all duration-300 hover:scale-110"
                 whileHover={{ scale: 1.1 }}
                 whileTap={{ scale: 0.9 }}
               >
                 <XMarkIcon className="w-6 h-6" />
               </motion.button>
               
               {/* YouTube Embed */}
               <iframe
                 src={currentTrailer}
                 title="Movie Trailer"
                 className="w-full h-full"
                 allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                 allowFullScreen
               />
             </motion.div>
           </motion.div>
         )}
       </AnimatePresence>
     </section>
   )
 }

