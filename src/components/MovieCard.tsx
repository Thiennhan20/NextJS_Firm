'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { PlayIcon } from '@heroicons/react/24/solid'

interface MovieCardProps {
  id: number
  title: string
  year: number
  release_date?: string
  image: string
  genre: string[]
  status?: 'Full HD' | 'Full HD/CAM' | 'Coming Soon' | 'Non'
}

export default function MovieCard({ id, title, year, release_date, image, genre, status }: MovieCardProps) {
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

          {/* Status Badge */}
          {status && (
            <div className="absolute top-2 left-2 z-20">
              <span className={`px-2 py-1 text-xs font-bold rounded-md ${
                status === 'Full HD' ? 'bg-green-500 text-white' :
                status === 'Full HD/CAM' ? 'bg-red-500 text-white' :
                status === 'Coming Soon' ? 'bg-yellow-500 text-black' :
                status === 'Non' ? 'bg-gray-500 text-white' :
                'bg-yellow-500 text-black'
              }`}>
                {status}
              </span>
            </div>
          )}

          {/* Play Button */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-600/30"
            >
              <PlayIcon className="w-8 h-8 text-white" />
            </motion.div>
          </div>



          {/* Overlay Button */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 opacity-0 group-hover:opacity-100 transition-all duration-300">
            <button className="bg-white/90 hover:bg-red-600 hover:text-white text-red-600 font-bold px-6 py-2 rounded-full shadow-lg transition-all">See details</button>
          </div>
        </div>

        {/* Movie Info */}
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-2 line-clamp-1 text-white">{title}</h3>
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">
              {release_date ? new Date(release_date).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              }) : year}
            </span>
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