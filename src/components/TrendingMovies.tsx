'use client'

import { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import axios from 'axios'
import Link from 'next/link'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

interface Movie {
  id: number;
  title: string;
  poster_path: string;
  year?: number;
  poster?: string;
  description?: string;
  genre?: string;
  director?: string;
  cast?: string[];
  trailer?: string;
}

interface TVShow {
  id: number;
  name: string;
  poster_path: string;
  year?: number;
  poster?: string;
  description?: string;
  genre?: string;
  director?: string;
  cast?: string[];
  trailer?: string;
}

type TrendingItem = (Movie | TVShow) & { 
  image: string; 
  type: 'movie' | 'tv';
  status?: string;
};

// Type for TMDB API responses
interface TMDBMovie {
  id: number;
  title: string;
  poster_path?: string;
  vote_average: number;
  release_date?: string;
}

interface TMDBTVShow {
  id: number;
  name: string;
  poster_path?: string;
  vote_average: number;
  first_air_date?: string;
}

export default function TrendingMovies() {
  const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
  const [trending, setTrending] = useState<TrendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null)

  // Check scroll position
  const checkScrollPosition = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  // Scroll functions
  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const fetchTrending = async () => {
      setLoading(true);
      try {
        const [moviesResponse, tvShowsResponse] = await Promise.all([
          axios.get(`https://api.themoviedb.org/3/trending/movie/week?api_key=${API_KEY}`),
          axios.get(`https://api.themoviedb.org/3/trending/tv/week?api_key=${API_KEY}`)
        ]);

        const movies = moviesResponse.data.results.slice(0, 10).map((movie: TMDBMovie) => ({
          id: movie.id,
          title: movie.title,
          image: movie.poster_path ? `https://image.tmdb.org/t/p/w400${movie.poster_path}` : '',
          year: movie.release_date ? Number(movie.release_date.slice(0, 4)) : 0,
          type: 'movie' as const,
          status: 'Trending'
        }));

        const tvShows = tvShowsResponse.data.results.slice(0, 5).map((tvShow: TMDBTVShow) => ({
          id: tvShow.id,
          name: tvShow.name,
          image: tvShow.poster_path ? `https://image.tmdb.org/t/p/w400${tvShow.poster_path}` : '',
          year: tvShow.first_air_date ? Number(tvShow.first_air_date.slice(0, 4)) : 0,
          type: 'tv' as const,
          status: 'Trending'
        }));

        // Combine and shuffle to mix movies and TV shows
        const combined = [...movies, ...tvShows];
        setTrending(combined);
      } catch (error) {
        console.error(error);
        setTrending([]);
      }
      setLoading(false);
    };
    fetchTrending();
  }, [API_KEY]);

  // Check scroll position on mount and scroll
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    checkScrollPosition();
    container.addEventListener('scroll', checkScrollPosition);
    window.addEventListener('resize', checkScrollPosition);

    return () => {
      container.removeEventListener('scroll', checkScrollPosition);
      window.removeEventListener('resize', checkScrollPosition);
    };
  }, [trending]);

  // Add wheel event handler for horizontal scrolling (no preventDefault)
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
        container.scrollLeft += e.deltaY;
      }
    };
    container.addEventListener('wheel', handleWheel, { passive: true });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  // Helper function to get title for both movies and TV shows
  const getTitle = (item: TrendingItem) => {
    return 'title' in item ? item.title : item.name;
  };

  // Helper function to get route for both movies and TV shows
  const getRoute = (item: TrendingItem) => {
    return item.type === 'movie' ? `/movies/${item.id}` : `/tvshows/${item.id}`;
  };

  return (
    <section className="py-8 sm:py-12 md:py-16 px-2 sm:px-4 bg-gradient-to-b from-gray-900 to-black">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold mb-4 sm:mb-6 md:mb-8 bg-gradient-to-r from-yellow-400 to-pink-500 text-transparent bg-clip-text text-center leading-tight px-4">
          Top Trending<br />
          Movies & TV Shows
        </h2>
                  <div className="relative">
            {/* Fade left */}
            <div className="pointer-events-none absolute left-0 top-0 h-full w-8 z-10 bg-gradient-to-r from-black/90 to-transparent" />
            {/* Fade right */}
            <div className="pointer-events-none absolute right-0 top-0 h-full w-8 z-10 bg-gradient-to-l from-black/90 to-transparent" />
            
            {/* Navigation arrows */}
            <motion.button
              onClick={scrollLeft}
              className={`absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/70 text-white hover:bg-black/90 transition-all duration-200 ${
                canScrollLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronLeftIcon className="w-6 h-6" />
            </motion.button>
            
            <motion.button
              onClick={scrollRight}
              className={`absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/70 text-white hover:bg-black/90 transition-all duration-200 ${
                canScrollRight ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronRightIcon className="w-6 h-6" />
            </motion.button>
          
          {/* Scroll indicator */}
          <div className={`absolute -bottom-2 sm:-bottom-4 md:-bottom-8 left-1/2 transform -translate-x-1/2 z-20 transition-opacity duration-300 ${
            canScrollLeft ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}>
            <div className="flex items-center space-x-1 sm:space-x-2 text-white/60">
              <svg className="w-3 h-3 sm:w-4 sm:h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-xs sm:text-sm font-medium">Vuốt hoặc bấm &lt; &gt;</span>
              <svg className="w-3 h-3 sm:w-4 sm:h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
          
          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory relative horizontal-scroll-container"
            style={{ 
              WebkitOverflowScrolling: 'touch', 
              scrollbarWidth: 'none', 
              msOverflowStyle: 'none',
              scrollBehavior: 'smooth'
            }}
          >
            {loading ? (
              <div className="text-gray-400 text-center py-8">Loading...</div>
            ) : (
              trending.map((item) => (
                <Link key={item.id} href={getRoute(item)} className="min-w-[180px] sm:min-w-[220px] md:min-w-[260px] max-w-[260px]">
                  <motion.div
                    whileHover={{ scale: 1.07 }}
                    className="bg-gray-800 rounded-xl overflow-hidden shadow-lg snap-center cursor-pointer group relative"
                  >
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={getTitle(item)}
                        width={400}
                        height={600}
                        className="w-full h-56 sm:h-72 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-56 sm:h-72 flex items-center justify-center bg-gray-700 text-3xl sm:text-4xl">🎬</div>
                    )}
                    {/* Status badge - top left */}
                    <div className="absolute top-3 left-3 bg-red-500/90 px-2 py-1 rounded-full text-xs text-white font-bold">
                      {item.status}
                    </div>
                    {/* Type badge - top right (replacing rating) */}
                    <div className="absolute top-3 right-3 bg-black/70 px-2 py-1 rounded-full text-xs text-white font-bold">
                      {item.type === 'movie' ? '🎬 Movie' : '📺 TV Show'}
                    </div>
                    <div className="p-3 sm:p-4">
                      <div className="font-semibold text-base sm:text-lg text-white mb-1 truncate">{getTitle(item)}</div>
                      <div className="text-gray-400 text-xs sm:text-sm">{item.year}</div>
                    </div>
                  </motion.div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  )
} 