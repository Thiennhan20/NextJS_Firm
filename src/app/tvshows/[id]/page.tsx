'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
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
import EnhancedMoviePlayer from '@/components/common/EnhancedMoviePlayer'
import Comments from '@/components/Comments'


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
  const searchParams = useSearchParams()
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
  const [selectedServer, setSelectedServer] = useState<'server1' | 'server2'>('server1')
  const hasInitialized = useRef(false)
  const [seasons, setSeasons] = useState<{ id: number; name: string; season_number: number; episode_count: number; poster_path?: string; overview?: string; air_date?: string }[]>([])
  const [isSeasonDropdownOpen, setIsSeasonDropdownOpen] = useState(false)
  const seasonDropdownRef = useRef<HTMLDivElement>(null)

  const [selectedAudio, setSelectedAudio] = useState<'vietsub' | 'dubbed' | null>(null) // Audio selection
  const [episodesData, setEpisodesData] = useState<Array<{
    server_name?: string;
    server_data?: Array<{
      name?: string;
      link_m3u8?: string;
      link_embed?: string;
    }>;
  }> | null>(null) // Lưu episodes data để tái sử dụng
  const [server2Link, setServer2Link] = useState('')
  const [tvShowLinksLoading, setTVShowLinksLoading] = useState(false)
  const [apiSearchCompleted, setApiSearchCompleted] = useState(false)

  // Cập nhật URL khi thay đổi server
  const updateServerInUrl = (server: 'server1' | 'server2') => {
    const params = new URLSearchParams(searchParams.toString())
    const currentServer = searchParams.get('server')
    
    // Chỉ cập nhật nếu server thực sự thay đổi
    if (currentServer !== server) {
      params.set('server', server)
      const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`
      
      // Nếu đang từ server2 về server1, sử dụng replace để không tạo history entry mới
      if (currentServer === 'server2' && server === 'server1') {
        router.replace(newUrl, { scroll: false })
      } else {
        router.push(newUrl, { scroll: false })
      }
    }
  }

  // Cập nhật server và URL
  const handleServerChange = (server: 'server1' | 'server2') => {
    if (selectedServer !== server) {
      setSelectedServer(server)
      updateServerInUrl(server)
    }
  }

  // Đọc server từ URL khi component mount hoặc URL thay đổi
  useEffect(() => {
    const serverFromUrl = searchParams.get('server')
    if (serverFromUrl === 'server1' || serverFromUrl === 'server2') {
      setSelectedServer(serverFromUrl)
      hasInitialized.current = true
    } else {
      // Nếu không có tham số server, mặc định về server1
      setSelectedServer('server1')
      hasInitialized.current = true
    }
  }, [searchParams])

  // Function để cập nhật audio links cho episode mới mà không cần tìm kiếm lại
  const updateAudioLinksForEpisode = useCallback((episodeNumber: number) => {
    if (!episodesData) return
    

    
    let vietsubLink = ''
    let dubbedLink = ''
    
    for (const episode of episodesData) {
      // Tìm episode có số thứ tự tương ứng
      const targetEpisode = episode.server_data?.find((ep: { name?: string; link_m3u8?: string; link_embed?: string }) => {
        const epName = ep.name?.toLowerCase() || ''
        
        // Kiểm tra các pattern: "Tập 02", "Episode 2", "2", etc.
        return epName.includes(`tập ${episodeNumber}`) || 
               epName.includes(`episode ${episodeNumber}`) ||
               epName.includes(`tập 0${episodeNumber}`) ||
               epName.includes(`episode 0${episodeNumber}`) ||
               epName.includes(`tập ${episodeNumber.toString().padStart(2, '0')}`) ||
               epName.includes(`episode ${episodeNumber.toString().padStart(2, '0')}`)
      })
      
      if (targetEpisode) {

        
        // Phân loại theo server_name
        if (episode.server_name?.toLowerCase().includes('vietsub')) {
          vietsubLink = targetEpisode.link_m3u8 || targetEpisode.link_embed?.split('?url=')[1] || ''

        } else if (episode.server_name?.toLowerCase().includes('lồng tiếng') || 
                   episode.server_name?.toLowerCase().includes('dubbed')) {
          dubbedLink = targetEpisode.link_m3u8 || targetEpisode.link_embed?.split('?url=')[1] || ''

        }
      }
    }
    
    // Cập nhật tvShowLinks với episode mới
    setTVShowLinks(links => ({
      ...links,
      vietsub: vietsubLink,
      dubbed: dubbedLink
    }))
  }, [episodesData])



  // Check server 2 availability
  useEffect(() => {
    if (typeof id === 'string' && id && selectedSeason && selectedEpisode > 0) {
      const server2Url = `https://vidsrc.xyz/embed/tv?tmdb=${id}&season=${selectedSeason}&episode=${selectedEpisode}&ds_lang=vi&sub_url=https%3A%2F%2Fvidsrc.me%2Fsample.srt&autoplay=1&autonext=1`
      setServer2Link(server2Url)
    }
  }, [id, selectedSeason, selectedEpisode])

  const handleSeasonSelect = (season: number) => {
    setSelectedSeason(season)
    setSelectedEpisode(1) // Mặc định chọn episode 1 khi đổi season

    
    // Đánh dấu season đã thay đổi để trigger tìm kiếm lại
    setTVShowLinks(links => ({ ...links, seasonChanged: true }))
    


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

  const [tvShowLinks, setTVShowLinks] = useState({
    embed: '',
    m3u8: '',
    vietsub: '', // Link cho Vietsub
    dubbed: '', // Link cho Lồng Tiếng
    seasonChanged: false,
    currentSeason: 0, // Lưu season hiện tại đã tìm kiếm
  })


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

    setSelectedServer('server1')
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

  // Xử lý khi season thay đổi để trigger tìm kiếm lại
  useEffect(() => {
    // Chỉ đánh dấu khi season thay đổi, không phải episode
    if (tvShowLinks.m3u8) {
      setTVShowLinks(links => ({ ...links, seasonChanged: true }))
    }
  }, [selectedSeason, tvShowLinks.m3u8])

  // Xử lý khi episode thay đổi để cập nhật audio links
  useEffect(() => {
    // Chỉ xử lý khi đã có episodes data và episode thay đổi
    if (episodesData && selectedEpisode > 0 && !tvShowLinks.seasonChanged) {
      // Cập nhật audio links cho episode mới mà không cần tìm kiếm lại
      updateAudioLinksForEpisode(selectedEpisode)
    }
  }, [selectedEpisode, episodesData, tvShowLinks.seasonChanged, updateAudioLinksForEpisode])

  // Tự động chọn audio khi có sẵn
  useEffect(() => {
    if (tvShowLinks.vietsub && tvShowLinks.dubbed && !selectedAudio) {
      setSelectedAudio('vietsub') // Default to vietsub
    }
    
    // Nếu chỉ có một loại audio, tự động chọn
    if (tvShowLinks.vietsub && !tvShowLinks.dubbed && !selectedAudio) {
      setSelectedAudio('vietsub')
    }
    if (tvShowLinks.dubbed && !tvShowLinks.vietsub && !selectedAudio) {
      setSelectedAudio('dubbed')
    }
  }, [tvShowLinks.vietsub, tvShowLinks.dubbed, selectedAudio])

  



  useEffect(() => {
    if (tvShow?.name && tvShow?.year) {

      fetch(`/api/subtitles?query=${encodeURIComponent(tvShow.name)}&year=${tvShow.year.toString()}`)
        .then(res => res.json())
        .then(() => {})
        .catch(() => {})

    }
  }, [tvShow?.name, tvShow?.year])





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

  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    async function fetchPhimApiEmbed() {
      // Nếu đã có audio links cho season hiện tại thì không cần tìm kiếm lại
      if (tvShowLinks.currentSeason === selectedSeason && !tvShowLinks.seasonChanged && 
          (tvShowLinks.vietsub || tvShowLinks.dubbed)) {

        return
      }
      
      // Nếu season thay đổi, reset tvShowLinks để tìm kiếm lại
      if (tvShowLinks.seasonChanged) {

        setTVShowLinks(links => ({ 
          ...links, 
          m3u8: '', 
          vietsub: '', 
          dubbed: '', 
          seasonChanged: false 
        }))
        return
      }
      
      // Tiến hành tìm kiếm

      
      setTVShowLinksLoading(true)
      setApiSearchCompleted(false)

      timeoutId = setTimeout(() => {}, 60000)
      try {
        if (typeof id !== 'string') {
          return
        }
        let slug = null
        let logged = false
        if (tvShow?.name) {
          // Chuẩn hóa tên phim để tìm kiếm chính xác hơn
          const normalizedName = tvShow.name
            .toLowerCase()
            .replace(/[^\w\s]/g, '') // Loại bỏ ký tự đặc biệt
            .replace(/\s+/g, ' ') // Chuẩn hóa khoảng trắng
            .trim()
          
          const keywords = [normalizedName, tvShow.name].filter(Boolean)
          
          outer: for (const keyword of keywords) {
            // Trừ năm ra - chỉ tìm kiếm theo tên phim
            const url = `https://phimapi.com/v1/api/tim-kiem?keyword=${encodeURIComponent(keyword)}`
            

            
            if (!logged) {
              logged = true
            }
            const res = await fetch(url)
            const data = await res.json()
            

            
            if (
              data.status === 'success' &&
              data.data &&
              Array.isArray(data.data.items) &&
              data.data.items.length > 0
            ) {
              // Tìm kiếm chính xác hơn bằng cách so sánh với nhiều trường và kiểm tra season
              let bestMatch = null
              let bestScore = 0
              
              for (const item of data.data.items) {
                let score = 0
                
                // So sánh với name
                if (item.name && item.name.toLowerCase().includes(normalizedName)) {
                  score += 3
                }
                
                // So sánh với slug
                if (item.slug && item.slug.toLowerCase().includes(normalizedName.replace(/\s+/g, '-'))) {
                  score += 2
                }
                
                // So sánh với origin_name
                if (item.origin_name && item.origin_name.toLowerCase().includes(normalizedName)) {
                  score += 2
                }
                
                // Kiểm tra season trong tên phim - ưu tiên season đang được chọn
                if (item.name) {
                  const itemName = item.name.toLowerCase()
                  
                  // Kiểm tra xem có phải là season đang được chọn không
                  if (selectedSeason === 1) {
                    // Nếu đang ở season 1, ưu tiên "Phần 1" hoặc không có "Phần"
                    if (itemName.includes('phần 1') || itemName.includes('part 1')) {
                      score += 5 // Điểm cao nhất cho season 1
                    } else if (itemName.includes('phần 2') || itemName.includes('part 2')) {
                      score -= 3 // Trừ điểm cho season 2
                    } else if (!itemName.includes('phần') && !itemName.includes('part')) {
                      score += 4 // Điểm cao cho phim không có phần
                    }
                  } else if (selectedSeason === 2) {
                    // Nếu đang ở season 2, ưu tiên "Phần 2"
                    if (itemName.includes('phần 2') || itemName.includes('part 2')) {
                      score += 5
                    } else if (itemName.includes('phần 1') || itemName.includes('part 1')) {
                      score -= 3
                    }
                  } else if (selectedSeason === 3) {
                    // Nếu đang ở season 3, ưu tiên "Phần 3"
                    if (itemName.includes('phần 3') || itemName.includes('part 3')) {
                      score += 5
                    } else if (itemName.includes('phần 1') || itemName.includes('part 1') || itemName.includes('phần 2') || itemName.includes('part 2')) {
                      score -= 3
                    }
                  }
                }
                

                
                if (score > bestScore) {
                  bestScore = score
                  bestMatch = item
                }
              }
              
              if (bestMatch && bestMatch.slug && bestScore >= 2) {
                slug = bestMatch.slug

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
        

        
        // Kiểm tra xem phim này có episodes của season đang được chọn không
        let hasSeasonEpisodes = false
        let finalDetailData = detailData
        
        if (detailData.episodes && Array.isArray(detailData.episodes)) {
          // Tìm episode có số thứ tự tương ứng với episode đang được chọn
          const targetEpisode = detailData.episodes.find((ep: { episode_number: number; name?: string }) => 
            ep.episode_number === selectedEpisode || 
            ep.name?.toLowerCase().includes(`tập ${selectedEpisode}`) ||
            ep.name?.toLowerCase().includes(`episode ${selectedEpisode}`)
          )
          
          hasSeasonEpisodes = !!targetEpisode

        }
        
        // Nếu không có episodes của season này, tìm kiếm lại với từ khóa khác
        if (!hasSeasonEpisodes) {

          
          // Thử tìm kiếm với từ khóa có thêm season
          const seasonKeywords = [
            `${tvShow?.name?.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim()} phần ${selectedSeason}`,
            `${tvShow?.name?.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim()} part ${selectedSeason}`,
            `${tvShow?.name?.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim()} season ${selectedSeason}`,
            `${tvShow?.name?.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim()} tập ${selectedEpisode}`,
            `${tvShow?.name?.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim()} episode ${selectedEpisode}`
          ]
          
          for (const seasonKeyword of seasonKeywords) {

            const altUrl = `https://phimapi.com/v1/api/tim-kiem?keyword=${encodeURIComponent(seasonKeyword)}`
            
            try {
              const altRes = await fetch(altUrl)
              const altData = await altRes.json()
              
              if (altData.status === 'success' && altData.data?.items?.length > 0) {
                const altItem = altData.data.items[0]

                
                // Kiểm tra lại với phim mới
                const altDetailRes = await fetch(`https://phimapi.com/phim/${altItem.slug}`)
                const altDetailData = await altDetailRes.json()
                
                if (altDetailData.episodes && Array.isArray(altDetailData.episodes)) {
                  const altTargetEpisode = altDetailData.episodes.find((ep: { episode_number: number; name?: string }) => 
                    ep.episode_number === selectedEpisode || 
                    ep.name?.toLowerCase().includes(`tập ${selectedEpisode}`) ||
                    ep.name?.toLowerCase().includes(`episode ${selectedEpisode}`)
                  )
                  
                  if (altTargetEpisode) {

                    slug = altItem.slug
                    finalDetailData = altDetailData
                    hasSeasonEpisodes = true
                    break
                  }
                }
              }
            } catch {

            }
          }
        }
        
        // Tìm episode chính xác dựa trên selectedEpisode
        let vietsubLink = ''
        let dubbedLink = ''
        let defaultEmbed = ''
        
        if (finalDetailData.episodes && Array.isArray(finalDetailData.episodes)) {

          
          for (const episode of finalDetailData.episodes) {
                         // Tìm episode có số thứ tự tương ứng
             const targetEpisode = episode.server_data?.find((ep: { name?: string; link_m3u8?: string; link_embed?: string }) => {
               const epName = ep.name?.toLowerCase() || ''
               const epNumber = selectedEpisode
               
               // Kiểm tra các pattern: "Tập 02", "Episode 2", "2", etc.
               return epName.includes(`tập ${epNumber}`) || 
                      epName.includes(`episode ${epNumber}`) ||
                      epName.includes(`tập 0${epNumber}`) ||
                      epName.includes(`episode 0${epNumber}`) ||
                      epName.includes(`tập ${epNumber.toString().padStart(2, '0')}`) ||
                      epName.includes(`episode ${epNumber.toString().padStart(2, '0')}`)
             })
            
            if (targetEpisode) {

              
              // Phân loại theo server_name
              if (episode.server_name?.toLowerCase().includes('vietsub')) {
                vietsubLink = targetEpisode.link_m3u8 || targetEpisode.link_embed?.split('?url=')[1] || ''

              } else if (episode.server_name?.toLowerCase().includes('lồng tiếng') || 
                         episode.server_name?.toLowerCase().includes('dubbed')) {
                dubbedLink = targetEpisode.link_m3u8 || targetEpisode.link_embed?.split('?url=')[1] || ''

              }
            }
          }
          
          // Fallback: lấy episode đầu tiên nếu không tìm thấy episode cụ thể
          if (!vietsubLink && !dubbedLink) {

            const firstEpisode = finalDetailData.episodes[0]?.server_data?.[0]
            if (firstEpisode) {
              defaultEmbed = firstEpisode.link_m3u8 || firstEpisode.link_embed?.split('?url=')[1] || ''
            }
          }
        }
        
        // Fallback: sử dụng link_embed gốc nếu có
        if (!vietsubLink && !dubbedLink && !defaultEmbed && finalDetailData.link_embed) {
          defaultEmbed = finalDetailData.link_embed.includes('?url=') 
            ? finalDetailData.link_embed.split('?url=')[1] 
            : finalDetailData.link_embed
        }
        

        
        // Lưu episodes data để tái sử dụng khi đổi episode
        setEpisodesData(finalDetailData.episodes)
        
        // Cập nhật tvShowLinks với tất cả audio options
        const updatedLinks = {
          ...tvShowLinks,
          m3u8: defaultEmbed,
          vietsub: vietsubLink,
          dubbed: dubbedLink,
          seasonChanged: false, 
          currentSeason: selectedSeason 
        }
        
        setTVShowLinks(updatedLinks)
        

        
      } catch {

      } finally {
        clearTimeout(timeoutId)
        setTVShowLinksLoading(false)
        setApiSearchCompleted(true)
      }
    }
    fetchPhimApiEmbed()
  }, [id, tvShow?.name, tvShow?.year, tvShowLinks, selectedSeason, selectedEpisode])

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
              <div className="w-[300px] h-[450px] bg-gray-700 rounded-lg flex items-center justify-center">
                <span className="text-4xl">📺</span>
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
            </div>

              <div className="flex flex-wrap gap-2">
                {cast.map((actor: string, index: number) => (
                  <span key={index} className="px-3 py-1 bg-gray-800 rounded-full text-sm">
                    {actor}
                  </span>
                ))}
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-white">
        <h2 className="text-3xl font-bold mb-6">Watch Now</h2>
        <div className="mb-4 flex flex-wrap items-start gap-3">
          <div className="flex flex-col gap-2">
            <button
              className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-semibold transition-colors ${selectedServer === 'server1' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
              onClick={() => handleServerChange('server1')}
            >
              Server 1 
            </button>
            {selectedServer === 'server1' && tvShowLinks.vietsub && tvShowLinks.dubbed && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-300">Audio:</span>
                <button
                  className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${selectedAudio === 'vietsub' ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
                  onClick={() => setSelectedAudio('vietsub')}
                >
                  Vietsub
                </button>
                <button
                  className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${selectedAudio === 'dubbed' ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
                  onClick={() => setSelectedAudio('dubbed')}
                >
                  Dubbed
                </button>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <button
              className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-semibold transition-colors ${selectedServer === 'server2' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
              onClick={() => handleServerChange('server2')}
            >
              Server 2 
            </button>
            {selectedServer === 'server2' && (
              <span className="text-xs text-yellow-300 bg-yellow-900/40 px-2 py-1 rounded w-max">
                This server may contain ads.
              </span>
            )}
          </div>
        </div>

        {/* Header ngoài player, co giãn theo khung hình */}
        {selectedEpisode > 0 && (
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="text-white text-xs sm:text-sm md:text-base font-semibold truncate" title={`${name} - S${selectedSeason} E${selectedEpisode}`}>
                {name} - Season {selectedSeason} Episode {selectedEpisode}
              </h3>
              {selectedServer === 'server1' && (tvShowLinks.vietsub || tvShowLinks.dubbed) && (
                <span className="px-2 py-0.5 text-[10px] sm:text-xs font-semibold rounded bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white whitespace-nowrap">
                  {selectedAudio === 'vietsub' ? 'Vietsub' : 
                   selectedAudio === 'dubbed' ? 'Vietnamese Dubbed' :
                   tvShowLinks.vietsub ? 'Vietsub' : 'Vietnamese Dubbed'}
                </span>
              )}
            </div>
          </div>
        )}

        <div className="relative w-full rounded-lg overflow-hidden bg-black/50 aspect-video">
          {selectedEpisode === 0 ? (
            <div className="flex items-center justify-center h-full text-white">
              <div className="flex flex-col items-center gap-4">
                <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 110 2h-1v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6H3a1 1 0 110-2h4z" />
                </svg>
                <p className="text-lg font-semibold">Please select an episode first</p>
                <p className="text-sm text-gray-400">Choose from the episodes below to start watching</p>
              </div>
            </div>
          ) : selectedServer === 'server1' ? (
            (() => {
              if (!apiSearchCompleted || tvShowLinksLoading) {
                return (
                  <div className="flex items-center justify-center h-full text-white">
                    <div className="flex flex-col items-center gap-4">
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                        className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full"
                      />
                      <p className="text-sm text-gray-400">Please wait a moment</p>
                    </div>
                  </div>
                );
              }

              const hasVideoSource = tvShowLinks.vietsub || tvShowLinks.dubbed || tvShowLinks.m3u8;
              if (!hasVideoSource) {
                return (
                  <div className="flex items-center justify-center h-full text-white">
                    <div className="flex flex-col items-center gap-4">
                      <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-lg font-semibold">No video source available</p>
                      <p className="text-sm text-gray-400">Please try another server</p>
                    </div>
                  </div>
                );
              }

              let videoSrc = '';
              let effectiveAudio: 'vietsub' | 'dubbed' | null = null;
              if (selectedAudio === 'vietsub' && tvShowLinks.vietsub) {
                videoSrc = tvShowLinks.vietsub;
                effectiveAudio = 'vietsub';
              } else if (selectedAudio === 'dubbed' && tvShowLinks.dubbed) {
                videoSrc = tvShowLinks.dubbed;
                effectiveAudio = 'dubbed';
              } else if (tvShowLinks.vietsub) {
                videoSrc = tvShowLinks.vietsub;
                effectiveAudio = 'vietsub';
              } else if (tvShowLinks.dubbed) {
                videoSrc = tvShowLinks.dubbed;
                effectiveAudio = 'dubbed';
              } else {
                videoSrc = tvShowLinks.m3u8;
                effectiveAudio = null;
              }

              return videoSrc ? (
                <EnhancedMoviePlayer
                  key={`${selectedSeason}-${selectedEpisode}-${videoSrc}`}
                  src={videoSrc}
                  poster={tvShow.poster}
                  autoPlay={false}
                  movieId={tvShow.id}
                  server={selectedServer}
                  audio={effectiveAudio || undefined}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-white text-lg font-semibold">
                  No video source available
                </div>
              );
            })()
          ) : selectedServer === 'server2' && server2Link ? (
            <iframe
              src={server2Link}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={`${name} - Season ${selectedSeason} Episode ${selectedEpisode} - Server 2`}
              referrerPolicy="origin"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-white">
              <div className="flex flex-col items-center gap-4">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                  className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full"
                />
                <p className="text-sm text-gray-400">Loading...</p>
              </div>
            </div>
          )}
        </div>
      </div>

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