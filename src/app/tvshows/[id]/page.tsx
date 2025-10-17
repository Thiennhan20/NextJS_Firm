'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Html } from '@react-three/drei'
import * as THREE from 'three'
import Image from 'next/image'
import { ClockIcon, CalendarIcon, PlayIcon, ChevronDownIcon } from '@heroicons/react/24/solid'
import { BookmarkIcon } from '@heroicons/react/24/outline'
import { useWatchlistStore } from '@/store/store'
import toast from 'react-hot-toast'
import axios from 'axios'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import useAuthStore from '@/store/useAuthStore'
import api from '@/lib/axios'
import Comments from '@/components/Comments'
import WatchNowTVShows from '@/components/watch/WatchNowTVShows'


// Định nghĩa kiểu TVShow rõ ràng
interface TVShow {
  id: number
  name: string

  duration: string
  year: number | ''
  firstAirDate?: string
  creator: string
  cast: string[]
  genre: string
  description: string
  poster: string
  backdrop: string
  trailer: string
  tvShowUrl: string
  scenes: string[]

  totalSeasons?: number
  totalEpisodes?: number
}

interface Episode {
  id: number
  name: string
  episode_number: number
  season_number: number
  still_path?: string
  overview?: string
  air_date?: string
}





interface Person {
  name: string
  job?: string
}

function TVShowPoster3D({ posterUrl }: { posterUrl: string }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [texture, setTexture] = useState<THREE.Texture | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loader = new THREE.TextureLoader()
    let loadedTexture: THREE.Texture | null = null
    let cancelled = false
    
    setIsLoading(true)
    
    loader.load(
      posterUrl, 
      (tex) => {
        if (!cancelled) {
          // Set texture properties
          tex.flipY = true // Để ảnh hiển thị đúng hướng
          tex.generateMipmaps = true
          
          loadedTexture = tex
          setTexture(tex)
          setIsLoading(false)
        }
      },
      undefined, // onProgress
      (error) => {
        // onError
        if (!cancelled) {
          console.error('Texture loading error:', error)
          setIsLoading(false)
        }
      }
    )
    
    return () => {
      cancelled = true
      if (loadedTexture) {
        loadedTexture.dispose()
      }
    }
  }, [posterUrl])

  // Debug texture loading
  useEffect(() => {
    if (texture) {
      console.log('Texture loaded successfully:', {
        uuid: texture.uuid,
        image: texture.image,
        width: texture.image?.width,
        height: texture.image?.height,
        isLoaded: texture.image?.complete
      })
    }
  }, [texture])

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

  if (isLoading) {
    return (
      <mesh>
        <planeGeometry args={[2, 3]} />
        <meshBasicMaterial color="#374151" />
        <Html center>
          <div className="flex flex-col items-center justify-center text-white">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
              className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full"
            />
            <span className="text-xs mt-2 text-gray-300">Loading...</span>
          </div>
        </Html>
      </mesh>
    )
  }

  if (!texture) {
    return (
      <mesh>
        <planeGeometry args={[2, 3]} />
        <meshBasicMaterial color="#6B7280" />
        <Html center>
          <div className="flex flex-col items-center justify-center text-white">
            <span className="text-xs text-gray-300">No Image</span>
          </div>
        </Html>
      </mesh>
    )
  }

  return (
    <mesh ref={meshRef} castShadow>
      <planeGeometry args={[2, 3]} />
      <meshBasicMaterial 
        key={texture.uuid} // Force re-render when texture changes
        map={texture} 
        toneMapped={false}
        transparent={false}
        opacity={1}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

export default function TVShowDetail() {
  const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY
  const { id } = useParams()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const searchParams = useSearchParams()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const router = useRouter()
  const [tvShow, setTVShow] = useState<TVShow | null>(null)
  

  
  const [loading, setLoading] = useState<boolean>(true)
  const [activeScene, setActiveScene] = useState<number | null>(null)
  const [showTrailer, setShowTrailer] = useState<boolean>(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  })

  const { addToWatchlist, removeFromWatchlist, isInWatchlist, fetchWatchlistFromServer } = useWatchlistStore()
  const { isAuthenticated, token } = useAuthStore()
  const isBookmarked = tvShow ? isInWatchlist(tvShow.id) : false
  const [isCastExpanded, setIsCastExpanded] = useState(false)
  const [isDescExpanded, setIsDescExpanded] = useState(false)

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

  const [selectedSeason, setSelectedSeason] = useState<number>(1)
  const [selectedEpisode, setSelectedEpisode] = useState<number>(0)
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [episodesLoading, setEpisodesLoading] = useState(false)
  const [seasons, setSeasons] = useState<{ id: number; name: string; season_number: number; episode_count: number; poster_path?: string; overview?: string; air_date?: string }[]>([])
  const [isSeasonDropdownOpen, setIsSeasonDropdownOpen] = useState(false)
  const seasonDropdownRef = useRef<HTMLDivElement>(null)



  const handleSeasonSelect = (season: number) => {
    setSelectedSeason(season)
    setSelectedEpisode(1) // Mặc định chọn episode 1 khi đổi season
    


    // Update URL: set season and episode 1
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
    params.set('season', String(season))
    params.set('episode', '1')
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`)
    }
  }

  const handleEpisodeSelect = (episode: number) => {
    setSelectedEpisode(episode)

    // Update URL: set season and episode
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
    params.set('season', String(selectedSeason))
    params.set('episode', String(episode))
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`)
    }
  }



  const y = useTransform(scrollYProgress, [0, 1], [0, -100])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])



  useEffect(() => {
    const fetchTVShow = async () => {
      setLoading(true)
      try {
        const response = await axios.get(
          `https://api.themoviedb.org/3/tv/${id}?api_key=${API_KEY}`
        )
        const data = response.data
        let scenes: string[] = []
        let imgRes: { data: { backdrops: { file_path: string }[] } } | null = null
        let videoRes: { data: { results: { type: string; site: string; key: string }[] } } | null = null
        
        try {
          imgRes = await axios.get(
            `https://api.themoviedb.org/3/tv/${id}/images?api_key=${API_KEY}`
          )
          const backdrops: { file_path: string }[] = imgRes?.data.backdrops || []
          scenes = backdrops.slice(0, 3).map((img) => `https://image.tmdb.org/t/p/w780${img.file_path}`)
        } catch {}
        if (scenes.length < 3) {
          if (data.backdrop_path) scenes.push(`https://image.tmdb.org/t/p/w780${data.backdrop_path}`)
          if (data.poster_path) scenes.push(`https://image.tmdb.org/t/p/w500${data.poster_path}`)
        }
        scenes = scenes.slice(0, 3)
        let trailer = ''
        try {
          videoRes = await axios.get(
            `https://api.themoviedb.org/3/tv/${id}/videos?api_key=${API_KEY}`
          )
          const videos: { type: string; site: string; key: string }[] = videoRes?.data.results || []
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
        
        // Set seasons data
        setSeasons(data.seasons || [])
        

        
        const tvShowData = {
          id: data.id,
          name: data.name,

          duration: data.episode_run_time && data.episode_run_time.length > 0 
            ? `${data.episode_run_time[0]}m` : '',
          year: data.first_air_date ? Number(data.first_air_date.slice(0, 4)) : '' as number | '',
          firstAirDate: data.first_air_date || '',
          creator: credits.crew?.find((person: Person) => person.job === 'Creator')?.name || '',
          cast: credits.cast?.slice(0, 10).map((person: Person) => person.name) || [],
          genre: data.genres ? data.genres.map((g: { name: string }) => g.name).join(', ') : '',
          description: data.overview,
          poster: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : '',
          backdrop: data.backdrop_path ? `https://image.tmdb.org/t/p/original${data.backdrop_path}` : '',
          trailer,
          tvShowUrl: '',
          scenes,

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

  // Reset selections when navigating to a different TV show id
  useEffect(() => {
    setSelectedSeason(1)
    setSelectedEpisode(1) // Mặc định chọn episode 1
    setEpisodes([])
  }, [id])

  // Helper to format date as dd/mm/yyyy (Vietnam locale)
  const formatDate = (dateStr?: string) => {
    try {
      if (!dateStr) return ''
      const d = new Date(dateStr)
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    } catch {
      return dateStr || ''
    }
  }

  useEffect(() => {
    if (tvShow?.id) {
      setEpisodesLoading(true)
      const fetchEpisodes = async () => {
        try {
          const response = await axios.get(
            `https://api.themoviedb.org/3/tv/${tvShow.id}/season/${selectedSeason}?api_key=${API_KEY}`
          )
          const data = response.data
          if (data.episodes) {

            setEpisodes(data.episodes)
          }
        } catch {
          setEpisodes([])
        } finally {
          setEpisodesLoading(false)
        }
      }
      fetchEpisodes()
    }
  }, [tvShow?.id, selectedSeason, API_KEY])

  // Sync selected season and episode from URL on mount and browser navigation without route reload
  useEffect(() => {
    const syncFromUrl = () => {
      const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
      const seasonParam = params.get('season')
      const episodeParam = params.get('episode')

      const seasonNum = seasonParam && !isNaN(Number(seasonParam)) ? Number(seasonParam) : 1
      // Mặc định chọn episode 1 thay vì 0
      const episodeNum = episodeParam && !isNaN(Number(episodeParam)) ? Number(episodeParam) : 1

      // Always set from URL; React will skip state update if value is unchanged
      setSelectedSeason(seasonNum)
      setSelectedEpisode(episodeNum)
      
      // Nếu URL không có episode param, tự động thêm episode=1 vào URL
      if (!episodeParam && typeof window !== 'undefined') {
        const newParams = new URLSearchParams(window.location.search)
        newParams.set('season', String(seasonNum))
        newParams.set('episode', '1')
        const newUrl = `${window.location.pathname}?${newParams.toString()}`
        window.history.replaceState({}, '', newUrl)
      }
    }

    syncFromUrl()
    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', syncFromUrl)
      return () => window.removeEventListener('popstate', syncFromUrl)
    }
  }, [id])




  








  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (seasonDropdownRef.current && !seasonDropdownRef.current.contains(event.target as Node)) {
        setIsSeasonDropdownOpen(false)
      }
    }

    if (isSeasonDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isSeasonDropdownOpen])

  // Removed large useEffect for watch now logic - now handled by WatchNowTVShows component

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

  const { name, backdrop, poster, duration, year, genre, creator, cast, description, scenes, trailer, totalSeasons, totalEpisodes, firstAirDate } = tvShow

  // Season-aware visuals
  const currentSeason = seasons.find((s) => s.season_number === selectedSeason) || seasons[selectedSeason - 1]
  const displayPoster = currentSeason?.poster_path
    ? `https://image.tmdb.org/t/p/w500${currentSeason.poster_path}`
    : poster
  const seasonAirDate = currentSeason?.air_date

  const heroHeightClass = (displayPoster && displayPoster.length > 0)
    ? 'h-[40vh] md:h-[50vh] lg:h-[60vh]'
    : 'h-[28vh] sm:h-[24vh] md:h-[28vh] lg:h-[32vh]';

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
          <div className={`relative ${heroHeightClass} w-full flex items-center justify-center mb-8 lg:mb-0`}>
            {displayPoster ? (
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
                <TVShowPoster3D posterUrl={`/api/cache-image?id=${id}&url=${encodeURIComponent(displayPoster ?? '')}`} />
              </Canvas>
            ) : (
              <div className="bg-gray-700/70 rounded-lg flex items-center justify-center shadow-inner border border-gray-600 w-[96px] h-[144px] sm:w-[128px] sm:h-[192px] md:w-[160px] md:h-[240px] lg:w-[192px] lg:h-[288px]">
                <span className="text-2xl sm:text-3xl">📺</span>
              </div>
            )}
          </div>
          
          <div className="text-white space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight"
              >
                {name}
              </motion.h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="px-2 py-1 text-xs sm:text-sm font-bold rounded-md bg-blue-600 text-white whitespace-nowrap">
                  Season {selectedSeason}
                </span>

              </div>
            </div>
            
            <div className="flex flex-wrap gap-4">
              
              <div className="flex items-center space-x-2">
                <ClockIcon className="h-6 w-6 text-gray-400" />
                <span className="text-gray-400">{duration}</span>
              </div>
              <div className="flex items-center space-x-2">
                <CalendarIcon className="h-6 w-6 text-gray-400" />
                <span className="text-gray-400">{seasonAirDate ? formatDate(seasonAirDate) : (firstAirDate ? formatDate(firstAirDate) : year)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-gray-300">{genre}</p>
              {creator && (
                <p className="text-gray-300">Director: {creator}</p>
              )}
              {/* Cast collapsed */}
              <div>
                {!isCastExpanded ? (
                  <div className="flex items-center">
                    <div className="min-w-0 overflow-hidden">
                      <div className="flex flex-nowrap gap-2 whitespace-nowrap">
                        {cast.map((actor: string, index: number) => (
                          <span key={index} className="shrink-0 last:shrink last:min-w-0 last:max-w-[50%] last:truncate px-3 py-1 rounded-full text-sm bg-gray-900/60 border border-white/15 text-white shadow-sm backdrop-blur-[2px]">
                            {actor}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex-none flex items-center gap-2 pl-2">
                      <span className="px-2 py-0.5 rounded-full bg-gray-900/60 border border-white/15 text-white text-xs shadow-sm backdrop-blur-[2px] select-none">…</span>
                      <button
                        onClick={() => setIsCastExpanded(true)}
                        className="text-xs px-2 py-1 rounded-md bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-sm"
                      >
                        Show more
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 items-center">
                    {cast.map((actor: string, index: number) => (
                      <span key={index} className="px-3 py-1 rounded-full text-sm bg-gray-900/60 border border-white/15 text-white shadow-sm backdrop-blur-[2px]">
                        {actor}
                      </span>
                    ))}
                    <button
                      onClick={() => setIsCastExpanded(false)}
                      className="text-xs px-2 py-1 rounded-md bg-white/15 hover:bg-white/25 text-white border border-white/20"
                    >
                      Show less
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Description collapsed */}
            {!isDescExpanded ? (
              <div className="relative">
                <p className="text-gray-300 leading-relaxed whitespace-nowrap overflow-hidden text-ellipsis pr-24">
                  {description}
                </p>
                <div className="absolute inset-y-0 right-0 flex items-center pl-6">
                  <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-black/70 to-transparent"></div>
                  
                  <button
                    onClick={() => setIsDescExpanded(true)}
                    className="relative z-10 text-xs px-2 py-1 rounded-md bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-sm"
                  >
                    Read more
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-gray-300 leading-relaxed">{description}</p>
                <button
                  onClick={() => setIsDescExpanded(false)}
                  className="text-xs px-2 py-1 rounded-md bg-white/15 hover:bg-white/25 text-white border border-white/20"
                >
                  Show less
                </button>
              </div>
            )}

            <div className="flex flex-wrap gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowTrailer(true)}
                className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <PlayIcon className="h-5 w-5" />
                Trailer
              </motion.button>
              
                             

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

      {/* Watch Now Section */}
      {tvShow && <WatchNowTVShows tvShow={tvShow} selectedSeason={selectedSeason} selectedEpisode={selectedEpisode} episodes={episodes} />}

                           {/* Episodes Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-white">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-3xl font-bold">Episodes</h2>
              {totalSeasons && totalSeasons > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-300 text-sm">Season:</span>
                  <div className="relative" ref={seasonDropdownRef}>
                    <button
                      onClick={() => setIsSeasonDropdownOpen(!isSeasonDropdownOpen)}
                      className="flex items-center justify-between bg-gray-700 text-white text-sm px-3 py-1.5 pr-2 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent cursor-pointer hover:bg-gray-600 transition-colors min-w-[80px] max-w-[120px]"
                    >
                      <span>{selectedSeason}</span>
                      <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform ${isSeasonDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {isSeasonDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-gray-700 border border-gray-600 rounded-md shadow-lg z-50 max-h-[200px] overflow-y-auto scrollbar-hide">
                        {Array.from({ length: totalSeasons || 0 }, (_, i) => i + 1).map((season) => (
                          <button
                            key={season}
                            onClick={() => {
                              handleSeasonSelect(season);
                              setIsSeasonDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-600 transition-colors ${
                              selectedSeason === season ? 'bg-red-500 text-white' : 'text-white'
                            }`}
                          >
                            {season}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            {totalSeasons && totalEpisodes && (
              <p className="text-gray-300 text-sm">
                {totalSeasons} Season{(totalSeasons || 0) > 1 ? 's' : ''} • {totalEpisodes} Episode{(totalEpisodes || 0) > 1 ? 's' : ''}
              </p>
            )}
          </div>
         {episodesLoading ? (
           <div className="flex justify-center">
             <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
           </div>
         ) : episodes.length > 0 ? (
           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3 sm:gap-4">
             {episodes.map((episode) => (
               <motion.div
                 key={episode.id}
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: episode.episode_number * 0.05 }}
                 className={`relative bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden cursor-pointer transition-all duration-300 group ${
                   selectedEpisode === episode.episode_number 
                     ? 'ring-2 ring-red-500 ring-offset-2 ring-offset-gray-900 scale-105 shadow-lg shadow-red-500/25' 
                     : 'hover:scale-105 hover:shadow-lg hover:shadow-gray-500/25'
                 }`}
                 onClick={() => handleEpisodeSelect(episode.episode_number)}
               >
                 {episode.still_path ? (
                   <div className="relative aspect-[4/3]">
                     <Image
                       src={`https://image.tmdb.org/t/p/w500${episode.still_path}`}
                       alt={episode.name}
                       fill
                       className="object-cover transition-transform duration-300 group-hover:scale-110"
                     />
                                           <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <div className="bg-gray-300/10 text-red-600 px-3 py-1 rounded-full text-sm font-semibold">
                          S{selectedSeason} E{episode.episode_number}
                        </div>
                      </div>
                   </div>
                 ) : (
                   <div className="aspect-[4/3] bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                     <div className="text-center">
                       <div className="text-2xl sm:text-3xl mb-1">📺</div>
                                               <div className="bg-gray-300/10 text-red-600 px-3 py-1 rounded-full text-sm font-semibold">
                          S{selectedSeason} E{episode.episode_number}
                        </div>
                     </div>
                   </div>
                 )}
                                   <div className="p-2 sm:p-3">
                    <h3 className="font-semibold text-xs sm:text-sm text-center leading-tight truncate" title={episode.name}>
                      {episode.name}
                    </h3>
                  </div>
                 {selectedEpisode === episode.episode_number && (
                   <div className="absolute top-2 right-2">
                     <div className="bg-red-500 text-white rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-xs sm:text-sm font-bold shadow-lg">
                       ✓
                     </div>
                   </div>
                 )}
               </motion.div>
             ))}
           </div>
         ) : (
           <div className="text-center py-12">
             <div className="text-6xl mb-4">📺</div>
             <p className="text-gray-400">No episodes available yet.</p>
           </div>
         )}
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

      {/* Comments Section */}
      <Comments 
        movieId={tvShow.id} 
        type="tvshow" 
        title={tvShow.name} 
      />

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
                src={scenes[activeScene || 0]}
                alt={`Scene ${(activeScene || 0) + 1}`}
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