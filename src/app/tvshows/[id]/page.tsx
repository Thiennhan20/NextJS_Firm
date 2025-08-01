'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import Image from 'next/image'
import { ClockIcon, CalendarIcon, PlayIcon } from '@heroicons/react/24/solid'
import { BookmarkIcon } from '@heroicons/react/24/outline'
import { useWatchlistStore } from '@/store/store'
import toast from 'react-hot-toast'
import axios from 'axios'
import { useParams } from 'next/navigation'
import useAuthStore from '@/store/useAuthStore'
import api from '@/lib/axios'
// import MoviePlayer from '@/components/common/MoviePlayer' // Temporarily disabled

// Định nghĩa kiểu TVShow rõ ràng
interface TVShow {
  id: number
  name: string

  duration: string
  year: number | ''
  creator: string
  cast: string[]
  genre: string
  description: string
  poster: string
  backdrop: string
  trailer: string
  tvShowUrl: string
  scenes: string[]
  status?: 'Full HD' | 'Full HD/CAM' | 'Coming Soon' | 'Non'
  totalSeasons?: number
  totalEpisodes?: number
}

// Temporarily disabled - Episode interface
/*
interface Episode {
  id: number
  name: string
  episode_number: number
  season_number: number
  still_path?: string
  overview?: string
  air_date?: string
}
*/





interface Person {
  name: string
  job?: string
}

function TVShowPoster3D({ posterUrl }: { posterUrl: string }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const texture = new THREE.TextureLoader().load(posterUrl)

  useEffect(() => {
    let frameId: number;
    const start = Date.now();
    const maxY = 0.35;
    const maxX = 0.1;

    const animate = () => {
      if (meshRef.current) {
        const t = (Date.now() - start) / 1000;
        meshRef.current.rotation.y = Math.sin(t) * maxY;
        meshRef.current.rotation.x = Math.sin(t * 0.7) * maxX;
      }
      frameId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <mesh ref={meshRef} castShadow>
      <planeGeometry args={[2, 3]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  )
}

export default function TVShowDetail() {
  const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY
  const { id } = useParams()
  const [tvShow, setTVShow] = useState<TVShow | null>(null)
  
  // Hàm tạo status cho TV show dựa trên ngày phát hành
  const generateTVShowStatus = (firstAirDate?: string): 'Full HD' | 'Full HD/CAM' | 'Coming Soon' | 'Non' => {
    if (!firstAirDate) return 'Coming Soon'
    
    const firstAirDateObj = new Date(firstAirDate)
    const currentDate = new Date()
    const firstAirYear = firstAirDateObj.getFullYear()
    
    // Trường hợp Non: TV show từ 1990 trở về quá khứ
    if (firstAirYear < 1990) return 'Non'
    
    // Tính khoảng cách thời gian giữa ngày hiện tại và ngày phát hành (tính bằng tuần)
    const timeDiffInMs = currentDate.getTime() - firstAirDateObj.getTime()
    const timeDiffInWeeks = timeDiffInMs / (1000 * 60 * 60 * 24 * 7)
    
    // Trường hợp Coming Soon: TV show chưa phát hành (trước thời điểm hiện tại)
    if (timeDiffInWeeks < 0) return 'Coming Soon'
    
    // Trường hợp Full HD/CAM: TV show mới xuất hiện dưới 2 tuần
    if (timeDiffInWeeks < 2) return 'Full HD/CAM'
    
    // Trường hợp Full HD: TV show đã xuất hiện hơn 2 tuần
    return 'Full HD'
  }
  
  const [loading, setLoading] = useState<boolean>(true)
  const [activeScene, setActiveScene] = useState<number | null>(null)
  const [showTrailer, setShowTrailer] = useState<boolean>(false)
  // const [showTVShow, setShowTVShow] = useState<boolean>(false) // Temporarily disabled
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  })

  const { addToWatchlist, removeFromWatchlist, isInWatchlist, fetchWatchlistFromServer } = useWatchlistStore()
  const { isAuthenticated, token } = useAuthStore()
  const isBookmarked = tvShow ? isInWatchlist(tvShow.id) : false

  const handleToggleWatchlist = async () => {
    if (!tvShow) return
    if (!isAuthenticated) {
      toast.error('You need to log in to save TV shows!')
      return
    }
    try {
      if (isBookmarked) {
        await api.delete('/auth/watchlist', {
          data: { id: tvShow.id },
        })
        removeFromWatchlist(tvShow.id)
        toast.success('Removed TV show from watchlist!')
        if (token) await fetchWatchlistFromServer(token)
      } else {
        await api.post('/auth/watchlist', {
          id: tvShow.id,
          title: tvShow.name,
          poster_path: tvShow.poster,
        })
        addToWatchlist({
          id: tvShow.id,
          title: tvShow.name,
          poster_path: tvShow.poster,
        })
        toast.success('Added TV show to watchlist!')
        if (token) await fetchWatchlistFromServer(token)
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'An error occurred')
      } else {
        toast.error('An error occurred')
      }
    }
  }

  {/* Temporarily disabled - Episode-related state and functions
  const [showEpisodeModal, setShowEpisodeModal] = useState(false)
  const [selectedEpisode, setSelectedEpisode] = useState<number>(1)
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [episodesLoading, setEpisodesLoading] = useState(false)
  const [showServerModal, setShowServerModal] = useState(false)
  const [selectedServer, setSelectedServer] = useState<string | null>(null)

  const handleWatchTVShow = async () => {
    if (!tvShow) return
    setShowEpisodeModal(true)
  }

  const handleEpisodeSelect = (episode: number) => {
    setSelectedEpisode(episode)
    setShowEpisodeModal(false)
    setShowServerModal(true)
  }
  */}

  const y = useTransform(scrollYProgress, [0, 1], [0, -100])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  {/* Temporarily disabled - TV show links state
  const [tvShowLinks, setTVShowLinks] = useState({
    embed: '',
    m3u8: '',
  })
  const [tvShowLinksLoading, setTVShowLinksLoading] = useState(false)
  */}

  useEffect(() => {
    const fetchTVShow = async () => {
      setLoading(true)
      try {
        const response = await axios.get(
          `https://api.themoviedb.org/3/tv/${id}?api_key=${API_KEY}`
        )
        const data = response.data
        let scenes: string[] = []
        try {
          const imgRes = await axios.get(
            `https://api.themoviedb.org/3/tv/${id}/images?api_key=${API_KEY}`
          )
          const backdrops: { file_path: string }[] = imgRes.data.backdrops || []
          scenes = backdrops.slice(0, 3).map((img) => `https://image.tmdb.org/t/p/w780${img.file_path}`)
        } catch {}
        if (scenes.length < 3) {
          if (data.backdrop_path) scenes.push(`https://image.tmdb.org/t/p/w780${data.backdrop_path}`)
          if (data.poster_path) scenes.push(`https://image.tmdb.org/t/p/w500${data.poster_path}`)
        }
        scenes = scenes.slice(0, 3)
        let trailer = ''
        try {
          const videoRes = await axios.get(
            `https://api.themoviedb.org/3/tv/${id}/videos?api_key=${API_KEY}`
          )
          const videos: { type: string; site: string; key: string }[] = videoRes.data.results || []
          const ytTrailer = videos.find((v) => v.type === 'Trailer' && v.site === 'YouTube')
          if (ytTrailer) {
            trailer = `https://www.youtube.com/embed/${ytTrailer.key}`
          }
        } catch {}
        
        // Fetch credits for cast and creator
        const creditsResponse = await axios.get(
          `https://api.themoviedb.org/3/tv/${id}/credits?api_key=${API_KEY}`
        )
        const credits = creditsResponse.data
        
        const tvShowData = {
          id: data.id,
          name: data.name,

          duration: data.episode_run_time && data.episode_run_time.length > 0 
            ? `${data.episode_run_time[0]}m` : '',
          year: data.first_air_date ? Number(data.first_air_date.slice(0, 4)) : '' as number | '',
          creator: credits.crew?.find((person: Person) => person.job === 'Creator')?.name || '',
          cast: credits.cast?.slice(0, 10).map((person: Person) => person.name) || [],
          genre: data.genres ? data.genres.map((g: { name: string }) => g.name).join(', ') : '',
          description: data.overview,
          poster: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : '',
          backdrop: data.backdrop_path ? `https://image.tmdb.org/t/p/original${data.backdrop_path}` : '',
          trailer,
          tvShowUrl: '',
          scenes,
          status: generateTVShowStatus(data.first_air_date),
          totalSeasons: data.number_of_seasons,
          totalEpisodes: data.number_of_episodes,
        }
        setTVShow(tvShowData)
      } catch {
        setTVShow(null)
      }
      setLoading(false)
    }
    fetchTVShow()
  }, [id, API_KEY])

  {/* Temporarily disabled - Fetch episodes when TV show data is loaded
  useEffect(() => {
    if (tvShow?.id) {
      setEpisodesLoading(true)
      const fetchEpisodes = async () => {
        try {
          const response = await axios.get(
            `https://api.themoviedb.org/3/tv/${tvShow.id}/season/1?api_key=${API_KEY}`
          )
          const data = response.data
          if (data.episodes) {
            setEpisodes(data.episodes)
          }
        } catch (error) {
          console.error('Error fetching episodes:', error)
        } finally {
          setEpisodesLoading(false)
        }
      }
      fetchEpisodes()
    }
  }, [tvShow?.id, API_KEY])
  */}

  {/* Temporarily disabled - Subtitles fetch
  useEffect(() => {
    if (tvShow?.name && tvShow?.year) {
      setTVShowLinksLoading(true)
      fetch(`/api/subtitles?query=${encodeURIComponent(tvShow.name)}&year=${tvShow.year.toString()}`)
        .then(res => res.json())
        .then(() => {})
        .catch(() => {})
        .finally(() => setTVShowLinksLoading(false))
    }
  }, [tvShow?.name, tvShow?.year])
  */}

  // const videoRef = useRef<HTMLVideoElement>(null) // Temporarily disabled

  {/* Temporarily disabled - TV show watching state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as { isWatchingFullTVShow?: boolean }).isWatchingFullTVShow = showTVShow
    }
  }, [showTVShow])
  */}

  {/* Temporarily disabled - Fetch PhimAPI embed
  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    async function fetchPhimApiEmbed() {
      if (tvShowLinks.m3u8) return
      setTVShowLinksLoading(true)
      timeoutId = setTimeout(() => {}, 60000)
      try {
        if (typeof id !== 'string') {
          return
        }
        let slug = null
        let logged = false
        if (tvShow?.name) {
          const keywords = [tvShow.name].filter(Boolean)
          outer: for (const keyword of keywords) {
            for (const y of [tvShow.year as number, undefined]) {
              let url = `https://phimapi.com/v1/api/tim-kiem?keyword=${encodeURIComponent(keyword)}`
              if (y) url += `&year=${y}`
              if (!logged) {
                logged = true
              }
              const res = await fetch(url)
              const data = await res.json()
              if (
                data.status === 'success' &&
                data.data &&
                Array.isArray(data.data.items) &&
                data.data.items.length > 0 &&
                data.data.items[0].slug
              ) {
                slug = data.data.items[0].slug
                break outer
              }
            }
          }
        }
        if (!slug) {
          return
        }
        const detailRes = await fetch(`https://phimapi.com/phim/${slug}`)
        const detailData = await detailRes.json()
        let embed = ''
        if (detailData.link_embed) {
          embed = detailData.link_embed
          if (embed.includes('?url=')) {
            embed = embed.split('?url=')[1]
          }
        } else if (detailData.episodes && detailData.episodes[0]?.server_data[0]?.link_embed) {
          embed = detailData.episodes[0].server_data[0].link_embed
          if (embed.includes('?url=')) {
            embed = embed.split('?url=')[1]
          }
        }
        if (embed) {
          setTVShowLinks(links => ({ ...links, m3u8: embed }))
          setTVShowLinksLoading(false)
        }
      } catch (e) {
        console.error('Lỗi khi fetch phimapi:', e)
      } finally {
        clearTimeout(timeoutId)
      }
    }
    fetchPhimApiEmbed()
  }, [id, tvShow?.name, tvShow?.year, tvShowLinks.m3u8])
  */}

  if (loading || !tvShow) {
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

  const { name, backdrop, poster, duration, year, genre, creator, cast, description, scenes, trailer, status, totalSeasons, totalEpisodes } = tvShow

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      <div className="relative w-full overflow-hidden py-16 lg:py-0 min-h-screen flex items-center">
        <div className="absolute inset-0">
          <Image
            src={backdrop}
            alt={name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black" />
        </div>
        
        <motion.div
          style={{ y, opacity }}
          className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center"
        >
          <div className="relative h-[40vh] md:h-[50vh] lg:h-[60vh] w-full flex items-center justify-center mb-8 lg:mb-0">
            {poster && poster.startsWith('https://image.tmdb.org') ? (
              <Canvas className="w-full h-full">
                <PerspectiveCamera makeDefault position={[0, 0, 5]} />
                <OrbitControls 
                  enableZoom={false}
                  minAzimuthAngle={-0.35}
                  maxAzimuthAngle={0.35}
                  minPolarAngle={Math.PI / 2 - 0.175}
                  maxPolarAngle={Math.PI / 2 + 0.175}
                  rotateSpeed={0.5}
                />
                <ambientLight intensity={0.5} />
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
                <TVShowPoster3D posterUrl={`/api/proxy-image?url=${encodeURIComponent(poster ?? '')}`} />
              </Canvas>
            ) : poster ? (
              <Image
                src={poster}
                alt={name}
                width={300}
                height={450}
                className="rounded-lg shadow-lg object-cover"
                style={{ maxHeight: '100%', maxWidth: '100%' }}
              />
            ) : (
              <div className="w-[300px] h-[450px] bg-gray-700 rounded-lg flex items-center justify-center">
                <span className="text-4xl">📺</span>
              </div>
            )}
          </div>
          
          <div className="text-white space-y-6">
            <div className="flex items-center gap-4">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl md:text-5xl font-bold"
              >
                {name}
              </motion.h1>
              {status && (
                <span className={`px-3 py-1 text-sm font-bold rounded-md ${
                  status === 'Full HD' ? 'bg-green-500 text-white' :
                  status === 'Full HD/CAM' ? 'bg-red-500 text-white' :
                  status === 'Coming Soon' ? 'bg-yellow-500 text-black' :
                  status === 'Non' ? 'bg-gray-500 text-white' :
                  'bg-yellow-500 text-black'
                }`}>
                  {status}
                </span>
              )}
            </div>
            
            <div className="flex flex-wrap gap-4">
              
              <div className="flex items-center space-x-2">
                <ClockIcon className="h-6 w-6 text-gray-400" />
                <span className="text-gray-400">{duration}</span>
              </div>
              <div className="flex items-center space-x-2">
                <CalendarIcon className="h-6 w-6 text-gray-400" />
                <span className="text-gray-400">{year}</span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-gray-300">{genre}</p>
              <p className="text-gray-300">Creator: {creator}</p>
              {totalSeasons && totalEpisodes && (
                <p className="text-gray-300">
                  {totalSeasons} Season{totalSeasons > 1 ? 's' : ''} • {totalEpisodes} Episode{totalEpisodes > 1 ? 's' : ''}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {cast.map((actor: string, index: number) => (
                  <span key={index} className="px-3 py-1 bg-gray-800 rounded-full text-sm">
                    {actor}
                  </span>
                ))}
              </div>
            </div>

            <p className="text-gray-300 leading-relaxed">
              {description}
            </p>

            <div className="flex flex-wrap gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowTrailer(true)}
                className="px-6 py-3 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors flex items-center gap-2"
              >
                <PlayIcon className="h-5 w-5" />
                Watch Trailer
              </motion.button>
              
              {/* Temporarily disabled - Watch Episodes functionality
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleWatchTVShow}
                  className="px-6 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors flex items-center gap-2"
                >
                  <PlayIcon className="h-5 w-5" />
                  Watch Episodes
                </motion.button>
              </div>
              */}

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleToggleWatchlist}
                className={`px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                  isBookmarked
                    ? 'bg-yellow-600 text-black hover:bg-yellow-700'
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
              >
                <BookmarkIcon className="h-5 w-5" />
                {isBookmarked ? 'Added to list' : 'Save to list'}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-white">
        <h2 className="text-3xl font-bold mb-6">About This TV Show</h2>
        <p className="text-gray-300 mb-6">
          Experience this amazing TV series in full HD quality. Click the &quot;Watch Episodes&quot; button above to select and stream your favorite episodes.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Episode Selection</h3>
            <p className="text-gray-300">Choose from multiple seasons and episodes with detailed information.</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">High Quality</h3>
            <p className="text-gray-300">Stream in crisp HD quality with optimal loading speeds.</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Instant Access</h3>
            <p className="text-gray-300">No downloads required. Watch immediately in your browser.</p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showTrailer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setShowTrailer(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative w-full max-w-4xl aspect-video"
              onClick={e => e.stopPropagation()}
            >
              <iframe
                src={trailer}
                className="w-full h-full rounded-lg"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              <button
                className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/80 transition-colors"
                onClick={() => setShowTrailer(false)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Temporarily disabled - Episode Selection Modal */}

      {/* Temporarily disabled - Server Selection Modal */}

      {/* Temporarily disabled - TV Show Player Modal */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold text-white mb-8">TV Show Scenes</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {scenes.map((scene: string, index: number) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
              className="relative aspect-video rounded-xl overflow-hidden cursor-pointer"
              onClick={() => setActiveScene(index)}
            >
              <Image
                src={scene}
                alt={`Scene ${index + 1}`}
                fill
                className="object-cover transition-transform hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-lg font-semibold">View Scene {index + 1}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {activeScene !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setActiveScene(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative w-full max-w-4xl aspect-video"
              onClick={e => e.stopPropagation()}
            >
              <Image
                src={scenes[activeScene]}
                alt={`Scene ${activeScene + 1}`}
                fill
                className="object-contain"
              />
              <button
                className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/80 transition-colors"
                onClick={() => setActiveScene(null)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 