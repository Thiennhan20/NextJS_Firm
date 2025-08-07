'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ClockIcon, CalendarIcon } from '@heroicons/react/24/solid'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Float } from '@react-three/drei'
import * as THREE from 'three'
import axios from 'axios'

// Định nghĩa kiểu Movie rõ ràng nếu cần
interface Movie {
  id: number;
  title: string;
  poster_path: string;
  poster?: string;

  duration?: string;
  releaseDate?: string;
  description?: string;
  genre?: string;
  director?: string;
  cast?: string[];
  trailer?: string;
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

export default function MovieDetail() {
  const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
  const { id } = useParams();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
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
    if (isMounted && id) {
      const fetchMovie = async () => {
        setLoading(true);
                try {
          const response = await axios.get(
            `https://api.themoviedb.org/3/movie/${id}?api_key=${API_KEY}`
          );
          const data = response.data;
          
          // Fetch credits for director and cast
          const creditsResponse = await axios.get(
            `https://api.themoviedb.org/3/movie/${id}/credits?api_key=${API_KEY}`
          );
          const credits = creditsResponse.data;
          
          setMovie({
            id: data.id,
            title: data.title,
            description: data.overview,

            duration: data.runtime ? `${Math.floor(data.runtime / 60)}h ${data.runtime % 60}m` : '',
            releaseDate: data.release_date,
            genre: data.genres ? data.genres.map((g: { name: string }) => g.name) : [],
            director: credits.crew?.find((person: { job: string; name: string }) => person.job === 'Director')?.name || '',
            cast: credits.cast?.slice(0, 10).map((person: { name: string }) => person.name) || [],
            poster: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : '',
            trailer: '', // Có thể fetch thêm videos nếu muốn
            poster_path: data.poster_path,
          });
        } catch (error) {
          console.error(error);
          setMovie(null);
        }
        setLoading(false);
      };
      fetchMovie();
    }
  }, [id, isMounted, API_KEY]);

  if (loading || !movie) {
    return <div className="text-center text-gray-400 py-8">Loading...</div>;
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
          <ambientLight intensity={1.2} />
          <spotLight position={[10, 10, 10]} angle={0.2} penumbra={1} intensity={2} castShadow />
          <pointLight position={[-10, -10, -10]} intensity={1} />
          <Float speed={1.2} rotationIntensity={0.25} floatIntensity={0.3}>
            <MoviePoster3D posterUrl={`/api/cache-image?id=${movie.id}&url=${encodeURIComponent(movie.poster ?? '')}&bust=${Date.now()}`} />
          </Float>
          {/* Glow effect */}
          <mesh position={[0, 0, -0.1]}>
            <planeGeometry args={[2.2, 3.2]} />
            <meshBasicMaterial color={'#fff'} transparent opacity={0.12} />
          </mesh>
        </Canvas>
        <div className="absolute bottom-0 left-0 right-0 p-8 z-20">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-bold text-white mb-4 drop-shadow-[0_2px_16px_rgba(255,255,255,0.7)]"
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
                  {(Array.isArray(movie.genre) ? movie.genre : [movie.genre ?? '']).map((g: string) => (
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
                  {(Array.isArray(movie.cast) ? movie.cast : [movie.cast ?? '']).map((actor: string) => (
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