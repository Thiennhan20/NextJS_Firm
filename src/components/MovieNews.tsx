'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import axios from 'axios'

interface News {
  id: number;
  title: string;
  image?: string;
  summary?: string;
  date?: string;
}

// Type for TMDB API movie response
interface TMDBMovie {
  id: number;
  title: string;
  backdrop_path?: string;
  overview?: string;
  release_date?: string;
}

export default function MovieNews() {
  const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `https://api.themoviedb.org/3/movie/now_playing?api_key=${API_KEY}&language=en-US&page=1`
        );
        const movies = response.data.results.map((movie: TMDBMovie) => ({
          id: movie.id,
          title: movie.title,
          image: movie.backdrop_path ? `https://image.tmdb.org/t/p/w400${movie.backdrop_path}` : '',
          summary: movie.overview,
          date: movie.release_date,
        }));
        setNews(movies.slice(0, 6));
      } catch (error) {
        console.error(error);
        setNews([]);
      }
      setLoading(false);
    };
    fetchNews();
  }, [API_KEY]);

  return (
    <section className="py-8 sm:py-16 px-1 sm:px-4 bg-gradient-to-b from-black to-gray-900">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-xl sm:text-4xl font-bold mb-4 sm:mb-8 bg-gradient-to-r from-blue-400 to-pink-500 text-transparent bg-clip-text text-center">
          Movie News
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6">
          {loading ? (
            <div className="text-gray-400 text-center py-8">Loading...</div>
          ) : (
            news.map((item) => (
              <motion.div
                key={item.id}
                whileHover={{ scale: 1.04, y: -6 }}
                className="bg-gray-800 rounded-xl overflow-hidden shadow-lg group cursor-pointer transition-all"
              >
                <div className="relative">
                  {item.image ? (
                    <Image 
                      src={item.image} 
                      alt={item.title} 
                      width={400}
                      height={180}
                      className="w-full h-32 sm:h-48 object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                  ) : (
                    <div className="w-full h-32 sm:h-48 flex items-center justify-center bg-gray-700 text-3xl sm:text-4xl">🎬</div>
                  )}
                  <div className="absolute top-2 left-2 bg-black/70 text-xs text-white px-2 py-1 rounded-full">{item.date}</div>
                </div>
                <div className="p-3 sm:p-4">
                  <div className="font-semibold text-base sm:text-lg text-white mb-1 sm:mb-2 line-clamp-2">{item.title}</div>
                  <div className="text-gray-400 text-xs sm:text-sm line-clamp-3">{item.summary}</div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </section>
  )
} 