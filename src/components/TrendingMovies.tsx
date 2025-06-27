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
          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory relative"
            style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
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