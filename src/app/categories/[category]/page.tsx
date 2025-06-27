'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { StarIcon, FilmIcon } from '@heroicons/react/24/solid'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import Image from 'next/image'
import axios from 'axios'

interface Movie {
  id: number;
  title: string;
  poster_path: string;
  rating?: number;
  year?: number;
  poster?: string;
  description?: string;
  genre?: string;
  director?: string;
  cast?: string[];
  trailer?: string;
  vote_average?: number;
  release_date?: string;
  overview?: string;
}

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
  const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
  const params = useSearchParams();
  const category = params.get('category');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
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
    if (!category) return;
    const fetchMovies = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_genres=${category}`
        );
        const movies = response.data.results.map((movie: Movie) => ({
          id: movie.id,
          title: movie.title,
          rating: movie.vote_average,
          year: movie.release_date ? Number(movie.release_date.slice(0, 4)) : '',
          poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '',
          description: movie.overview,
        }));
        setMovies(movies);
      } catch (error) {
        console.error(error);
        setMovies([]);
      }
      setLoading(false);
    };
    fetchMovies();
  }, [category, API_KEY]);

  const sortedMovies = [...movies].sort((a, b) => {
    if (sortBy === 'rating') {
      return (b.rating ?? 0) - (a.rating ?? 0)
    }
    return (b.year ?? 0) - (a.year ?? 0)
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
              posterUrl={movies[0].poster ?? ''}
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
          {loading ? (
            <div className="text-center text-gray-400 py-8 col-span-full">Loading...</div>
          ) : (
            sortedMovies.map((movie, index) => (
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
                      src={movie.poster ?? ''}
                      alt={movie.title ?? ''}
                      fill
                      style={{ objectFit: 'cover' }}
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
                            {movie.description ?? ''}
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
                        <span className="text-yellow-500">{movie.rating ?? 0}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <FilmIcon className="h-5 w-5 text-gray-400" />
                        <span className="text-gray-400">{movie.year ?? ''}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}