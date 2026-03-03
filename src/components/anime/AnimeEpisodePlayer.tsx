'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import EnhancedMoviePlayer from '@/components/common/EnhancedMoviePlayer'
import useAuthStore from '@/store/useAuthStore'

interface AnimeEpisodePlayerProps {
    tvShow: {
        id: number
        name: string
        poster: string
        backdrop: string
        totalEpisodes?: number
    }
    totalEpisodes: number
    // Episode to season mapping for arc names
    episodeToSeason?: Array<{
        start: number
        end: number
        season: number
        name: string
    }>
}

interface EpisodeData {
    server_name?: string
    server_data?: Array<{
        name?: string
        slug?: string
        link_m3u8?: string
        link_embed?: string
    }>
}

export default function AnimeEpisodePlayer({ tvShow, totalEpisodes, episodeToSeason = [] }: AnimeEpisodePlayerProps) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = useAuthStore((s) => (s.user as any)?.id || (s.user as any)?._id)
    const { id } = useParams()
    const searchParams = useSearchParams()
    const router = useRouter()

    // States
    const [selectedEpisode, setSelectedEpisode] = useState<number>(1)
    const [selectedServer, setSelectedServer] = useState<'server1' | 'server2'>('server1')
    const [selectedAudio, setSelectedAudio] = useState<'vietsub' | 'dubbed'>('vietsub')

    // Video links
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_episodesData, setEpisodesData] = useState<EpisodeData[] | null>(null)
    const [videoLinks, setVideoLinks] = useState({
        vietsub: '',
        dubbed: '',
        server2: ''
    })

    // Loading states
    const [isLoading, setIsLoading] = useState(false)
    const [isEpisodesCompact, setIsEpisodesCompact] = useState(true)

    // Refs
    const hasInitialized = useRef(false)

    // Get arc info for an episode
    const getArcInfo = useCallback((episodeNum: number) => {
        if (!episodeToSeason || episodeToSeason.length === 0) {
            return { arcName: 'Episode', season: 1 }
        }

        for (const range of episodeToSeason) {
            if (episodeNum >= range.start && episodeNum <= range.end) {
                return { arcName: range.name, season: range.season }
            }
        }
        return { arcName: 'Episode', season: Math.ceil(episodeNum / 100) }
    }, [episodeToSeason])

    // Sync from URL
    useEffect(() => {
        const episodeParam = searchParams.get('episode')
        const serverParam = searchParams.get('server')
        const audioParam = searchParams.get('audio')

        if (episodeParam && !isNaN(Number(episodeParam))) {
            setSelectedEpisode(Number(episodeParam))
        }

        if (serverParam === 'server1' || serverParam === 'server2') {
            setSelectedServer(serverParam)
        }

        if (audioParam === 'vietsub' || audioParam === 'dubbed') {
            setSelectedAudio(audioParam)
        }

        hasInitialized.current = true
    }, [searchParams])

    // Update URL
    const updateUrl = useCallback((episode: number, server: 'server1' | 'server2', audio: 'vietsub' | 'dubbed') => {
        const params = new URLSearchParams()
        params.set('episode', String(episode))
        params.set('server', server)
        params.set('audio', audio)
        const newUrl = `${window.location.pathname}?${params.toString()}`
        router.replace(newUrl, { scroll: false })
    }, [router])

    // Handle episode selection
    const handleEpisodeSelect = useCallback((episode: number) => {
        setSelectedEpisode(episode)
        updateUrl(episode, selectedServer, selectedAudio)

        // Scroll to player
        const playerSection = document.getElementById('anime-player-section')
        if (playerSection) {
            playerSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
    }, [selectedServer, selectedAudio, updateUrl])

    // Handle server change
    const handleServerChange = useCallback((server: 'server1' | 'server2') => {
        setSelectedServer(server)
        updateUrl(selectedEpisode, server, selectedAudio)
    }, [selectedEpisode, selectedAudio, updateUrl])

    // Handle audio change
    const handleAudioChange = useCallback((audio: 'vietsub' | 'dubbed') => {
        setSelectedAudio(audio)
        updateUrl(selectedEpisode, selectedServer, audio)
    }, [selectedEpisode, selectedServer, updateUrl])

    // Jump to episode
    const jumpToEpisode = useCallback((episode: number) => {
        const card = document.getElementById(`anime-episode-${episode}`)
        if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' })
            setTimeout(() => handleEpisodeSelect(episode), 500)
        }
    }, [handleEpisodeSelect])

    // Fetch episode data from phimapi.com
    useEffect(() => {
        async function fetchEpisodeData() {
            if (!id || !tvShow?.name || selectedEpisode <= 0) return

            setIsLoading(true)

            try {
                // Search for anime by name or TMDB ID
                const searchUrl = `https://phimapi.com/v1/api/tim-kiem?keyword=${encodeURIComponent(tvShow.name)}`
                const searchRes = await fetch(searchUrl)
                const searchData = await searchRes.json()

                let slug = null

                if (searchData?.status === 'success' && searchData?.data?.items?.length > 0) {
                    // Find best match
                    const bestMatch = searchData.data.items.find((item: { tmdb?: { id?: string | number }; slug?: string }) =>
                        item.tmdb?.id && String(item.tmdb.id) === String(id)
                    ) || searchData.data.items[0]

                    slug = bestMatch?.slug
                }

                if (!slug) {
                    setIsLoading(false)
                    return
                }

                // Fetch detail with episodes
                const detailRes = await fetch(`https://phimapi.com/phim/${slug}`)
                const detailData = await detailRes.json()

                if (detailData?.episodes && Array.isArray(detailData.episodes)) {
                    setEpisodesData(detailData.episodes)

                    // Find links for current episode
                    updateEpisodeLinks(detailData.episodes, selectedEpisode)
                }

                // Set server2 link
                const arcInfo = getArcInfo(selectedEpisode)
                const server2Url = `https://vidsrc.xyz/embed/tv?tmdb=${id}&season=${arcInfo.season}&episode=${selectedEpisode}&ds_lang=vi&autoplay=1`
                setVideoLinks(prev => ({ ...prev, server2: server2Url }))

            } catch (error) {
                console.error('Failed to fetch episode data:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchEpisodeData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, tvShow?.name, selectedEpisode, getArcInfo])

    // Update episode links helper
    const updateEpisodeLinks = useCallback((episodes: EpisodeData[], episodeNum: number) => {
        let vietsubLink = ''
        let dubbedLink = ''

        for (const episode of episodes) {
            const targetEpisode = episode.server_data?.find((ep) => {
                const epName = ep.name?.toLowerCase() || ''
                const epSlug = ep.slug?.toLowerCase() || ''

                return (
                    epName.includes(`tập ${episodeNum}`) ||
                    epName.includes(`episode ${episodeNum}`) ||
                    epName.includes(`tập ${episodeNum.toString().padStart(2, '0')}`) ||
                    epSlug === `tap-${episodeNum}` ||
                    epSlug === `tap-${episodeNum.toString().padStart(2, '0')}`
                )
            })

            if (targetEpisode) {
                if (episode.server_name?.toLowerCase().includes('vietsub')) {
                    vietsubLink = targetEpisode.link_m3u8 || targetEpisode.link_embed?.split('?url=')[1] || ''
                } else if (
                    episode.server_name?.toLowerCase().includes('thuyết minh') ||
                    episode.server_name?.toLowerCase().includes('lồng tiếng') ||
                    episode.server_name?.toLowerCase().includes('dubbed')
                ) {
                    dubbedLink = targetEpisode.link_m3u8 || targetEpisode.link_embed?.split('?url=')[1] || ''
                }
            }
        }

        setVideoLinks(prev => ({
            ...prev,
            vietsub: vietsubLink,
            dubbed: dubbedLink
        }))
    }, [])

    // Generate episode cards
    const generateEpisodeCards = () => {
        const cards = []
        const colors = [
            'from-blue-600/20',
            'from-purple-600/20',
            'from-pink-600/20',
            'from-red-600/20',
            'from-orange-600/20',
            'from-yellow-600/20',
            'from-green-600/20',
            'from-teal-600/20',
            'from-cyan-600/20',
            'from-indigo-600/20'
        ]

        for (let i = 1; i <= totalEpisodes; i++) {
            const arcInfo = getArcInfo(i)
            const colorIndex = (arcInfo.season - 1) % colors.length
            const colorClass = colors[colorIndex]

            cards.push(
                <motion.div
                    key={i}
                    id={`anime-episode-${i}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.01, 1) }}
                    onClick={() => handleEpisodeSelect(i)}
                    className={`relative bg-gradient-to-br ${colorClass} to-gray-800 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 group ${selectedEpisode === i
                        ? 'ring-2 ring-red-500 ring-offset-2 ring-offset-gray-900 scale-105 shadow-lg shadow-red-500/25'
                        : 'hover:scale-105 hover:shadow-lg hover:shadow-gray-500/25'
                        }`}
                >
                    <div className={`relative flex items-center justify-center ${isEpisodesCompact ? 'aspect-square' : 'aspect-[3/4]'}`}>
                        {/* Episode Number */}
                        <div className="relative text-center z-10">
                            <div className={`font-black text-white mb-2 drop-shadow-lg ${isEpisodesCompact ? 'text-2xl sm:text-3xl' : 'text-4xl sm:text-5xl'}`}>
                                {i}
                            </div>
                            {!isEpisodesCompact && (
                                <div className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                                    EP {i}
                                </div>
                            )}
                        </div>

                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                            <i className="fas fa-play-circle text-5xl text-red-500 transform group-hover:scale-110 transition-transform"></i>
                        </div>

                        {/* Arc badge */}
                        <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-xs font-semibold border border-white/20">
                            {arcInfo.arcName}
                        </div>

                        {/* Selected indicator */}
                        {selectedEpisode === i && (
                            <div className="absolute top-2 right-2">
                                <div className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-lg">
                                    ✓
                                </div>
                            </div>
                        )}
                    </div>

                    {!isEpisodesCompact && (
                        <div className="p-2 bg-gray-800/50 backdrop-blur-sm">
                            <h3 className="font-bold text-xs text-center text-white">Tập {i}</h3>
                        </div>
                    )}
                </motion.div>
            )
        }

        return cards
    }

    // Get current video source
    const getCurrentVideoSrc = () => {
        if (selectedServer === 'server2') {
            return { type: 'iframe', src: videoLinks.server2 }
        }

        const src = selectedAudio === 'vietsub' ? videoLinks.vietsub : videoLinks.dubbed
        if (src) {
            return { type: 'player', src, audio: selectedAudio }
        }

        return null
    }

    const currentArcInfo = getArcInfo(selectedEpisode)
    const videoSource = getCurrentVideoSrc()

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-white">
            {/* Player Section */}
            <div id="anime-player-section" className="mb-12">
                <h2 className="text-3xl font-bold mb-6">Watch Now</h2>

                {/* Controls */}
                <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-800/50 p-4 rounded-2xl backdrop-blur-sm border border-gray-700 shadow-xl">
                    {/* Audio Type Selector */}
                    <div className="flex items-center gap-2">
                        <span className="text-gray-400 font-bold mr-2">
                            <i className="fas fa-volume-up"></i> Âm thanh:
                        </span>
                        <div className="bg-gray-900 rounded-lg p-1 flex border border-gray-700">
                            <button
                                onClick={() => handleAudioChange('vietsub')}
                                className={`px-4 py-1.5 rounded-md font-bold text-sm transition ${selectedAudio === 'vietsub'
                                    ? 'bg-red-600 text-white shadow-md'
                                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                                    }`}
                            >
                                Vietsub
                            </button>
                            <button
                                onClick={() => handleAudioChange('dubbed')}
                                className={`px-4 py-1.5 rounded-md font-bold text-sm transition ${selectedAudio === 'dubbed'
                                    ? 'bg-red-600 text-white shadow-md'
                                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                                    }`}
                            >
                                Lồng Tiếng
                            </button>
                        </div>
                    </div>

                    {/* Server Selector */}
                    <div className="flex items-center gap-2">
                        <span className="text-gray-400 font-bold mr-2">
                            <i className="fas fa-server"></i> Server:
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleServerChange('server1')}
                                className={`px-4 py-2 rounded-lg font-bold text-sm transition shadow-lg flex items-center gap-2 ${selectedServer === 'server1'
                                    ? 'bg-blue-600 hover:bg-blue-700'
                                    : 'bg-gray-600 hover:bg-gray-700'
                                    }`}
                            >
                                <i className="fas fa-bolt"></i> Server 1
                            </button>
                            <button
                                onClick={() => handleServerChange('server2')}
                                className={`px-4 py-2 rounded-lg font-bold text-sm transition shadow-lg flex items-center gap-2 ${selectedServer === 'server2'
                                    ? 'bg-blue-600 hover:bg-blue-700'
                                    : 'bg-gray-600 hover:bg-gray-700'
                                    }`}
                            >
                                <i className="fas fa-globe"></i> Server 2
                            </button>
                        </div>
                    </div>
                </div>

                {/* Video Player */}
                <div className="bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-gray-800 mb-6">
                    <div className="relative aspect-video">
                        {selectedEpisode === 0 ? (
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent flex items-center justify-center">
                                <div className="text-center">
                                    <i className="fas fa-play-circle text-8xl text-red-500 mb-4 drop-shadow-2xl"></i>
                                    <p className="text-2xl font-bold bg-black/50 px-6 py-2 rounded-full backdrop-blur-md">
                                        Chọn tập để xem
                                    </p>
                                </div>
                            </div>
                        ) : isLoading ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-black">
                                <div className="text-center">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                                        className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-4"
                                    />
                                    <p className="text-xl">Đang tải...</p>
                                </div>
                            </div>
                        ) : videoSource?.type === 'player' && videoSource.src ? (
                            <EnhancedMoviePlayer
                                key={`episode-${selectedEpisode}-${videoSource.audio}`}
                                src={videoSource.src}
                                poster={tvShow.poster}
                                autoPlay={false}
                                movieId={tvShow.id}
                                server={selectedServer}
                                audio={videoSource.audio}
                                title={`${tvShow.name} - Episode ${selectedEpisode}`}
                                season={currentArcInfo.season}
                                episode={selectedEpisode}
                                isTVShow={true}
                                userId={typeof userId === 'string' ? userId : undefined}
                            />
                        ) : videoSource?.type === 'iframe' && videoSource.src ? (
                            <iframe
                                src={videoSource.src}
                                className="w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                title={`${tvShow.name} - Episode ${selectedEpisode}`}
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-black">
                                <div className="text-center">
                                    <i className="fas fa-exclamation-circle text-6xl text-red-500 mb-4"></i>
                                    <p className="text-xl font-bold">Không tìm thấy nguồn phát</p>
                                    <p className="text-sm text-gray-400 mt-2">Vui lòng thử server khác</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Episode Info */}
                <div className="text-center space-y-2">
                    <h3 className="text-3xl md:text-4xl font-bold text-white tracking-wide">
                        {tvShow.name} - Tập {selectedEpisode}
                    </h3>
                    <div className="flex justify-center items-center gap-3">
                        <span className="px-3 py-1 bg-yellow-600/20 text-yellow-400 border border-yellow-600/50 rounded-lg font-bold">
                            {currentArcInfo.arcName}
                        </span>
                        <span className="px-3 py-1 bg-blue-600/20 text-blue-400 border border-blue-600/50 rounded-lg font-bold text-sm">
                            {selectedServer === 'server1' ? (selectedAudio === 'vietsub' ? 'Vietsub' : 'Lồng Tiếng') : 'Server 2'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Episodes Section */}
            <div className="mb-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h2 className="text-4xl md:text-5xl font-bold">Tất cả tập phim</h2>
                        <p className="text-gray-400 mt-2">{totalEpisodes}+ tập</p>
                    </div>

                    {/* Quick Jump & View Toggle */}
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => jumpToEpisode(1)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-semibold transition"
                        >
                            Tập 1
                        </button>
                        {totalEpisodes >= 100 && (
                            <button
                                onClick={() => jumpToEpisode(100)}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-semibold transition"
                            >
                                Tập 100
                            </button>
                        )}
                        {totalEpisodes >= 500 && (
                            <button
                                onClick={() => jumpToEpisode(500)}
                                className="px-4 py-2 bg-pink-600 hover:bg-pink-700 rounded-lg text-sm font-semibold transition"
                            >
                                Tập 500
                            </button>
                        )}
                        {totalEpisodes >= 1000 && (
                            <button
                                onClick={() => jumpToEpisode(1000)}
                                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-sm font-semibold transition"
                            >
                                Tập 1000
                            </button>
                        )}
                        <button
                            onClick={() => jumpToEpisode(totalEpisodes)}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-semibold transition"
                        >
                            Mới nhất
                        </button>

                        {/* Compact toggle */}
                        <button
                            onClick={() => setIsEpisodesCompact(!isEpisodesCompact)}
                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-semibold transition flex items-center gap-2"
                            title={isEpisodesCompact ? 'Expand view' : 'Compact view'}
                        >
                            {isEpisodesCompact ? (
                                <>
                                    <i className="fas fa-expand-alt"></i> Mở rộng
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-compress-alt"></i> Thu gọn
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Episodes Grid */}
                <div
                    className={`grid gap-3 sm:gap-4 ${isEpisodesCompact
                        ? 'grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 2xl:grid-cols-16'
                        : 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10'
                        }`}
                >
                    {generateEpisodeCards()}
                </div>
            </div>
        </div>
    )
}
