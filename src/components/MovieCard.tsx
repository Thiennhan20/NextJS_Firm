'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { StarIcon, PlayIcon } from '@heroicons/react/24/solid'

interface MovieCardProps {
  id: number
  title: string
  rating: number
  year: number
  image: string
  genre: string[]
}

export default function MovieCard({ id, title, rating, year, image, genre }: MovieCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.07, boxShadow: '0 8px 32px 0 rgba(255,0,80,0.25)' }}
      className="group relative bg-gray-900 rounded-xl overflow-hidden shadow-2xl"
    >
      <Link href={`/movies/${id}`}>
        <div className="relative aspect-[2/3] overflow-hidden">
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10 transition-all duration-300 group-hover:opacity-80 group-hover:bg-black/60" />
          
          {/* Movie Image */}
          <div 
            className="w-full h-full bg-cover bg-center transform group-hover:scale-110 transition-transform duration-500"
            style={{ backgroundImage: `url(${image})` }}
          />

          {/* Play Button */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-600/30"
            >
              <PlayIcon className="w-8 h-8 text-white" />
            </motion.div>
          </div>

          {/* Rating Badge */}
          <div className="absolute top-4 right-4 bg-black/80 px-3 py-1 rounded-full flex items-center space-x-1 z-20">
            <StarIcon className="w-4 h-4 text-yellow-500" />
            <span className="text-white text-sm font-medium">{rating}</span>
          </div>

          {/* Overlay Button */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 opacity-0 group-hover:opacity-100 transition-all duration-300">
            <button className="bg-white/90 hover:bg-red-600 hover:text-white text-red-600 font-bold px-6 py-2 rounded-full shadow-lg transition-all">Xem chi tiết</button>
          </div>
        </div>

        {/* Movie Info */}
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-2 line-clamp-1">{title}</h3>
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">{year}</span>
            <div className="flex space-x-2">
              {genre.slice(0, 2).map((g) => (
                <span
                  key={g}
                  className="text-xs px-2 py-1 bg-red-600/20 text-red-400 rounded-full"
                >
                  {g}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Hover Effect Border */}
        <div className="absolute inset-0 border-2 border-red-600/0 group-hover:border-red-600/50 rounded-xl transition-colors duration-300" />
      </Link>
    </motion.div>
  )
}