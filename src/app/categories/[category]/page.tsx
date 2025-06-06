'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { StarIcon, FilmIcon } from '@heroicons/react/24/solid'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import Image from 'next/image'

// Mock data - replace with actual API call
const mockMovies = [
  {
    id: 1,
    title: 'Action Movie 1',
    rating: 4.5,
    year: 2024,
    poster: `https://picsum.photos/300/450?random=${Math.random()}`,
    description: 'An exciting action-packed adventure that will keep you on the edge of your seat.',
  },
  {
    id: 2,
    title: 'Action Movie 2',
    rating: 4.2,
    year: 2023,
    poster: `https://picsum.photos/300/450?random=${Math.random()}`,
    description: 'A thrilling journey through danger and excitement.',
  },
  {
    id: 3,
    title: 'Action Movie 3',
    rating: 4.7,
    year: 2024,
    poster: `https://picsum.photos/300/450?random=${Math.random()}`,
    description: 'A heart-pounding action thriller that will leave you breathless.',
  },
  {
    id: 4,
    title: 'Action Movie 4',
    rating: 4.3,
    year: 2023,
    poster: `https://picsum.photos/300/450?random=${Math.random()}`,
    description: 'An epic adventure filled with stunning visuals and intense action sequences.',
  },
]

function MovieCard3D({ posterUrl }: { posterUrl: string }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const texture = new THREE.TextureLoader().load(posterUrl)

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.PI / 4
    }
  }, [])

  return (
    <mesh ref={meshRef} castShadow>
      <planeGeometry args={[2, 3]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  )
}

export default function CategoryMovies() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const category = searchParams.get('category') || 'default'
  const [movies] = useState(mockMovies)
  const [loading, setLoading] = useState(true)
  const [selectedMovie, setSelectedMovie] = useState<number | null>(null)
  const [sortBy, setSortBy] = useState<'rating' | 'year'>('rating')
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  })

  const y = useTransform(scrollYProgress, [0, 1], [0, -100])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  useEffect(() => {
    if (!category) {
      router.push('/?category=default')
    } else {
      setLoading(false)
    }
  }, [category, router])

  const sortedMovies = [...movies].sort((a, b) => {
    if (sortBy === 'rating') {
      return b.rating - a.rating
    }
    return b.year - a.year
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-black">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
          className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      {/* Hero Section */}
      <motion.div 
        style={{ y, opacity }}
        className="relative h-[40vh] w-full overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900 z-10" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Canvas className="w-full h-full">
            <PerspectiveCamera makeDefault position={[0, 0, 5]} />
            <OrbitControls enableZoom={false} />
            <ambientLight intensity={0.5} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
            <MovieCard3D 
              posterUrl={movies[0].poster}
            />
          </Canvas>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-8 z-20">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-bold text-white mb-4 capitalize"
          >
            {category} Movies
          </motion.h1>
        </div>
      </motion.div>

      {/* Sort Controls */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-end space-x-4">
          <button
            onClick={() => setSortBy('rating')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              sortBy === 'rating'
                ? 'bg-red-500 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Sort by Rating
          </button>
          <button
            onClick={() => setSortBy('year')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              sortBy === 'year'
                ? 'bg-red-500 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Sort by Year
          </button>
        </div>
      </div>

      {/* Movies Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {sortedMovies.map((movie, index) => (
            <motion.div
              key={movie.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05, rotateY: 5 }}
              className="group relative bg-gray-900/50 backdrop-blur-sm rounded-xl overflow-hidden shadow-2xl"
              onMouseEnter={() => setSelectedMovie(movie.id)}
              onMouseLeave={() => setSelectedMovie(null)}
            >
              <Link href={`/movies/${movie.id}`}>
                <div className="aspect-[2/3] relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
                  <Image
                    src={movie.poster}
                    alt={movie.title}
                    width={300}
                    height={450}
                    className="w-full h-full object-cover"
                  />

                  <AnimatePresence>
                    {selectedMovie === movie.id && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 p-4 flex flex-col justify-end z-20"
                      >
                        <p className="text-sm text-gray-300 line-clamp-3">
                          {movie.description}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-red-500 transition-colors">
                    {movie.title}
                  </h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <StarIcon className="h-5 w-5 text-yellow-500" />
                      <span className="text-yellow-500">{movie.rating}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FilmIcon className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-400">{movie.year}</span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}