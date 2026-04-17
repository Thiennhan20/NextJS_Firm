'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useSearchParams, useRouter } from 'next/navigation'
import EnhancedMoviePlayer from '@/components/common/video-player/EnhancedMoviePlayer'
import useAuthStore from '@/store/useAuthStore'
import { proxyHlsUrl } from '@/lib/hlsProxy'
import WatchNowTVShowsServer1 from './WatchNowTVShowsServer1'
import WatchNowTVShowsServer2 from './WatchNowTVShowsServer2'
import WatchNowTVShowsServer3 from './WatchNowTVShowsServer3'
import { Radio } from 'lucide-react'

// Định nghĩa kiểu TVShow
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

interface WatchNowTVShowsProps {
  tvShow: TVShow;
  selectedSeason: number;
  selectedEpisode: number;
  episodes: Episode[];
}

export default function WatchNowTVShows({
  tvShow,
  selectedSeason,
  selectedEpisode,
  episodes: _episodes
}: WatchNowTVShowsProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = useAuthStore((s) => (s.user as any)?.id || (s.user as any)?._id)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const [streamAuthMessage, setStreamAuthMessage] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const episodes = _episodes;
  const searchParams = useSearchParams();
  const router = useRouter();

  const [selectedServer, setSelectedServer] = useState<'server1' | 'server2' | 'server3'>('server1');
  const hasInitialized = useRef(false);

  // Read audio parameter from URL
  const audioFromUrl = searchParams.get('audio');

  const [selectedAudio, setSelectedAudio] = useState<'vietsub' | 'dubbed' | null>(null);
  const [server2Link, setServer2Link] = useState('');
  const [tvShowLinksLoading, setTVShowLinksLoading] = useState(false);
  const [apiSearchCompleted, setApiSearchCompleted] = useState(false);
  const [dataReady, setDataReady] = useState(false);

  // Server 3 states
  const [server3Links, setServer3Links] = useState({ vietsub: '', dubbed: '', m3u8: '' });
  const [server3Loading, setServer3Loading] = useState(false);
  const [server3SearchCompleted, setServer3SearchCompleted] = useState(false);

  // ✅ Di chuyển tvShowLinks lên đây để useEffect có thể dùng
  const [tvShowLinks, setTVShowLinks] = useState({
    embed: '',
    m3u8: '',
    vietsub: '', // Link cho Vietsub
    dubbed: '', // Link cho Lồng Tiếng
    seasonChanged: false,
    currentSeason: 0, // Lưu season hiện tại đã tìm kiếm
  });

  // Cập nhật URL khi thay đổi server
  const updateServerInUrl = (server: 'server1' | 'server2' | 'server3') => {
    const params = new URLSearchParams(searchParams.toString());
    const currentServer = searchParams.get('server');

    // Chỉ cập nhật nếu server thực sự thay đổi
    if (currentServer !== server) {
      params.set('server', server);
      const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;

      // Nếu đang từ server khác về server1, sử dụng replace để không tạo history entry mới
      if (currentServer !== 'server1' && server === 'server1') {
        router.replace(newUrl, { scroll: false });
      } else {
        router.push(newUrl, { scroll: false });
      }
    }
  };

  // Cập nhật server và URL
  const handleServerChange = (server: 'server1' | 'server2' | 'server3') => {
    if (selectedServer !== server) {
      setSelectedServer(server);
      updateServerInUrl(server);
    }
  };

  // Đọc server từ URL khi component mount hoặc URL thay đổi
  useEffect(() => {
    const serverFromUrl = searchParams.get('server');
    if (serverFromUrl === 'server1' || serverFromUrl === 'server2' || serverFromUrl === 'server3') {
      setSelectedServer(serverFromUrl);
      hasInitialized.current = true;
    } else {
      // Nếu không có tham số server, mặc định về server1
      setSelectedServer('server1');
      hasInitialized.current = true;
    }
  }, [searchParams]);

  // Sync selectedAudio when audioFromUrl changes
  useEffect(() => {
    const currentLinks = selectedServer === 'server3' ? server3Links : tvShowLinks;
    if (audioFromUrl === 'vietsub' && currentLinks.vietsub && selectedAudio !== 'vietsub') {
      setSelectedAudio('vietsub');
    } else if (audioFromUrl === 'dubbed' && currentLinks.dubbed && selectedAudio !== 'dubbed') {
      setSelectedAudio('dubbed');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioFromUrl, tvShowLinks.vietsub, tvShowLinks.dubbed, server3Links.vietsub, server3Links.dubbed, selectedAudio, selectedServer]);

  // Tự động chọn audio khi có sẵn, ưu tiên từ URL
  useEffect(() => {
    const currentLinks = selectedServer === 'server3' ? server3Links : tvShowLinks;
    if (!selectedAudio) {
      // Nếu URL có tham số audio, ưu tiên sử dụng audio từ URL
      if (audioFromUrl === 'dubbed' && currentLinks.dubbed) {
        setSelectedAudio('dubbed');
        return;
      }
      if (audioFromUrl === 'vietsub' && currentLinks.vietsub) {
        setSelectedAudio('vietsub');
        return;
      }

      // Nếu không có audio từ URL hoặc audio từ URL không khả dụng, chọn mặc định
      if (currentLinks.vietsub && currentLinks.dubbed) {
        setSelectedAudio('vietsub'); // Default to vietsub
        return;
      }

      // Nếu chỉ có một loại audio, tự động chọn
      if (currentLinks.vietsub && !currentLinks.dubbed) {
        setSelectedAudio('vietsub');
        return;
      }
      if (currentLinks.dubbed && !currentLinks.vietsub) {
        setSelectedAudio('dubbed');
        return;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tvShowLinks.vietsub, tvShowLinks.dubbed, server3Links.vietsub, server3Links.dubbed, selectedAudio, audioFromUrl, selectedServer]);

  // Stream URL hiệu lực cho nút Stream (chỉ Server 1)
  const effectiveStreamUrl = useMemo(() => {
    if (selectedServer !== 'server1') return '';
    if (!apiSearchCompleted || tvShowLinksLoading || !dataReady) return '';
    if (selectedAudio === 'vietsub' && tvShowLinks.vietsub) return tvShowLinks.vietsub;
    if (selectedAudio === 'dubbed' && tvShowLinks.dubbed) return tvShowLinks.dubbed;
    if (tvShowLinks.vietsub) return tvShowLinks.vietsub;
    if (tvShowLinks.dubbed) return tvShowLinks.dubbed;
    return tvShowLinks.m3u8;
  }, [selectedServer, apiSearchCompleted, tvShowLinksLoading, dataReady, selectedAudio, tvShowLinks.vietsub, tvShowLinks.dubbed, tvShowLinks.m3u8]);

  // Handler cho nút Stream
  const handleStreamClick = () => {
    if (!isAuthenticated) {
      setStreamAuthMessage(true);
      return;
    }
    if (!effectiveStreamUrl) return;

    const params = new URLSearchParams({
      streamUrl: effectiveStreamUrl,
      title: `${tvShow.name} - S${selectedSeason} E${selectedEpisode}`,
      movieId: String(tvShow.id),
      poster: tvShow.poster || '',
      type: 'tvshow',
      season: String(selectedSeason),
      episode: String(selectedEpisode),
    });
    router.push(`/streaming-lobby?${params.toString()}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-white">
      <h2 className="text-3xl font-bold mb-6">Watch Now</h2>

      {/* Server 1 Component */}
      <WatchNowTVShowsServer1
        tvShow={tvShow}
        selectedSeason={selectedSeason}
        selectedEpisode={selectedEpisode}
        onLinksChange={(links) => {
          setTVShowLinks(prev => ({ ...prev, ...links }))
        }}
        onLoadingChange={(loading) => {
          setTVShowLinksLoading(loading)
        }}
        onSearchComplete={(completed) => {
          setApiSearchCompleted(completed)
        }}
        onDataReadyChange={(ready) => {
          setDataReady(ready)
        }}
      />

      {/* Server 2 Component */}
      <WatchNowTVShowsServer2
        tvShow={tvShow}
        selectedSeason={selectedSeason}
        selectedEpisode={selectedEpisode}
        onLinkChange={setServer2Link}
      />

      {/* Server 3 Component - Load tự động sau Server 1 */}
      <WatchNowTVShowsServer3
        tvShow={tvShow}
        selectedSeason={selectedSeason}
        selectedEpisode={selectedEpisode}
        server1Ready={apiSearchCompleted}
        onLinksChange={(links) => {
          setServer3Links(links)
        }}
        onLoadingChange={(loading) => {
          setServer3Loading(loading)
        }}
        onSearchComplete={(completed) => {
          setServer3SearchCompleted(completed)
        }}
      />

      <div className="mb-4">
        {/* Server Buttons Row */}
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <button
            className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-semibold transition-colors ${selectedServer === 'server1' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
            onClick={() => handleServerChange('server1')}
          >
            Server 1
          </button>

          <button
            className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-semibold transition-colors ${selectedServer === 'server2' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
            onClick={() => handleServerChange('server2')}
          >
            Server 2
          </button>

          <button
            className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-semibold transition-colors ${selectedServer === 'server3' ? 'bg-amber-700 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
            onClick={() => handleServerChange('server3')}
          >
            Server 3
          </button>
        </div>

        {/* Active Server Options Area */}
        <div className="flex flex-wrap items-center min-h-[32px]">
          {selectedServer === 'server1' && (tvShowLinks.vietsub || tvShowLinks.dubbed) && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-300">Audio:</span>
              {tvShowLinks.vietsub && (
                <button
                  className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${selectedAudio === 'vietsub' ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
                  onClick={() => {
                    setSelectedAudio('vietsub');
                    const params = new URLSearchParams(searchParams.toString());
                    params.set('audio', 'vietsub');
                    router.push(`${window.location.pathname}?${params.toString()}`, { scroll: false });
                  }}
                >
                  Vietsub
                </button>
              )}
              {tvShowLinks.dubbed && (
                <button
                  className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${selectedAudio === 'dubbed' ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
                  onClick={() => {
                    setSelectedAudio('dubbed');
                    const params = new URLSearchParams(searchParams.toString());
                    params.set('audio', 'dubbed');
                    router.push(`${window.location.pathname}?${params.toString()}`, { scroll: false });
                  }}
                >
                  Dubbed
                </button>
              )}
            </div>
          )}

          {selectedServer === 'server2' && (
            <span className="text-xs text-yellow-300 bg-yellow-900/40 px-2 py-1 rounded">
              This server may contain ads.
            </span>
          )}

          {selectedServer === 'server3' && (server3Links.vietsub || server3Links.dubbed) && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-300">Audio:</span>
              {server3Links.vietsub && (
                <button
                  className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${selectedAudio === 'vietsub' ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
                  onClick={() => {
                    setSelectedAudio('vietsub');
                    const params = new URLSearchParams(searchParams.toString());
                    params.set('audio', 'vietsub');
                    router.push(`${window.location.pathname}?${params.toString()}`, { scroll: false });
                  }}
                >
                  Vietsub
                </button>
              )}
              {server3Links.dubbed && (
                <button
                  className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${selectedAudio === 'dubbed' ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
                  onClick={() => {
                    setSelectedAudio('dubbed');
                    const params = new URLSearchParams(searchParams.toString());
                    params.set('audio', 'dubbed');
                    router.push(`${window.location.pathname}?${params.toString()}`, { scroll: false });
                  }}
                >
                  Dubbed
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Header ngoài player, co giãn theo khung hình */}
      {selectedEpisode > 0 && (
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-white text-xs sm:text-sm md:text-base font-semibold truncate" title={`${tvShow.name} - S${selectedSeason} E${selectedEpisode}`}>
              {tvShow.name} - Season {selectedSeason} Episode {selectedEpisode}
            </h3>
            {((selectedServer === 'server1' && (tvShowLinks.vietsub || tvShowLinks.dubbed)) ||
              (selectedServer === 'server3' && (server3Links.vietsub || server3Links.dubbed))) && (
                <span className="px-2 py-0.5 text-[10px] sm:text-xs font-semibold rounded bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white whitespace-nowrap">
                  {selectedAudio === 'vietsub' ? 'Vietsub' :
                    selectedAudio === 'dubbed' ? 'Vietnamese Dubbed' :
                      (selectedServer === 'server1' ? tvShowLinks.vietsub : server3Links.vietsub) ? 'Vietsub' : 'Vietnamese Dubbed'}
                </span>
              )}
          </div>

          {/* Stream Button — chỉ hiện khi Server 1 đã load xong m3u8 */}
          {selectedServer === 'server1' && effectiveStreamUrl && (
            <div className="relative">
              <button
                onClick={handleStreamClick}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-yellow-500 to-amber-500 text-black text-xs sm:text-sm font-semibold hover:from-yellow-400 hover:to-amber-400 transition-all duration-300 shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/40 whitespace-nowrap"
                title="Start Watch Party"
              >
                <Radio className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Stream</span>
              </button>

              {/* Auth notification dropdown */}
              {streamAuthMessage && (
                <div className="absolute top-full right-0 mt-2 p-3 bg-gray-900/95 backdrop-blur-sm border border-yellow-500/30 rounded-xl shadow-2xl z-50 w-64">
                  <p className="text-sm text-white mb-2.5">You need to sign in to use this feature.</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push('/login')}
                      className="flex-1 px-3 py-1.5 bg-yellow-500 text-black text-xs font-semibold rounded-lg hover:bg-yellow-400 transition-colors"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => { setStreamAuthMessage(false); }}
                      className="px-3 py-1.5 bg-gray-700 text-white text-xs font-semibold rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
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
            if (!apiSearchCompleted || tvShowLinksLoading || !dataReady) {
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
            if (apiSearchCompleted && !tvShowLinksLoading && dataReady && !hasVideoSource) {
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
                src={proxyHlsUrl(videoSrc)}
                poster={tvShow.poster}
                autoPlay={false}
                movieId={tvShow.id}
                server={selectedServer}
                audio={effectiveAudio || undefined}
                title={tvShow.name}
                season={selectedSeason}
                episode={selectedEpisode}
                isTVShow={true}
                userId={typeof userId === 'string' ? userId : undefined}
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
            title={`${tvShow.name} - Season ${selectedSeason} Episode ${selectedEpisode} - Server 2`}
            referrerPolicy="origin"
          />
        ) : selectedServer === 'server3' ? (
          (() => {
            if (!server3SearchCompleted || server3Loading) {
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

            const hasVideoSource = server3Links.vietsub || server3Links.dubbed || server3Links.m3u8;
            if (server3SearchCompleted && !server3Loading && !hasVideoSource) {
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

            // Server 3 sử dụng iframe vì nguonc.com không cho phép embed trực tiếp
            let embedSrc = '';
            if (selectedAudio === 'vietsub' && server3Links.vietsub) {
              embedSrc = server3Links.vietsub;
            } else if (selectedAudio === 'dubbed' && server3Links.dubbed) {
              embedSrc = server3Links.dubbed;
            } else if (server3Links.vietsub) {
              embedSrc = server3Links.vietsub;
            } else if (server3Links.dubbed) {
              embedSrc = server3Links.dubbed;
            } else {
              embedSrc = server3Links.m3u8;
            }

            return embedSrc ? (
              <iframe
                key={`${selectedSeason}-${selectedEpisode}-${embedSrc}`}
                src={embedSrc}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={`${tvShow.name} - Season ${selectedSeason} Episode ${selectedEpisode} - Server 3`}
                referrerPolicy="origin"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-white text-lg font-semibold">
                No video source available
              </div>
            );
          })()
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
  );
}
