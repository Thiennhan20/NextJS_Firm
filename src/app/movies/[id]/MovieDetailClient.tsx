'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { StarIcon, ClockIcon, CalendarIcon } from '@heroicons/react/24/solid'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, useGLTF } from '@react-three/drei'
import * as THREE from 'three'

// Mock data - replace with actual API call
const mockMovie = {
  id: 1,
  title: 'The Amazing Movie',
  description: 'A thrilling adventure that takes you on a journey through time and space.',
  rating: 4.5,
  duration: '2h 15m',
  releaseDate: '2024-03-15',
  genre: ['Action', 'Adventure', 'Sci-Fi'],
  director: 'John Director',  
  cast: ['Actor One', 'Actor Two', 'Actor Three'],
  poster: `https://picsum.photos/id/${Math.floor(Math.random() * 1000)}/300/450`,
  trailer: `https://www.youtube.com/embed/${['dQw4w9WgXcQ', 'oHg5SJYRHA0', 'jNQXAC9IVRw'][Math.floor(Math.random() * 3)]}`,
}

function MoviePoster3D({ posterUrl }: { posterUrl: string }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const texture = new THREE.TextureLoader().load(posterUrl)

  useEffect(() => {
    if (!meshRef.current) return

    const animate = () => {
      if (meshRef.current) {
        meshRef.current.rotation.y += 0.005
      }
      requestAnimationFrame(animate)
    }
    animate()
  }, [])

  return (
    <mesh ref={meshRef} castShadow>
      <boxGeometry args={[2, 3, 0.1]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  )
}

export default function MovieDetailClient({ movieId }: { movieId: string }) {
  const [movie, setMovie] = useState(mockMovie)
  const [loading, setLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  })

  const y = useTransform(scrollYProgress, [0, 1], [0, -300])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (isMounted) {
      setLoading(true)
      const timer = setTimeout(() => {
        setLoading(false)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [movieId, isMounted])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-black">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
          className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full"
        />
        <p className="mt-4 text-gray-400 text-lg">Loading Movie Details...</p>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      {/* Hero Section with 3D Poster */}
      <motion.div 
        style={{ y, opacity }}
        className="relative h-[70vh] w-full overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900 z-10" />
        <Canvas className="absolute inset-0">
          <PerspectiveCamera makeDefault position={[0, 0, 5]} />
          <OrbitControls enableZoom={false} enablePan={false} />
          <ambientLight intensity={0.5} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
          <pointLight position={[-10, -10, -10]} intensity={0.5} />
          <MoviePoster3D posterUrl={movie.poster} />
        </Canvas>
        <div className="absolute bottom-0 left-0 right-0 p-8 z-20">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-bold text-white mb-4"
          >
            {movie.title}
          </motion.h1>
        </div>
      </motion.div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {/* Movie Info */}
          <div className="md:col-span-2 space-y-8">
            <div className="flex items-center space-x-6">
              <div className="flex items-center bg-yellow-500/10 px-4 py-2 rounded-full">
                <StarIcon className="h-5 w-5 text-yellow-500 mr-2" />
                <span className="text-yellow-500">{movie.rating}/5</span>
              </div>
              <div className="flex items-center bg-gray-800 px-4 py-2 rounded-full">
                <ClockIcon className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-gray-300">{movie.duration}</span>
              </div>
              <div className="flex items-center bg-gray-800 px-4 py-2 rounded-full">
                <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-gray-300">{movie.releaseDate}</span>
              </div>
            </div>

            <p className="text-gray-300 text-lg leading-relaxed">{movie.description}</p>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Genre</h3>
                <div className="flex flex-wrap gap-2">
                  {movie.genre.map((g) => (
                    <motion.span
                      key={g}
                      whileHover={{ scale: 1.05 }}
                      className="px-4 py-2 bg-red-600/20 text-red-500 rounded-full text-sm font-medium"
                    >
                      {g}
                    </motion.span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Director</h3>
                <p className="text-gray-300 text-lg">{movie.director}</p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Cast</h3>
                <div className="flex flex-wrap gap-4">
                  {movie.cast.map((actor) => (
                    <motion.div
                      key={actor}
                      whileHover={{ scale: 1.05 }}
                      className="bg-gray-800/50 px-4 py-2 rounded-lg"
                    >
                      <p className="text-gray-300">{actor}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Trailer Section */}
          <div className="md:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="sticky top-8"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Trailer</h2>
              <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden shadow-2xl">
                <iframe
                  src={movie.trailer}
                  className="w-full h-full"
                  allowFullScreen
                />
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  )
} 