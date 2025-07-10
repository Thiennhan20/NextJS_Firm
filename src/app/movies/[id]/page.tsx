'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import Image from 'next/image'
import { StarIcon, ClockIcon, CalendarIcon, PlayIcon } from '@heroicons/react/24/solid'
import { BookmarkIcon } from '@heroicons/react/24/outline'
import { useWatchlistStore } from '@/store/store'
import toast from 'react-hot-toast'
import axios from 'axios'
import { useParams } from 'next/navigation'
import useAuthStore from '@/store/useAuthStore'
import api from '@/lib/axios'
import MoviePlayer from '@/components/common/MoviePlayer';

// Định nghĩa kiểu Movie rõ ràng
interface Movie {
  id: number;
  title: string;
  rating: number;
  duration: string;
  year: number | '';
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

export default function MovieDetail() {
  const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
  const { id } = useParams();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeScene, setActiveScene] = useState<number | null>(null)
  const [showTrailer, setShowTrailer] = useState<boolean>(false)
  const [showMovie, setShowMovie] = useState<boolean>(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  })

  const { addToWatchlist, removeFromWatchlist, isInWatchlist, fetchWatchlistFromServer } = useWatchlistStore();
  const { isAuthenticated, token } = useAuthStore();
  const isBookmarked = movie ? isInWatchlist(movie.id) : false;

  const handleToggleWatchlist = async () => {
    if (!movie) return;
    if (!isAuthenticated || !token) {
      toast.error('You need to log in to save movies!');
      return;
    }
    try {
      if (isBookmarked) {
        await api.delete('/auth/watchlist', {
          headers: { Authorization: `Bearer ${token}` },
          data: { id: movie.id },
        });
        removeFromWatchlist(movie.id);
        toast.success('Removed movie from watchlist!');
      } else {
        await api.post('/auth/watchlist', {
          id: movie.id,
          title: movie.title,
          poster_path: movie.poster,
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        addToWatchlist({
          id: movie.id,
          title: movie.title,
          poster_path: movie.poster,
        });
        toast.success('Added movie to watchlist!');
      }
      await fetchWatchlistFromServer(token);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'An error occurred');
      } else {
        toast.error('An error occurred');
      }
    }
  };

  // Thêm state quản lý server và modal chọn server
  const [showServerModal, setShowServerModal] = useState(false);
  const [selectedServer, setSelectedServer] = useState<string | null>(null);

  const handleWatchMovie = async () => {
    if (!movie) return;
    setShowServerModal(true); // BỎ kiểm tra subtitle, luôn hiện modal chọn server
  };

  const y = useTransform(scrollYProgress, [0, 1], [0, -100])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  // Thêm state movieLinks để demo, sau này thay bằng data thực tế lấy từ API chi tiết phim
  const [movieLinks, setMovieLinks] = useState({
    embed: '',
    m3u8: '',
  });
  const [movieLinksLoading, setMovieLinksLoading] = useState(false);

  // Bỏ state và UI lỗi server
  // const [showServerError, setShowServerError] = useState(false);
  // Reset lỗi khi đổi server
  // useEffect(() => { setShowServerError(false); }, [selectedServer]);

  useEffect(() => {
    const fetchMovie = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `https://api.themoviedb.org/3/movie/${id}?api_key=${API_KEY}`
        );
        const data = response.data;
        // Fetch images
        let scenes: string[] = [];
        try {
          const imgRes = await axios.get(
            `https://api.themoviedb.org/3/movie/${id}/images?api_key=${API_KEY}`
          );
          const backdrops: { file_path: string }[] = imgRes.data.backdrops || [];
          scenes = backdrops.slice(0, 3).map((img) => `https://image.tmdb.org/t/p/w780${img.file_path}`);
        } catch {}
        // Fallback nếu không có đủ ảnh
        if (scenes.length < 3) {
          if (data.backdrop_path) scenes.push(`https://image.tmdb.org/t/p/w780${data.backdrop_path}`);
          if (data.poster_path) scenes.push(`https://image.tmdb.org/t/p/w500${data.poster_path}`);
        }
        scenes = scenes.slice(0, 3);
        // Fetch trailer
        let trailer = '';
        try {
          const videoRes = await axios.get(
            `https://api.themoviedb.org/3/movie/${id}/videos?api_key=${API_KEY}`
          );
          const videos: { type: string; site: string; key: string }[] = videoRes.data.results || [];
          const ytTrailer = videos.find((v) => v.type === 'Trailer' && v.site === 'YouTube');
          if (ytTrailer) {
            trailer = `https://www.youtube.com/embed/${ytTrailer.key}`;
          }
        } catch {}
        const movieData = {
          id: data.id,
          title: data.title,
          rating: data.vote_average,
          duration: data.runtime ? `${Math.floor(data.runtime / 60)}h ${data.runtime % 60}m` : '',
          year: data.release_date ? Number(data.release_date.slice(0, 4)) : '' as number | '',
          director: '',
          cast: [],
          genre: data.genres ? data.genres.map((g: { name: string }) => g.name).join(', ') : '',
          description: data.overview,
          poster: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : '',
          backdrop: data.backdrop_path ? `https://image.tmdb.org/t/p/original${data.backdrop_path}` : '',
          trailer,
          movieUrl: '',
          scenes,
        };
        setMovie(movieData);
        
      } catch {
        setMovie(null);
      }
      setLoading(false);
    };
    fetchMovie();
  }, [id, API_KEY]);

  useEffect(() => {
    if (movie?.title && movie?.year) {
      setMovieLinksLoading(true);
      fetch(`/api/subtitles?query=${encodeURIComponent(movie.title)}&year=${movie.year.toString()}`)
        .then(res => res.json())
        .then(() => {
          // setSubtitles(data.data || []); // Removed as per edit hint
        })
        .catch(() => {
          // setSubtitles([]); // Removed as per edit hint
        })
        .finally(() => setMovieLinksLoading(false));
    }
  }, [movie?.title, movie?.year]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as { isWatchingFullMovie?: boolean }).isWatchingFullMovie = showMovie;
    }
  }, [showMovie]);

  useEffect(() => {
    console.log('Vào trang chi tiết phim với id:', id); // Chỉ log 1 lần khi vào trang
    let timeoutId: NodeJS.Timeout;
    async function fetchPhimApiEmbed() {
      if (movieLinks.m3u8) return; // Nếu đã có link thì không fetch nữa
      setMovieLinksLoading(true);
      timeoutId = setTimeout(() => {
        // Không tắt loading nếu chưa có link
      }, 60000); // 1 phút
      try {
        if (typeof id !== 'string') {
          console.log('ID không hợp lệ!');
          clearTimeout(timeoutId);
          return;
        }
        let slug = null;
        let logged = false;
        if (movie?.title) {
          // Chuẩn bị các biến thể keyword
          const keywords = [
            movie.title,
          ].filter(Boolean);
          // Thử tìm kiếm với nhiều keyword
          outer: for (const keyword of keywords) {
            for (const y of [movie.year as number, undefined]) {
              let url = `https://phimapi.com/v1/api/tim-kiem?keyword=${encodeURIComponent(keyword)}`;
              if (y) url += `&year=${y}`;
              if (!logged) {
                console.log('[PhimAPI] Gọi API:', url);
              }
              const res = await fetch(url);
              const data = await res.json();
              if (!logged) {
                console.log('[PhimAPI] Dữ liệu trả về:', data);
                logged = true;
              }
              // Sửa: kiểm tra data.data.items thay vì data.items
              if (
                data.status === 'success' &&
                data.data &&
                Array.isArray(data.data.items) &&
                data.data.items.length > 0 &&
                data.data.items[0].slug
              ) {
                console.log('Phim đầu tiên trong data.items:', data.data.items[0]);
                slug = data.data.items[0].slug;
                console.log('Slug lấy được từ data.items[0]:', slug);
                break outer;
              }
            }
          }
        }
        if (!slug) {
          console.log('Không tìm thấy phim qua tìm kiếm keyword, dừng lại.');
          clearTimeout(timeoutId);
          return;
        }
        // Lấy chi tiết phim theo slug để lấy link_embed
        const detailRes = await fetch(`https://phimapi.com/phim/${slug}`);
        const detailData = await detailRes.json();
        console.log('Chi tiết phim:', detailData);
        let embed = '';
        if (detailData.link_embed) {
          embed = detailData.link_embed;
          if (embed.includes('?url=')) {
            embed = embed.split('?url=')[1];
          }
          if (embed.endsWith('.m3u8')) {
            console.log('Link embed trực tiếp:', embed);
          }
        } else if (detailData.episodes && detailData.episodes[0]?.server_data[0]?.link_embed) {
          embed = detailData.episodes[0].server_data[0].link_embed;
          if (embed.includes('?url=')) {
            embed = embed.split('?url=')[1];
          }
          if (embed.endsWith('.m3u8')) {
            console.log('Link embed từ episodes:', embed);
          }
        } else {
          console.log('Không tìm thấy link_embed hợp lệ.');
        }
        if (embed) {
          setMovieLinks(links => ({ ...links, m3u8: embed }));
          setMovieLinksLoading(false); // Tắt loading khi đã có link
        }
      } catch (e) {
        console.error('Lỗi khi fetch phimapi:', e);
      } finally {
        clearTimeout(timeoutId);
      }
    }
    fetchPhimApiEmbed();
  }, [id, movie?.title, movie?.year, movieLinks.m3u8]);

  if (loading || !movie) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-black">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
          className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  // destructure movie để dùng an toàn phía dưới
  const { title, backdrop, poster, rating, duration, year, genre, director, cast, description, scenes, trailer } = movie;

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      {/* Hero Section */}
      <div className="relative w-full overflow-hidden py-16 lg:py-0 min-h-screen flex items-center">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src={backdrop}
            alt={title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black" />
        </div>
        
        {/* Content Area */}
        <motion.div
          style={{ y, opacity }}
          className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center"
        >
          {/* 3D Poster Column */}
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
                <MoviePoster3D posterUrl={`/api/proxy-image?url=${encodeURIComponent(poster ?? '')}`} />
              </Canvas>
            ) : poster ? (
              <Image
                src={poster}
                alt={title}
                width={300}
                height={450}
                className="rounded-lg shadow-lg object-cover"
                style={{ maxHeight: '100%', maxWidth: '100%' }}
              />
            ) : (
              <div className="w-[300px] h-[450px] bg-gray-700 rounded-lg flex items-center justify-center">
                <span className="text-4xl">🎬</span>
              </div>
            )}
          </div>
          
          {/* Details Column */}
          <div className="text-white space-y-6">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-bold"
            >
              {title}
            </motion.h1>
            
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <StarIcon className="h-6 w-6 text-yellow-500" />
                <span className="text-yellow-500">{rating}</span>
              </div>
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
              <p className="text-gray-300">Director: {director}</p>
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

            {/* Action Buttons */}
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
              
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleWatchMovie}
                  className="px-6 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors flex items-center gap-2"
                >
                  <PlayIcon className="h-5 w-5" />
                  Watch Full Movie
                </motion.button>
                
              </div>

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

      {/* Watch Movie Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-white">
        <h2 className="text-3xl font-bold mb-6">About This Movie</h2>
        <p className="text-gray-300 mb-6">
          Experience this cinematic masterpiece in full HD quality. Click the &quot;Watch Full Movie&quot; button above to start streaming instantly.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">High Quality</h3>
            <p className="text-gray-300">Stream in crisp HD quality with optimal loading speeds.</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Instant Access</h3>
            <p className="text-gray-300">No downloads required. Watch immediately in your browser.</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Full Experience</h3>
            <p className="text-gray-300">Complete movie with original audio and subtitles.</p>
          </div>
        </div>
      </div>

      {/* Trailer Modal */}
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

      {/* Server Selection Modal */}
      <AnimatePresence>
        {showServerModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setShowServerModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative w-full max-w-md bg-gray-800 rounded-lg p-6"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-medium text-white mb-4 text-center">Select a video server</h3>
              <div className="flex flex-col gap-4">
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  onClick={() => { setSelectedServer('server1'); setShowServerModal(false); setShowMovie(true); }}
                >
                  Server 1 (player.phimapi.com)
                </button>
                <button
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors relative flex flex-col items-center"
                  onClick={() => { setSelectedServer('server2'); setShowServerModal(false); setShowMovie(true); }}
                >
                  Server 2 (vidsrc.icu)
                  <span className="mt-2 flex items-center gap-1 text-yellow-900 bg-yellow-200 rounded px-2 py-1 text-xs font-semibold">
                    <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Note: This server has many ads, please close ads to watch the movie.
                  </span>
                </button>
                <button
                  className="mt-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  onClick={() => setShowServerModal(false)}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Movie Player Modal */}
      <AnimatePresence>
        {showMovie && movie && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-50 flex items-center justify-center"
            onClick={() => { setShowMovie(false); setSelectedServer(null); }}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative w-full h-full max-w-7xl max-h-screen p-4"
              onClick={e => e.stopPropagation()}
            >
              {/* Header with close button */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white text-xl font-semibold">{title}</h3>
                <button
                  className="text-white bg-black/50 rounded-full p-2 hover:bg-black/80 transition-colors"
                  onClick={() => { setShowMovie(false); setSelectedServer(null); }}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {/* Video Player */}
              <div className="w-full h-[calc(100%-4rem)] rounded-lg overflow-hidden">
                {selectedServer === 'server1' && (
                  movieLinksLoading ? (
                    <div className="flex items-center justify-center h-full text-white text-lg font-semibold">
                      Loading video link...
                    </div>
                  ) : movieLinks.m3u8 ? (
                    <MoviePlayer
                      src={movieLinks.m3u8}
                      poster={poster}
                    />
                  ) : (
                    // Không hiển thị gì nếu không có link, không show thông báo lỗi
                    null
                  )
                )}
                {selectedServer === 'server2' && (
                  <>
                    <iframe
                      src={`https://vidsrc.icu/embed/movie/${id}?ds_lang=vi`}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={title + ' - Server 2'}
                    />
                  </>
                )}
                {!selectedServer && (
                  <div className="flex items-center justify-center h-full text-white">Please select a server to watch the movie.</div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scenes Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold text-white mb-8">Movie Scenes</h2>
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

      {/* Scene Preview Modal */}
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

function MoviePoster3D({ posterUrl }: { posterUrl: string }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const texture = new THREE.TextureLoader().load(posterUrl)

  useEffect(() => {
    let frameId: number;
    const start = Date.now();
    const maxY = 0.35; // ~20 độ, đổi thành Math.PI/2 * 0.98 nếu muốn gần 89 độ
    const maxX = 0.1;  // lắc lên xuống nhẹ, có thể để 0 nếu chỉ muốn lắc trái phải

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