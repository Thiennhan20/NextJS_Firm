'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import MovieCard from '@/components/MovieCard'
import Pagination from '@/components/Pagination'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

const allMovies = [
  {
    id: 1,
    title: 'The Amazing Adventure',
    rating: 4.8,
    year: 2024,
    image: 'https://picsum.photos/300/450',
    genre: ['Action', 'Adventure'],
  },
  {
    id: 2,
    title: 'Mystery in the Dark',
    rating: 4.5,
    year: 2024,
    image: 'https://picsum.photos/300/450',
    genre: ['Horror', 'Mystery'],
  },
  {
    id: 3,
    title: 'Love in Paris',
    rating: 4.3,
    year: 2024,
    image: 'https://picsum.photos/300/450',
    genre: ['Romance', 'Drama'],
  },
  {
    id: 4,
    title: 'Guardians of the Galaxy',
    rating: 4.7,
    year: 2023,
    image: 'https://picsum.photos/300/450',
    genre: ['Action', 'Sci-Fi'],
  },
  {
    id: 5,
    title: 'Barbie',
    rating: 4.2,
    year: 2023,
    image: 'https://picsum.photos/300/450',
    genre: ['Comedy', 'Family'],
  },
  {
    id: 6,
    title: 'Oppenheimer',
    rating: 4.9,
    year: 2023,
    image: 'https://picsum.photos/300/450',
    genre: ['Drama', 'History'],
  },
  {
    id: 7,
    title: 'Spider-Man: Into the Spider-Verse',
    rating: 4.9,
    year: 2018,
    image: 'https://picsum.photos/300/450',
    genre: ['Action', 'Animation', 'Adventure'],
  },
    {
    id: 8,
    title: 'Inception',
    rating: 4.7,
    year: 2010,
    image: 'https://picsum.photos/300/450',
    genre: ['Action', 'Sci-Fi', 'Thriller'],
  },
    {
    id: 9,
    title: 'The Matrix',
    rating: 4.6,
    year: 1999,
    image: 'https://picsum.photos/300/450',
    genre: ['Action', 'Sci-Fi'],
  },
    {
    id: 10,
    title: 'Parasite',
    rating: 4.9,
    year: 2019,
    image: 'https://picsum.photos/300/450',
    genre: ['Drama', 'Thriller'],
  },
]

const genres = ['All', 'Action', 'Adventure', 'Animation', 'Comedy', 'Drama', 'History', 'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Thriller', 'Family']
const years = ['All', ...Array.from(new Set(allMovies.map(m => m.year))).sort((a, b) => b - a)]
const ratings = ['All', 5, 4, 3, 2, 1]
const sortOptions = [
  { value: 'latest', label: 'Latest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'rating-desc', label: 'Rating High-Low' },
  { value: 'rating-asc', label: 'Rating Low-High' },
  { value: 'title-az', label: 'Title A-Z' },
  { value: 'title-za', label: 'Title Z-A' },
]

const PAGE_SIZE = 8 // Tăng số lượng phim mỗi trang

export default function MoviesPage() {
  const [selectedGenre, setSelectedGenre] = useState('All')
  const [search, setSearch] = useState('')
  const [selectedYear, setSelectedYear] = useState<string | number>('All') // Explicitly type as string | number
  const [selectedRating, setSelectedRating] = useState<string | number>('All') // Explicitly type as string | number
  const [sort, setSort] = useState('latest')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [movies, setMovies] = useState(allMovies)

  useEffect(() => {
    setLoading(true)
    // Simulate fetching/processing data
    const timeout = setTimeout(() => {
      let filtered = allMovies.filter(movie =>
        (selectedGenre === 'All' || movie.genre.includes(selectedGenre)) &&
        (selectedYear === 'All' || movie.year === selectedYear) &&
        (selectedRating === 'All' || (typeof selectedRating === 'number' && Math.floor(movie.rating) >= selectedRating)) && // Add typeof check
        movie.title.toLowerCase().includes(search.toLowerCase())
      )
      // Sort
      if (sort === 'latest') filtered = filtered.sort((a, b) => b.year - a.year)
      if (sort === 'oldest') filtered = filtered.sort((a, b) => a.year - b.year)
      if (sort === 'rating-desc') filtered = filtered.sort((a, b) => b.rating - a.rating)
      if (sort === 'rating-asc') filtered = filtered.sort((a, b) => a.rating - b.rating)
      if (sort === 'title-az') filtered = filtered.sort((a, b) => a.title.localeCompare(b.title))
      if (sort === 'title-za') filtered = filtered.sort((a, b) => b.title.localeCompare(a.title))
      setMovies(filtered)
      setPage(1) // Reset to first page on filter/sort change
      setLoading(false)
    }, 500)
    return () => clearTimeout(timeout)
  }, [selectedGenre, search, selectedYear, selectedRating, sort])

  // Pagination
  const totalPages = Math.ceil(movies.length / PAGE_SIZE)
  const pagedMovies = movies.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Animation variants for grid items
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-black to-gray-900 py-12 px-2 sm:px-4">
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
            {genres.map(g => (
              <motion.button
                key={g}
                onClick={() => setSelectedGenre(g)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-300 ${selectedGenre === g ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-md' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
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
                  onChange={e => setSelectedYear(e.target.value === 'All' ? 'All' : Number(e.target.value))}
                  className="appearance-none px-4 py-2 rounded-full bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer pr-8"
                >
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                 {/* Custom dropdown arrow */}
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
             
              <div className="relative">
                <select 
                  value={selectedRating}
                  onChange={e => setSelectedRating(e.target.value === 'All' ? 'All' : Number(e.target.value))}
                  className="appearance-none px-4 py-2 rounded-full bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer pr-8"
                >
                  {ratings.map(r => <option key={r} value={r}>{r === 'All' ? 'All Ratings' : `${r}★`}</option>)}
                </select>
                 {/* Custom dropdown arrow */}
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>

               <div className="relative">
                <select 
                  value={sort}
                  onChange={e => setSort(e.target.value)}
                  className="appearance-none px-4 py-2 rounded-full bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer pr-8"
                >
                  {sortOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                 {/* Custom dropdown arrow */}
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-auto sm:min-w-[250px]">
              <input
                type="text"
                placeholder="Search movies..."
                value={search}
                onChange={e => setSearch(e.target.value)}
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
                  transition: { staggerChildren: 0.08 } 
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
              {pagedMovies.map((movie) => (
                <motion.div
                  key={movie.id}
                  variants={itemVariants} // Apply item animation variants
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                >
                  <MovieCard {...movie} />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
        {!loading && movies.length > 0 && totalPages > 1 && (
           <Pagination page={page} totalPages={totalPages} onPageChange={p => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }} />
        )}
      </div>
    </main>
  )
} 