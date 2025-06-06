'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import Pagination from '@/components/Pagination'
import Image from 'next/image'
// Mock data - replace with actual API call
const categories = [
  {
    id: 'action',
    name: 'Action',
    description: 'High-energy films with intense sequences and thrilling stunts',
    count: 150,
    image: 'https://picsum.photos/400/250',
  },
  {
    id: 'comedy',
    name: 'Comedy',
    description: 'Light-hearted films designed to make you laugh',
    count: 200,
    image: 'https://picsum.photos/400/250',
  },
  {
    id: 'drama',
    name: 'Drama',
    description: 'Character-driven stories with emotional depth',
    count: 180,
    image: 'https://picsum.photos/400/250',
  },
  {
    id: 'sci-fi',
    name: 'Science Fiction',
    description: 'Futuristic and imaginative stories about technology and space',
    count: 120,
    image: 'https://picsum.photos/400/250',
  },
  {
    id: 'horror',
    name: 'Horror',
    description: 'Scary and suspenseful films to keep you on edge',
    count: 90,
    image: 'https://picsum.photos/400/250',
  },
  {
    id: 'romance',
    name: 'Romance',
    description: 'Stories about love and relationships',
    count: 160,
    image: 'https://picsum.photos/400/250',
  },
  {
    id: 'animation',
    name: 'Animation',
    description: 'Animated films for all ages',
    count: 110,
    image: 'https://picsum.photos/400/250',
  },
  {
    id: 'thriller',
    name: 'Thriller',
    description: 'Suspenseful movies that keep you on the edge of your seat',
    count: 130,
    image: 'https://picsum.photos/400/250',
  },
  {
    id: 'family',
    name: 'Family',
    description: 'Movies suitable for the whole family',
    count: 170,
    image: 'https://picsum.photos/400/250',
  },
]

const sortOptions = [
  { value: 'name-az', label: 'Name A-Z' },
  { value: 'name-za', label: 'Name Z-A' },
  { value: 'count-desc', label: 'Most Movies' },
  { value: 'count-asc', label: 'Least Movies' },
]
const PAGE_SIZE = 6 // Tăng số lượng thể loại mỗi trang

export default function Categories() {
  const [sort, setSort] = useState('name-az')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [sortedCategories, setSortedCategories] = useState(categories)

  useEffect(() => {
    setLoading(true)
    // Simulate fetching/processing data
    const timeout = setTimeout(() => {
      let sorted = [...categories]
      if (sort === 'name-az') sorted = sorted.sort((a, b) => a.name.localeCompare(b.name))
      if (sort === 'name-za') sorted = sorted.sort((a, b) => b.name.localeCompare(a.name))
      if (sort === 'count-desc') sorted = sorted.sort((a, b) => b.count - a.count)
      if (sort === 'count-asc') sorted = sorted.sort((a, b) => a.count - b.count)
      setSortedCategories(sorted)
      setPage(1) // Reset to first page on sort change
      setLoading(false)
    }, 500)
    return () => clearTimeout(timeout)
  }, [sort])

  const totalPages = Math.ceil(sortedCategories.length / PAGE_SIZE)
  const pagedCategories = sortedCategories.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

   // Animation variants for grid items
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  return (
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
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
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
                        src={category.image} 
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
                      <h2 className="text-2xl font-semibold mb-2 bg-gradient-to-r from-pink-400 to-blue-400 text-transparent bg-clip-text">
                        {category.name}
                      </h2>
                      <p className="text-gray-400 mb-2 line-clamp-2">{category.description}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
        {!loading && sortedCategories.length > 0 && totalPages > 1 && (
           <div className="mt-10">
             <Pagination page={page} totalPages={totalPages} onPageChange={p => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }} />
            </div>
        )}

      </div>
    </main>
  )
} 