'use client'

import { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import axios from 'axios'
import Link from 'next/link'

interface Movie {
  id: number;
  title: string;
  poster_path: string;
  rating?: number;
  year?: number;
  poster?: string;
  description?: string;
  genre?: string;
  director?: string;
  cast?: string[];
  trailer?: string;
  // Thêm các trường khác nếu cần
}

// Type for TMDB API movie response
interface TMDBMovie {
  id: number;
  title: string;
  poster_path?: string;
  vote_average: number;
  release_date?: string;
}

export default function TrendingMovies() {
  const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
  const [trending, setTrending] = useState<(Movie & { image: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null)

  // Drag scroll state
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const fetchTrending = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `https://api.themoviedb.org/3/trending/movie/week?api_key=${API_KEY}`
        );
        const movies = response.data.results.map((movie: TMDBMovie) => ({
          id: movie.id,
          title: movie.title,
          image: movie.poster_path ? `https://image.tmdb.org/t/p/w400${movie.poster_path}` : '',
          rating: movie.vote_average,
          year: movie.release_date ? Number(movie.release_date.slice(0, 4)) : '',
        }));
        setTrending(movies.slice(0, 10));
      } catch (error) {
        console.error(error);
        setTrending([]);
      }
      setLoading(false);
    };
    fetchTrending();
  }, [API_KEY]);

  // Mouse event handlers
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      startXRef.current = e.pageX - container.offsetLeft;
      scrollLeftRef.current = container.scrollLeft;
      container.classList.add('dragging');
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      e.preventDefault();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = requestAnimationFrame(() => {
        const x = e.pageX - container.offsetLeft;
        const walk = (x - startXRef.current) * 1.2;
        container.scrollLeft = scrollLeftRef.current - walk;
      });
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
      container.classList.remove('dragging');
    };

    container.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    return () => {
      container.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

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

  return (
    <section className="py-16 px-2 sm:px-4 bg-gradient-to-b from-gray-900 to-black">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl sm:text-4xl font-bold mb-8 bg-gradient-to-r from-yellow-400 to-pink-500 text-transparent bg-clip-text text-center">
          Top Trending Movies
        </h2>
        <div className="relative">
          {/* Fade left */}
          <div className="pointer-events-none absolute left-0 top-0 h-full w-8 z-10 bg-gradient-to-r from-black/90 to-transparent" />
          {/* Fade right */}
          <div className="pointer-events-none absolute right-0 top-0 h-full w-8 z-10 bg-gradient-to-l from-black/90 to-transparent" />
          
          {/* Scroll indicator */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-20">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-white/30 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-white/30 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-white/30 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
          
          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory relative cursor-grab active:cursor-grabbing horizontal-scroll-container"
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
              trending.map((movie) => (
                <Link key={movie.id} href={`/movies/${movie.id}`} className="min-w-[220px] sm:min-w-[260px] max-w-[260px]">
                  <motion.div
                    whileHover={{ scale: 1.07 }}
                    className="bg-gray-800 rounded-xl overflow-hidden shadow-lg snap-center cursor-pointer group relative"
                  >
                    {movie.image ? (
                      <Image
                        src={movie.image}
                        alt={movie.title}
                        width={400}
                        height={600}
                        className="w-full h-72 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-72 flex items-center justify-center bg-gray-700 text-4xl">🎬</div>
                    )}
                    <div className="absolute top-3 right-3 bg-black/70 px-2 py-1 rounded-full text-xs text-yellow-400 font-bold">
                      ★ {movie.rating}
                    </div>
                    <div className="p-4">
                      <div className="font-semibold text-lg text-white mb-1 truncate">{movie.title}</div>
                      <div className="text-gray-400 text-sm">{movie.year}</div>
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