'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useSearchParams, useRouter } from 'next/navigation'
import EnhancedMoviePlayer from '@/components/common/EnhancedMoviePlayer'
import useAuthStore from '@/store/useAuthStore'
import { setupAudioNodes, cleanupAudioNodes, AudioNodes } from '@/lib/audioUtils'
import WatchNowMoviesServer1 from './WatchNowMoviesServer1'
import WatchNowMoviesServer2 from './WatchNowMoviesServer2'
import WatchNowMoviesServer3 from './WatchNowMoviesServer3'

// Định nghĩa kiểu Movie
interface Movie {
  id: number;
  title: string;
  duration: string;
  year: number | '';
  releaseDate?: string;
  director: string;
  cast: string[];
  genre: string;
  description: string;
  poster: string;
  backdrop: string;
  trailer: string;
  movieUrl: string;
  scenes: string[];
}

interface WatchNowMoviesProps {
  movie: Movie;
}

export default function WatchNowMovies({ movie }: WatchNowMoviesProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = useAuthStore((s) => (s.user as any)?.id || (s.user as any)?._id)
  const searchParams = useSearchParams();
  const router = useRouter();

  const [selectedServer, setSelectedServer] = useState<'server1' | 'server2' | 'server3'>('server1');
  const hasInitialized = useRef(false);

  // Read audio parameter from URL
  const audioFromUrl = searchParams.get('audio');

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

  const [movieLinks, setMovieLinks] = useState({
    embed: '',
    m3u8: '',
    vietsub: '',
    dubbed: '', // Gộp thuyết minh và lồng tiếng
  });
  const [movieLinksLoading, setMovieLinksLoading] = useState(false);
  const [apiSearchCompleted, setApiSearchCompleted] = useState(false);
  const [selectedAudio, setSelectedAudio] = useState<'vietsub' | 'dubbed' | null>(null);

  // Server 3 states
  const [server3Links, setServer3Links] = useState({ vietsub: '', dubbed: '', m3u8: '' });
  const [server3Loading, setServer3Loading] = useState(false);
  const [server3SearchCompleted, setServer3SearchCompleted] = useState(false);

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
    const currentLinks = selectedServer === 'server3' ? server3Links : movieLinks;
    if (audioFromUrl === 'vietsub' && currentLinks.vietsub && selectedAudio !== 'vietsub') {
      setSelectedAudio('vietsub');
    } else if (audioFromUrl === 'dubbed' && currentLinks.dubbed && selectedAudio !== 'dubbed') {
      setSelectedAudio('dubbed');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioFromUrl, movieLinks.vietsub, movieLinks.dubbed, server3Links.vietsub, server3Links.dubbed, selectedAudio, selectedServer]);

  // Server 2 states
  const [server2Link, setServer2Link] = useState('');



  // Tự động chọn audio khi có sẵn, ưu tiên từ URL
  useEffect(() => {
    const currentLinks = selectedServer === 'server3' ? server3Links : movieLinks;
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
      // Nếu có cả hai, ưu tiên Vietsub
      if (currentLinks.vietsub && currentLinks.dubbed) {
        setSelectedAudio('vietsub');
        return;
      }
      // Nếu chỉ có một loại audio, tự động chọn
      if (currentLinks.vietsub) {
        setSelectedAudio('vietsub');
        return;
      }
      if (currentLinks.dubbed) {
        setSelectedAudio('dubbed');
        return;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movieLinks.vietsub, movieLinks.dubbed, server3Links.vietsub, server3Links.dubbed, selectedAudio, audioFromUrl, selectedServer]);

  // Audio hiệu lực để hiển thị ngoài player
  const effectiveAudio = useMemo<('vietsub' | 'dubbed' | null)>(() => {
    const currentLinks = selectedServer === 'server3' ? server3Links : movieLinks;
    if (selectedAudio === 'vietsub' && currentLinks.vietsub) return 'vietsub';
    if (selectedAudio === 'dubbed' && currentLinks.dubbed) return 'dubbed';
    if (currentLinks.vietsub) return 'vietsub';
    if (currentLinks.dubbed) return 'dubbed';
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAudio, movieLinks.vietsub, movieLinks.dubbed, server3Links.vietsub, server3Links.dubbed, selectedServer]);

  const videoRef = useRef<HTMLVideoElement>(null);
  // State cho các bộ lọc âm thanh (không hiển thị trong UI)
  const audioNodesRef = useRef<AudioNodes | null>(null);

  // Khởi tạo AudioContext cho trình phát inline của server 1
  useEffect(() => {
    if (selectedServer !== 'server1' || !videoRef.current) return;
    let cancelled = false;
    const videoEl = videoRef.current;
    if (!videoEl) return;
    (async () => {
      if (!audioNodesRef.current) {
        const nodes = await setupAudioNodes(videoEl);
        if (!cancelled) {
          audioNodesRef.current = nodes;
        }
      }
    })();
    return () => {
      cancelled = true;
      if (audioNodesRef.current) {
        cleanupAudioNodes(audioNodesRef.current);
        audioNodesRef.current = null;
      }
    };
  }, [selectedServer]);



  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-white">
      <h2 className="text-3xl font-bold mb-6">Watch Now</h2>

      {/* Server 1 Component */}
      <WatchNowMoviesServer1
        movie={movie}
        onLinksChange={(links) => setMovieLinks(links)}
        onLoadingChange={setMovieLinksLoading}
        onSearchComplete={setApiSearchCompleted}
      />

      {/* Server 2 Component */}
      <WatchNowMoviesServer2
        movie={movie}
        onLinkChange={setServer2Link}
      />

      {/* Server 3 Component - Load tự động sau Server 1 */}
      <WatchNowMoviesServer3
        movie={movie}
        server1Ready={apiSearchCompleted}
        onLinksChange={setServer3Links}
        onLoadingChange={setServer3Loading}
        onSearchComplete={setServer3SearchCompleted}
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
          {selectedServer === 'server1' && (movieLinks.vietsub || movieLinks.dubbed) && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-300">Audio:</span>
              {movieLinks.vietsub && (
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
              {movieLinks.dubbed && (
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
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="text-white text-xs sm:text-sm md:text-base font-semibold truncate" title={movie.title}>{movie.title}</h3>
          {((selectedServer === 'server1' || selectedServer === 'server3') && effectiveAudio) && (
            <span className="px-2 py-0.5 text-[10px] sm:text-xs font-semibold rounded bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white whitespace-nowrap">
              {effectiveAudio === 'vietsub' ? 'Vietsub' : 'Vietnamese Dubbed'}
            </span>
          )}
        </div>
      </div>

      <div className="relative w-full rounded-lg overflow-hidden bg-black/50 aspect-video">
        {selectedServer === 'server1' && (
          (() => {
            if (!apiSearchCompleted || movieLinksLoading) {
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

            const hasVideoSource = movieLinks.vietsub || movieLinks.dubbed || movieLinks.m3u8;
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
            if (selectedAudio === 'vietsub' && movieLinks.vietsub) {
              videoSrc = movieLinks.vietsub;
              effectiveAudio = 'vietsub';
            } else if (selectedAudio === 'dubbed' && movieLinks.dubbed) {
              videoSrc = movieLinks.dubbed;
              effectiveAudio = 'dubbed';
            } else if (movieLinks.vietsub) {
              videoSrc = movieLinks.vietsub;
              effectiveAudio = 'vietsub';
            } else if (movieLinks.dubbed) {
              videoSrc = movieLinks.dubbed;
              effectiveAudio = 'dubbed';
            } else {
              videoSrc = movieLinks.m3u8;
              effectiveAudio = null;
            }

            return videoSrc ? (
              <EnhancedMoviePlayer
                key={videoSrc}
                ref={videoRef}
                src={videoSrc}
                poster={movie.poster}
                autoPlay={false}
                movieId={movie.id}
                server={selectedServer}
                audio={effectiveAudio || undefined}
                title={movie.title}
                userId={typeof userId === 'string' ? userId : undefined}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-white text-lg font-semibold">
                No video source available
              </div>
            );
          })()
        )}
        {selectedServer === 'server2' && (
          <iframe
            src={server2Link}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={movie.title + ' - Server 2'}
            referrerPolicy="origin"
          />
        )}
        {selectedServer === 'server3' && (
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
                key={embedSrc}
                src={embedSrc}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={movie.title + ' - Server 3'}
                referrerPolicy="origin"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-white text-lg font-semibold">
                No video source available
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
}
