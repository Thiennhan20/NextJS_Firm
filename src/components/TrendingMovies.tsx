'use client'

import { useRef } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
const trending = [
  {
    id: 101,
    title: 'Guardians of the Galaxy',
    image: 'https://picsum.photos/400/600',
    rating: 4.7,
    year: 2023,
  },
  {
    id: 102,
    title: 'Spider-Man: No Way Home',
    image: 'https://picsum.photos/400/600',
    rating: 4.8,
    year: 2022,
  },
  {
    id: 103,
    title: 'Dune',
    image: 'https://picsum.photos/400/600',
    rating: 4.6,
    year: 2023,
  },
  {
    id: 104,
    title: 'Oppenheimer',
    image: 'https://picsum.photos/400/600',
    rating: 4.9,
    year: 2023,
  },
  {
    id: 105,
    title: 'Barbie',
    image: 'https://picsum.photos/400/600',
    rating: 4.2,
    year: 2023,
  },
]

export default function TrendingMovies() {
  const scrollRef = useRef<HTMLDivElement>(null)

  return (
    <section className="py-16 px-2 sm:px-4 bg-gradient-to-b from-gray-900 to-black">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl sm:text-4xl font-bold mb-8 bg-gradient-to-r from-yellow-400 to-pink-500 text-transparent bg-clip-text text-center">
          Top Trending Movies
        </h2>
        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900 snap-x snap-mandatory"
        >
          {trending.map((movie) => (
            <motion.div
              key={movie.id}
              whileHover={{ scale: 1.07 }}
              className="min-w-[220px] sm:min-w-[260px] max-w-[260px] bg-gray-800 rounded-xl overflow-hidden shadow-lg snap-center cursor-pointer group relative"
            >
              <Image
                src={movie.image}
                alt={movie.title}
                width={400}
                height={600}
                className="w-full h-72 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-3 right-3 bg-black/70 px-2 py-1 rounded-full text-xs text-yellow-400 font-bold">
                ★ {movie.rating}
              </div>
              <div className="p-4">
                <div className="font-semibold text-lg text-white mb-1 truncate">{movie.title}</div>
                <div className="text-gray-400 text-sm">{movie.year}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
} 