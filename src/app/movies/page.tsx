'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Pagination from '@/components/Pagination'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import axios from 'axios'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Suspense } from 'react'

const genres = ['All', 'Action', 'Adventure', 'Animation', 'Comedy', 'Drama', 'History', 'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Thriller', 'Family']
const ratings = ['All', 5, 4, 3, 2, 1]
const sortOptions = [
  { value: 'latest', label: 'Latest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'rating-desc', label: 'Rating High-Low' },
  { value: 'rating-asc', label: 'Rating Low-High' },
  { value: 'title-az', label: 'Title A-Z' },
  { value: 'title-za', label: 'Title Z-A' },
]

const PAGE_SIZE = 8 // Number of movies per page

// Định nghĩa kiểu Movie rõ ràng
interface Movie {
  id: number;
  title: string;
  poster_path: string;
  image?: string;
  rating?: number;
  year?: number;
  genre?: string;
}

// Type for TMDB API movie response
interface TMDBMovie {
  id: number;
  title: string;
  poster_path: string;
  vote_average: number;
  release_date?: string;
}

function MoviesPageContent() {
  const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPage = Number(searchParams.get('page')) || 1;
  const [selectedGenre, setSelectedGenre] = useState('All')
  const [search, setSearch] = useState('')
  const [selectedYear, setSelectedYear] = useState<string | number>('All')
  const [selectedRating, setSelectedRating] = useState<string | number>('All')
  const [sort, setSort] = useState('latest')
  const [page, setPage] = useState(initialPage)
  const [loading, setLoading] = useState(false)
  const [movies, setMovies] = useState<Movie[]>([])
  const [totalPages, setTotalPages] = useState(1)

  // Khi page thay đổi, update URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(page));
    router.replace(`?${params.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Compute years dynamically from movies
  const years = useMemo(() => {
    const uniqueYears = Array.from(new Set(movies.map((m) => m.year ?? 0))).sort((a, b) => (b ?? 0) - (a ?? 0))
    return ['All', ...uniqueYears]
  }, [movies])

  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true)
      try {
        const response = await axios.get(
          `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&page=${page}`
        )
        let fetchedMovies = response.data.results
        // Map the data to match the UI
        fetchedMovies = fetchedMovies.map((movie: TMDBMovie) => ({
          id: movie.id,
          title: movie.title,
          rating: movie.vote_average,
          year: movie.release_date ? Number(movie.release_date.slice(0, 4)) : '',
          image: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '',
          genre: [], // Will filter later if needed
        }))
        setMovies(fetchedMovies)
        setTotalPages(response.data.total_pages)
      } catch (error) {
        console.error(error);
        setMovies([])
      }
      setLoading(false)
    }
    fetchMovies()
  }, [page, API_KEY]);

  // Filter, sort, search (client-side)
  const filteredMovies = movies.filter((movie: Movie) =>
    (selectedGenre === 'All' || (movie.genre ?? '').includes(selectedGenre)) &&
    (selectedYear === 'All' || movie.year === selectedYear) &&
    (selectedRating === 'All' || (typeof selectedRating === 'number' && Math.floor(movie.rating ?? 0) >= selectedRating)) &&
    movie.title.toLowerCase().includes(search.toLowerCase())
  )

  let sortedMovies = [...filteredMovies]
  if (sort === 'latest') sortedMovies = sortedMovies.sort((a: Movie, b: Movie) => (b.year ?? 0) - (a.year ?? 0))
  if (sort === 'oldest') sortedMovies = sortedMovies.sort((a: Movie, b: Movie) => (a.year ?? 0) - (b.year ?? 0))
  if (sort === 'rating-desc') sortedMovies = sortedMovies.sort((a: Movie, b: Movie) => (b.rating ?? 0) - (a.rating ?? 0))
  if (sort === 'rating-asc') sortedMovies = sortedMovies.sort((a: Movie, b: Movie) => (a.rating ?? 0) - (b.rating ?? 0))
  if (sort === 'title-az') sortedMovies = sortedMovies.sort((a: Movie, b: Movie) => a.title.localeCompare(b.title))
  if (sort === 'title-za') sortedMovies = sortedMovies.sort((a: Movie, b: Movie) => b.title.localeCompare(a.title))

  const pagedMovies = sortedMovies.slice(0, PAGE_SIZE)

  // Animation variants for grid items
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl sm:text-5xl font-bold mb-8 bg-gradient-to-r from-red-500 to-blue-500 text-transparent bg-clip-text text-center"
        >
          All Movies
        </motion.h1>

        {/* Filter, Sort & Search Container */}
        <div className="flex flex-col gap-4 mb-10">
          {/* Genre Filters */}
          <div className="flex flex-wrap gap-2">
            {genres.map((g) => (
              <motion.button
                key={g}
                onClick={() => setSelectedGenre(g)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-300 ${
                  selectedGenre === g ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-md' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {g}
              </motion.button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* Year, Rating, Sort Selects */}
            <div className="flex flex-wrap gap-4">
              <div className="relative">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value === 'All' ? 'All' : Number(e.target.value))}
                  className="appearance-none px-4 py-2 rounded-full bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer pr-8"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
                {/* Custom dropdown arrow */}
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 dado-gray-400">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>

              <div className="relative">
                <select
                  value={selectedRating}
                  onChange={(e) => setSelectedRating(e.target.value === 'All' ? 'All' : Number(e.target.value))}
                  className="appearance-none px-4 py-2 rounded-full bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer pr-8"
                >
                  {ratings.map((r) => (
                    <option key={r} value={r}>
                      {r === 'All' ? 'All Ratings' : `${r}★`}
                    </option>
                  ))}
                </select>
                {/* Custom dropdown arrow */}
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>

              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="appearance-none px-4 py-2 rounded-full bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer pr-8"
                >
                  {sortOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {/* Custom dropdown arrow */}
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-auto sm:min-w-[250px]">
              <input
                type="text"
                placeholder="Search movies..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2 rounded-full bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
              />
              <MagnifyingGlassIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Movie Grid + Loading + Pagination */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
              className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full"
            />
            <p className="mt-4 text-gray-400 text-lg">Loading Movies...</p>
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
                  transition: { staggerChildren: 0.08 },
                },
              }}
              initial="hidden"
              animate="show"
              exit="hidden"
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            >
              {pagedMovies.length === 0 && (
                <motion.div
                  key="no-movies"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="col-span-full text-center text-gray-400 py-12 text-xl"
                >
                  No movies found.
                </motion.div>
              )}
              {pagedMovies.map((movie: Movie) => (
                <motion.div
                  key={movie.id}
                  variants={itemVariants} // Apply item animation variants
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                >
                  <Link key={movie.id} href={`/movies/${movie.id}?page=${page}`} className="block">
                    <div className="border rounded-lg ">
                      <Image
                        src={movie.image ?? ''}
                        alt={movie.title}
                        width={500}
                        height={750}
                        className="w-full"
                      />
                      <p className="p-2 text-center text-white">{movie.title}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
        {!loading && movies.length > 0 && totalPages > 1 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={(p) => {
              setPage(p)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          />
        )}
      </div>
    </div>
  )
}

export default function MoviesPage() {
  return (
    <Suspense>
      <MoviesPageContent />
    </Suspense>
  );
}