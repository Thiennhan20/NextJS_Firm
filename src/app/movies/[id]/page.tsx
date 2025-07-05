'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import Image from 'next/image'
import { StarIcon, ClockIcon, CalendarIcon, PlayIcon } from '@heroicons/react/24/solid'
import { BookmarkIcon } from '@heroicons/react/24/outline'
import { useTemporaryWatchlistStore } from '@/store/store'
import toast from 'react-hot-toast'
import axios from 'axios'
import { useParams } from 'next/navigation'

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
  const [showSubtitleWarning, setShowSubtitleWarning] = useState<boolean>(false)
  const [subtitleStatus, setSubtitleStatus] = useState<'checking' | 'available' | 'unavailable' | 'error'>('checking')
  const [subtitleUrl, setSubtitleUrl] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  })

  const { addTemporarilyToWatchlist, removeTemporarilyFromWatchlist, isTemporarilyInWatchlist } = useTemporaryWatchlistStore();
  const isInTemporaryWatchlist = movie ? isTemporarilyInWatchlist(movie.id) : false;

  const handleToggleTemporaryWatchlist = () => {
    if (!movie) return;
    if (isInTemporaryWatchlist) {
      removeTemporarilyFromWatchlist(movie.id);
      toast.success('Đã xóa phim khỏi danh sách xem tạm thời!');
    } else {
      addTemporarilyToWatchlist({
        id: movie.id,
        title: movie.title,
        poster_path: movie.poster,
      });
      toast.success('Đã thêm phim vào danh sách xem tạm thời!');
    }
  };

  // Kiểm tra phụ đề tiếng Việt
  const checkVietnameseSubtitles = async (movieTitle: string, year: number | '') => {
    try {
      setSubtitleStatus('checking');
      setSubtitleUrl(null); // reset trước
      const response = await axios.get(`/api/subtitles?query=${encodeURIComponent(movieTitle)}&year=${year}`);
      if (response.data && response.data.data && response.data.data.length > 0) {
        setSubtitleStatus('available');
        // Lưu link file phụ đề đầu tiên (nếu có)
        const firstSubtitle = response.data.data[0];
        if (firstSubtitle && firstSubtitle.attributes && firstSubtitle.attributes.files && firstSubtitle.attributes.files.length > 0) {
          setSubtitleUrl(firstSubtitle.attributes.files[0].file_url);
        }
        return true;
      } else {
        setSubtitleStatus('unavailable');
        return false;
      }
    } catch (error) {
      console.error('Error checking subtitles:', error);
      setSubtitleStatus('error');
      setSubtitleUrl(null);
      return false;
    }
  };

  const handleWatchMovie = async () => {
    if (!movie) return;
    
    // Kiểm tra phụ đề trước khi mở player
    const hasVietnameseSubtitles = await checkVietnameseSubtitles(movie.title, movie.year);
    
    if (!hasVietnameseSubtitles) {
      setShowSubtitleWarning(true);
    } else {
      setShowMovie(true);
    }
  };

  const y = useTransform(scrollYProgress, [0, 1], [0, -100])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  const [subtitles, setSubtitles] = useState([]);
  const [subtitleLoading, setSubtitleLoading] = useState(false);

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
        
        // Tự động kiểm tra phụ đề sau khi load movie
        if (movieData.title && movieData.year) {
          checkVietnameseSubtitles(movieData.title, movieData.year);
        }
      } catch {
        setMovie(null);
      }
      setLoading(false);
    };
    fetchMovie();
  }, [id, API_KEY]);

  useEffect(() => {
    if (movie?.title && movie?.year) {
      setSubtitleLoading(true);
      fetch(`/api/subtitles?query=${encodeURIComponent(movie.title)}&year=${movie.year.toString()}`)
        .then(res => res.json())
        .then(data => {
          setSubtitles(data.data || []);
        })
        .catch(() => setSubtitles([]))
        .finally(() => setSubtitleLoading(false));
    }
  }, [movie?.title, movie?.year]);

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
                
                {/* Subtitle Status Indicator */}
                <div style={{
                  display: 'inline-block',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  backgroundColor: subtitleLoading ? '#f0f0f0' : subtitles.length > 0 ? '#e6ffed' : '#ffe6e6',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  color: subtitleLoading ? '#333' : subtitles.length > 0 ? '#28a745' : '#dc3545',
                }}>
                  {subtitleLoading ? (
                    <span>Đang kiểm tra phụ đề...</span>
                  ) : subtitles.length > 0 ? (
                    <span>✔ Có phụ đề Tiếng Việt</span>
                  ) : (
                    <span>✖ Không có phụ đề Tiếng Việt</span>
                  )}
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleToggleTemporaryWatchlist}
                className={`px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                  isInTemporaryWatchlist
                    ? 'bg-yellow-600 text-black hover:bg-yellow-700'
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
              >
                <BookmarkIcon className="h-5 w-5" />
                {isInTemporaryWatchlist ? 'Đã thêm vào danh sách tạm thời' : 'Lưu vào danh sách tạm thời'}
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

      {/* Subtitle Warning Modal */}
      <AnimatePresence>
        {showSubtitleWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setShowSubtitleWarning(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative w-full max-w-md bg-gray-800 rounded-lg p-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                  <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Thông báo về phụ đề</h3>
                <p className="text-gray-300 mb-6">
                  Phim này hiện chưa có phụ đề Tiếng Việt. Bạn có muốn tiếp tục xem phim không?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowSubtitleWarning(false);
                      setShowMovie(true);
                    }}
                    className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Vẫn xem
                  </button>
                  <button
                    onClick={() => setShowSubtitleWarning(false)}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Hủy
                  </button>
                </div>
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
            onClick={() => setShowMovie(false)}
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
                  onClick={() => setShowMovie(false)}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {/* Video Player */}
              {/*
                Chú ý: Nếu chỉ dùng link embed (iframe như vidsrc.icu),
                KHÔNG thể truyền phụ đề tự động vào player.
                Chỉ có thể truyền phụ đề nếu có link file video thực sự (.mp4, .mkv, ...)
              */}
              <div className="w-full h-[calc(100%-4rem)] rounded-lg overflow-hidden">
                <iframe
                  src={`https://vidsrc.icu/embed/movie/${id}?ds_lang=vi`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={title}
                />
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

      {/* Subtitle Download Link */}
      {subtitleStatus === 'available' && subtitleUrl && (
        <div className="fixed bottom-0 left-0 right-0 bg-black/50 p-4">
          <a
            href={subtitleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-400 underline"
          >
            Tải phụ đề tiếng Việt
          </a>
        </div>
      )}
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