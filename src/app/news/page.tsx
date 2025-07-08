'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import axios from 'axios'

interface MovieNews {
  id: number;
  title: string;
  image: string;
  summary: string;
  date: string;
}

export default function NewsPage() {
  const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
  const [news, setNews] = useState<MovieNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `https://api.themoviedb.org/3/movie/now_playing?api_key=${API_KEY}&language=en-US&page=${page}`
        );
        const movies: MovieNews[] = response.data.results.map((movie: Record<string, unknown>) => ({
          id: movie.id as number,
          title: movie.title as string,
          image: movie.backdrop_path ? `https://image.tmdb.org/t/p/w400${movie.backdrop_path}` : '',
          summary: movie.overview as string,
          date: movie.release_date as string,
        }));
        setNews(movies);
        setTotalPages(response.data.total_pages);
      } catch {
        setNews([]);
        setTotalPages(1);
      }
      setLoading(false);
    };
    fetchNews();
  }, [API_KEY, page]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-green-400 to-blue-500 text-transparent bg-clip-text">
            Latest Movie News
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Stay updated with the latest news, articles, and updates from the world of cinema and Movie World.
          </p>
        </motion.div>

        {/* News List */}
        <div className="grid grid-cols-2 md:grid-cols-2 gap-2 md:gap-6">
          {loading ? (
            <div className="text-gray-400 text-center py-8 col-span-full">Loading...</div>
          ) : (
            news.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="bg-gray-800/70 backdrop-blur-sm rounded-lg overflow-hidden flex flex-col shadow-sm"
              >
                <div className="relative h-28 sm:h-40 w-full">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover rounded-t-lg"
                    />
                  ) : (
                    <div className="w-full h-28 sm:h-40 flex items-center justify-center bg-gray-700 text-3xl sm:text-4xl">🎬</div>
                  )}
                </div>
                <div className="p-3 flex flex-col justify-between flex-grow">
                  <div className="mb-2">
                    <h3 className="text-base font-semibold mb-1 line-clamp-2">{item.title}</h3>
                    <p className="text-gray-400 text-xs mb-1">{item.date}</p>
                    <p className="text-gray-300 text-xs line-clamp-2">{item.summary}</p>
                  </div>
                  <a href={`/movies/${item.id}`} className="text-red-400 hover:underline font-semibold self-start text-xs mt-1">
                    Read More
                  </a>
                </div>
              </motion.div>
            ))
          )}
        </div>
        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 rounded bg-gray-700 text-white disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-300">Page {page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 rounded bg-gray-700 text-white disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
} 