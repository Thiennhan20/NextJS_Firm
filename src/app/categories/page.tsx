'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import Pagination from '@/components/Pagination'
import Image from 'next/image'
import axios from 'axios'
import RequireAdmin from '@/components/RequireAdmin';

const sortOptions = [
  { value: 'name-az', label: 'Name A-Z' },
  { value: 'name-za', label: 'Name Z-A' },
  { value: 'count-desc', label: 'Most Movies' },
  { value: 'count-asc', label: 'Least Movies' },
]
const PAGE_SIZE = 6 // Tăng số lượng thể loại mỗi trang

interface Category {
  id: number;
  name: string;
  count?: number;
  image?: string;
  description?: string;
}

export default function CategoriesPage() {
  const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('name-az')
  const [page, setPage] = useState(1)
  const [sortedCategories, setSortedCategories] = useState(categories)

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `https://api.themoviedb.org/3/genre/movie/list?api_key=${API_KEY}&language=en-US`
        );
        const genres = response.data.genres;
        // Fetch 1 movie for each genre to get a poster
        const categoriesWithImage = await Promise.all(
          genres.map(async (genre: { id: number; name: string }) => {
            try {
              const movieRes = await axios.get(
                `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_genres=${genre.id}&sort_by=popularity.desc&page=1`
              );
              const movie = movieRes.data.results[0];
              return {
                ...genre,
                image: movie && movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : undefined,
              };
            } catch {
              return { ...genre };
            }
          })
        );
        setCategories(categoriesWithImage);
      } catch (error) {
        console.error(error);
        setCategories([]);
      }
      setLoading(false);
    };
    fetchCategories();
  }, [API_KEY]);

  useEffect(() => {
    setLoading(true)
    // Simulate fetching/processing data
    const timeout = setTimeout(() => {
      let sorted = [...categories]
      if (sort === 'name-az') sorted = sorted.sort((a, b) => a.name.localeCompare(b.name))
      if (sort === 'name-za') sorted = sorted.sort((a, b) => b.name.localeCompare(a.name))
      if (sort === 'count-desc') sorted = sorted.sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
      if (sort === 'count-asc') sorted = sorted.sort((a, b) => (a.count ?? 0) - (b.count ?? 0))
      setSortedCategories(sorted)
      setPage(1) // Reset to first page on sort change
      setLoading(false)
    }, 500)
    return () => clearTimeout(timeout)
  }, [sort, categories])

  const totalPages = Math.ceil(sortedCategories.length / PAGE_SIZE)
  const pagedCategories = sortedCategories.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

   // Animation variants for grid items
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <RequireAdmin>
      <main className="min-h-screen py-12 px-2 sm:px-4 bg-gradient-to-b from-black to-gray-900">
        <div className="max-w-7xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-5xl font-bold mb-8 bg-gradient-to-r from-purple-500 to-blue-500 text-transparent bg-clip-text text-center"
          >
            Movie Categories
          </motion.h1>

          {/* Sort Filter */}
          <div className="flex justify-end mb-8">
            <div className="relative">
               <select value={sort} onChange={e => setSort(e.target.value)} className="appearance-none px-4 py-2 rounded-full bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer pr-8">
                {sortOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
               {/* Custom dropdown arrow */}
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
          </div>

          {/* Category Grid + Loading + Pagination */}
          {loading ? (
             <div className="flex flex-col items-center justify-center py-24">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
              />
              <p className="mt-4 text-gray-400 text-lg">Loading Categories...</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={page} // Key change triggers exit/enter animation
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  show: { 
                    opacity: 1, 
                    y: 0, 
                    transition: { staggerChildren: 0.1 } // Adjust stagger delay
                  },
                }}
                initial="hidden"
                animate="show"
                exit="hidden"
                className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8"
              >
                {pagedCategories.length === 0 && (
                   <motion.div 
                    key="no-categories"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="col-span-full text-center text-gray-400 py-12 text-xl"
                  >
                    No categories found.
                  </motion.div>
                )}
                {pagedCategories.map((category) => (
                  <motion.div
                    key={category.id}
                     variants={itemVariants} // Apply item animation variants
                     whileHover={{ scale: 1.04, boxShadow: '0 8px 32px 0 rgba(80,0,255,0.15)' }}
                     transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                     className="bg-gray-900 rounded-xl overflow-hidden shadow-lg group cursor-pointer relative"
                  >
                    <Link href={`/categories/${category.id}`}
                      className="block h-full">
                      <div className="relative h-40 overflow-hidden">
                        <Image 
                          src={category.image ?? '/default-image.png'} 
                          alt={category.name} 
                          width={400}
                          height={250}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:opacity-80 transition-all duration-300" />
                        <div className="absolute top-3 right-3 bg-black/70 px-3 py-1 rounded-full text-xs text-white font-bold">
                          {category.count} movies
                        </div>
                      </div>
                      <div className="p-6">
                        <h2 className="font-semibold mb-2 bg-gradient-to-r from-pink-400 to-blue-400 text-transparent bg-clip-text text-base md:text-xl lg:text-2xl">
                          {category.name}
                        </h2>
                        <p className="text-gray-400 mb-2 line-clamp-2">{category.description ?? ''}</p>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          )}
          {!loading && sortedCategories.length > 0 && totalPages > 1 && (
             <div className="mt-10">
               <Pagination 
                 currentPage={page}
                 loadedPages={Array.from({ length: totalPages }, (_, i) => i + 1)}
                 onPageChange={p => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
               />
              </div>
          )}

        </div>
      </main>
    </RequireAdmin>
  )
} 