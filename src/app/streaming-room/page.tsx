'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Share, Video, MessageCircle, User, Eye, Heart, Maximize2, Minimize2, Hash, ArrowLeft } from 'lucide-react';
import useAuthStore from '@/store/useAuthStore';
import { useUIStore } from '@/store/store';
import axios from 'axios';
import Chat from '@/components/streaming/Chat';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

// Network Information interface
interface NetworkInformation extends EventTarget {
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g';
  rtt: number;
  downlink: number;
  saveData: boolean;
}

// Extend Navigator interface
declare global {
  interface Navigator {
    connection?: NetworkInformation;
  }
}

// Định nghĩa kiểu rõ ràng cho streamMovie nếu cần
interface StreamMovie {
  id: number;
  title: string;
  viewers?: number;
  likes?: number;
  description?: string;
  streamUrl?: string;
  poster?: string | null;
}

function StreamingRoomContent() {
  const { user } = useAuthStore();
  const { isNavDropdownOpen } = useUIStore();
  const searchParams = useSearchParams();
  const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
  const [streamMovie, setStreamMovie] = useState<StreamMovie | null>(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState(user?.name || `User${Math.floor(Math.random() * 1000)}`);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isChatVisible, setIsChatVisible] = useState(true);
  const [isMobileLandscape, setIsMobileLandscape] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);

  const videoContainerRef = useRef<HTMLDivElement | null>(null);

  // Phát hiện chế độ landscape/portrait
  useEffect(() => {
    const checkOrientation = () => {
      const isLandscape = window.matchMedia('(orientation: landscape)').matches;
      const isMobile = window.innerWidth <= 768;
      setIsMobileLandscape(isMobile && isLandscape);
      setIsChatVisible(!(isMobile && isLandscape)); // Ẩn chat ở mobile landscape
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  // Xử lý chế độ fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Get room ID from URL params
  useEffect(() => {
    const roomId = searchParams.get('room');
    setCurrentRoomId(roomId);
  }, [searchParams]);

  // Update username when user changes
  useEffect(() => {
    if (user?.name) {
      setUsername(user.name);
    }
  }, [user]);

  // Simulate live stream stats
  useEffect(() => {
    const interval = setInterval(() => {
      setStreamMovie((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          id: prev.id,
          title: prev.title,
          viewers: Math.max(0, (prev.viewers ?? 0) + Math.floor(Math.random() * 10) - 5),
          likes: Math.max(0, (prev.likes ?? 0) + Math.floor(Math.random() * 2)),
          description: prev.description,
          streamUrl: prev.streamUrl,
        };
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);



  useEffect(() => {
    const fetchMovie = async () => {
      setLoading(true);
      try {
        // Lấy một phim popular làm demo stream
        const response = await axios.get(
          `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&page=1`
        );
        const movie = response.data.results[0];
        setStreamMovie({
          id: movie.id,
          title: movie.title,
          description: movie.overview,
          streamUrl: `https://vidsrc.net/embed/movie/${movie.id}`,
          viewers: Math.floor(Math.random() * 2000) + 100, // random viewers
          likes: Math.floor(Math.random() * 500) + 50, // random likes
          poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
        });
      } catch (error) {
        console.error(error);
        setStreamMovie(null);
      }
      setLoading(false);
    };
    fetchMovie();
  }, [API_KEY]);



  const toggleFullscreen = () => {
    if (!document.fullscreenElement && videoContainerRef.current) {
      videoContainerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };


  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { useGrouping: true }).format(num);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white flex flex-col">
              {/* Header Stats */}
        {!isFullscreen && !isNavDropdownOpen && (
          <div className="bg-black/50 backdrop-blur-sm border-b border-yellow-600/30 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 sm:gap-6">
                  <Link href="/streaming-lobby">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 text-gray-300 hover:text-yellow-400 transition-colors duration-200"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span className="text-sm">Quay lại Lobby</span>
                    </motion.button>
                  </Link>
                  <div className="flex items-center gap-2 text-red-400">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-sm font-semibold">LIVE</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <Eye className="h-4 w-4" />
                    <span className="text-sm">{formatNumber(streamMovie?.viewers ?? 0)} viewers</span>
                  </div>
                  <div className="flex items-center gap-2 text-pink-400">
                    <Heart className="h-4 w-4" />
                    <span className="text-sm">{formatNumber(streamMovie?.likes ?? 0)} likes</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {currentRoomId && (
                    <div className="flex items-center gap-2 text-blue-400">
                      <Hash className="h-4 w-4" />
                      <span className="text-sm">Room: {currentRoomId}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-green-400">
                    <User className="h-4 w-4" />
                    <span className="text-sm">{onlineUsers} online</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-grow flex flex-col py-6">
        {/* Title */}
        {!isFullscreen && (
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-xl sm:text-2xl md:text-4xl font-bold text-center bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 bg-clip-text text-transparent mb-6 drop-shadow-2xl"
          >
            {streamMovie?.title}
          </motion.h1>
        )}

        <div className={`flex-grow flex flex-col ${isMobileLandscape ? 'relative landscape:flex-row landscape:flex-grow landscape:max-h-[calc(100vh-6rem)]' : 'lg:flex-row'} gap-6`}>
          {/* Main Content */}
          <div className={`${isMobileLandscape || isFullscreen ? 'w-full h-full landscape:flex-grow' : 'lg:w-2/3'} flex flex-col gap-6`}>
            {/* Main Video */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              ref={videoContainerRef}
              className={`relative ${isMobileLandscape || isFullscreen ? 'h-full' : 'aspect-video'} w-full rounded-2xl overflow-hidden shadow-2xl border-2 border-yellow-600/50 bg-gray-900 hover:border-yellow-500/70 transition-all duration-300`}
            >
              {loading ? (
                <div className="flex-grow flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-gray-400">Loading...</span>
                  </div>
                </div>
              ) : (
                <iframe
                  src={streamMovie?.streamUrl}
                  title={streamMovie?.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="absolute top-0 left-0 w-full h-full"
                  referrerPolicy="origin"
                />
              )}
              <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
                LIVE
              </div>
              {/* Fullscreen Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleFullscreen}
                className="absolute top-4 right-4 p-2 bg-gray-700/50 hover:bg-gray-600/50 text-yellow-400 rounded-xl transition-all duration-200 border border-yellow-500/20 hover:border-yellow-500/40 shadow-lg"
              >
                {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
              </motion.button>
            </motion.div>

            {/* Camera & Screen Share */}
            {!isFullscreen && !isMobileLandscape && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="relative aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden shadow-lg border border-gray-700/50 flex items-center justify-center group hover:border-yellow-600/50 transition-all duration-300 hover:shadow-yellow-600/20 hover:shadow-lg"
                >
                  <Video className="h-12 w-12 text-gray-600 group-hover:text-yellow-500 transition-colors duration-300" />
                  <span className="absolute bottom-4 text-gray-400 text-sm group-hover:text-yellow-300 transition-colors duration-300">Your Camera</span>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="relative aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden shadow-lg border border-gray-700/50 flex items-center justify-center group hover:border-yellow-600/50 transition-all duration-300 hover:shadow-yellow-600/20 hover:shadow-lg"
                >
                  <Share className="h-12 w-12 text-gray-600 group-hover:text-yellow-500 transition-colors duration-300" />
                  <span className="absolute bottom-4 text-gray-400 text-sm group-hover:text-yellow-300 transition-colors duration-300">Screen Share</span>
                </motion.div>
              </div>
            )}
          </div>

          {/* Chat Sidebar */}
          {!isFullscreen && (
            <Chat
              username={username}
              isVisible={isChatVisible}
              isMobileLandscape={isMobileLandscape}
              onUserCountChange={setOnlineUsers}
            />
          )}

          {/* Floating Chat Button for Mobile Landscape */}
          {isMobileLandscape && !isFullscreen && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsChatVisible(!isChatVisible)}
              className="fixed bottom-3 right-3 p-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black rounded-full shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50 transition-all duration-200 z-50"
            >
              <MessageCircle className="h-5 w-5" />
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StreamingRoomPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white flex items-center justify-center">Loading...</div>}>
      <StreamingRoomContent />
    </Suspense>
  );
}