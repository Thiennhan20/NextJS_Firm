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
import MoviePlayer from '@/components/common/MoviePlayer';
import { setupAudioNodes, cleanupAudioNodes, AudioNodes } from '@/lib/audioUtils';

// Định nghĩa kiểu Movie rõ ràng
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
  status?: 'Full HD' | 'Full HD/CAM' | 'Coming Soon' | 'Non';
}

interface PhimApiEpisode {
  server_name?: string;
  server_data?: Array<{
    name?: string;
    slug?: string;
    link_embed?: string;
  }>;
}

interface PhimApiMovie {
  name?: string;
  title?: string;
  slug?: string;
  origin_name?: string;
  year?: string | number;
  tmdb?: {
    id?: string | number;
  };
  link_embed?: string;
  episodes?: PhimApiEpisode[];
}



export default function MovieDetail() {
  const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
  const { id } = useParams();
  const [movie, setMovie] = useState<Movie | null>(null);
  
  // Hàm tạo status cho phim dựa trên ngày phát hành
  const generateMovieStatus = (releaseDate?: string): 'Full HD' | 'Full HD/CAM' | 'Coming Soon' | 'Non' => {
    if (!releaseDate) return 'Coming Soon';
    
    const releaseDateObj = new Date(releaseDate);
    const currentDate = new Date();
    const releaseYear = releaseDateObj.getFullYear();
    
    // Trường hợp Non: phim từ 1990 trở về quá khứ
    if (releaseYear < 1990) return 'Non';
    
    // Tính khoảng cách thời gian giữa ngày hiện tại và ngày phát hành (tính bằng tuần)
    const timeDiffInMs = currentDate.getTime() - releaseDateObj.getTime();
    const timeDiffInWeeks = timeDiffInMs / (1000 * 60 * 60 * 24 * 7);
    
    // Trường hợp Coming Soon: phim chưa phát hành (trước thời điểm hiện tại)
    if (timeDiffInWeeks < 0) return 'Coming Soon';
    
    // Trường hợp Full HD/CAM: phim mới xuất hiện dưới 2 tuần
    if (timeDiffInWeeks < 2) return 'Full HD/CAM';
    
    // Trường hợp Full HD: phim đã xuất hiện hơn 2 tuần
    return 'Full HD';
  };
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
    if (!isAuthenticated) {
      toast.error('You need to log in to save movies!');
      return;
    }
    try {
      if (isBookmarked) {
        await api.delete('/auth/watchlist', {
          data: { id: movie.id },
        });
        removeFromWatchlist(movie.id);
        toast.success('Removed movie from watchlist!');
        if (token) await fetchWatchlistFromServer(token);
      } else {
        await api.post('/auth/watchlist', {
          id: movie.id,
          title: movie.title,
          poster_path: movie.poster,
        });
        addToWatchlist({
          id: movie.id,
          title: movie.title,
          poster_path: movie.poster,
        });
        toast.success('Added movie to watchlist!');
        if (token) await fetchWatchlistFromServer(token);
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'An error occurred');
      } else {
        toast.error('An error occurred');
      }
    }
  };

  const [showServerModal, setShowServerModal] = useState(false);
  const [selectedServer, setSelectedServer] = useState<string | null>(null);

  const handleWatchMovie = async () => {
    if (!movie) return;
    setShowServerModal(true);
  };

  const y = useTransform(scrollYProgress, [0, 1], [0, -100])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  const [movieLinks, setMovieLinks] = useState({
    embed: '',
    m3u8: '',
    vietsub: '',
    dubbed: '', // Gộp thuyết minh và lồng tiếng
  });
  const [movieLinksLoading, setMovieLinksLoading] = useState(false);
  const [apiSearchCompleted, setApiSearchCompleted] = useState(false);
  const [selectedAudio, setSelectedAudio] = useState<'vietsub' | 'dubbed' | null>(null);
  
  // State cho server 2
  const [server2Link, setServer2Link] = useState('');
  const [server2Status, setServer2Status] = useState<'checking' | 'available' | 'unavailable'>('checking');

  // Check server 2 availability
  useEffect(() => {
    if (typeof id === 'string' && id) {
      const server2Url = `https://vidsrc.me/embed/movie?tmdb=${id}&ds_lang=vi&sub_url=https%3A%2F%2Fvidsrc.me%2Fsample.srt&autoplay=1`;
      setServer2Link(server2Url);
      setServer2Status('checking');
      
      // Simulate checking server 2 availability
      const checkServer2 = async () => {
        try {
          await new Promise(resolve => setTimeout(resolve, 1000));
          setServer2Status('available');
        } catch {
          setServer2Status('unavailable');
        }
      };
      
      checkServer2();
    }
  }, [id, movie?.title, movie?.year]);

  useEffect(() => {
    if (movie?.title && movie?.year) {
      setMovieLinksLoading(true);
      fetch(`/api/subtitles?query=${encodeURIComponent(movie.title)}&year=${movie.year.toString()}`)
        .then(res => res.json())
        .then(() => {})
        .catch(() => {})
        .finally(() => setMovieLinksLoading(false));
    }
  }, [movie?.title, movie?.year]);

  const videoRef = useRef<HTMLVideoElement>(null);
  // State cho các bộ lọc âm thanh (không hiển thị trong UI)
  const audioNodesRef = useRef<AudioNodes | null>(null);

  // Khởi tạo AudioContext và các bộ lọc
  useEffect(() => {
    if (!showMovie || !videoRef.current) return;
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
  }, [showMovie]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as { isWatchingFullMovie?: boolean }).isWatchingFullMovie = showMovie;
    }
  }, [showMovie]);

  // Replace the existing fetchPhimApiEmbed function in your useEffect with this improved version

useEffect(() => {
  let timeoutId: NodeJS.Timeout;
  
  async function fetchPhimApiEmbed() {
    if (movieLinks.m3u8) return;
    
    setMovieLinksLoading(true);
    setApiSearchCompleted(false);
    timeoutId = setTimeout(() => {
      // Timeout reached
    }, 60000);

    try {
      if (typeof id !== 'string') {
        return;
      }

      let slug = null;

      if (movie?.title) {
        // Strategy 1: Search by exact title with year
        const searchResults1 = await searchPhimApi(movie.title, movie.year as number);
        const match1 = findBestMatch(searchResults1, movie.title, movie.year as number, id);
        if (match1) {
          slug = match1.slug;
        }

        // Strategy 2: Search by exact title without year
        if (!slug) {
          const searchResults2 = await searchPhimApi(movie.title);
                  const match2 = findBestMatch(searchResults2, movie.title, movie.year as number, id);
        if (match2) {
          slug = match2.slug;
        }
        }

        // Strategy 3: Search by title with special characters removed
        if (!slug) {
          const normalizedTitle = normalizeTitle(movie.title);
          const searchResults3 = await searchPhimApi(normalizedTitle, movie.year as number);
          const match3 = findBestMatch(searchResults3, movie.title, movie.year as number, id);
          if (match3) {
            slug = match3.slug;
          }
        }

        // Strategy 4: Search by keywords from title
        if (!slug) {
          const keywords = extractKeywords(movie.title);
          for (const keyword of keywords) {
            const searchResults4 = await searchPhimApi(keyword, movie.year as number);
            const match4 = findBestMatch(searchResults4, movie.title, movie.year as number, id);
            if (match4) {
              slug = match4.slug;
              break;
            }
          }
        }

        // Strategy 5: Search by year range (±1 year)
        if (!slug && movie.year) {
          const years = [movie.year - 1, movie.year + 1];
          for (const yearVariant of years) {
            const searchResults5 = await searchPhimApi(movie.title, yearVariant);
            const match5 = findBestMatch(searchResults5, movie.title, movie.year as number, id);
            if (match5) {
              slug = match5.slug;
              break;
            }
          }
        }

        // Strategy 6: Search by origin_name field (for movies with English titles)
        if (!slug) {
          const englishTitleVariations = [
            movie.title,
            movie.title.replace(/[^\w\s]/g, ''),
            movie.title.toLowerCase(),
            movie.title.split(' ').slice(0, 3).join(' ')
          ];
          
          for (const variation of englishTitleVariations) {
            const searchResults6 = await searchPhimApi(variation, movie.year as number);
            const match6 = findBestMatch(searchResults6, movie.title, movie.year as number, id);
            if (match6) {
              slug = match6.slug;
              break;
            }
          }
        }
      }

      if (!slug) {
        return;
      }

      // Get movie details and extract embed link
      const detailRes = await fetch(`https://phimapi.com/phim/${slug}`);
      const detailData = await detailRes.json();

      let vietsubLink = '';
      let dubbedLink = '';
      let defaultEmbed = '';

      // Extract links from episodes
      if (detailData.episodes && detailData.episodes.length > 0) {
        detailData.episodes.forEach((episode: PhimApiEpisode) => {
          const serverName = episode.server_name?.toLowerCase() || '';
          
          if (episode.server_data && episode.server_data.length > 0) {
            // Check server_name first to determine audio type
            const isVietsub = serverName.includes('vietsub');
            const isDubbed = serverName.includes('thuyết minh') || serverName.includes('lồng tiếng') || serverName.includes('dubbed');
            
            // If server_name matches, take the first available link from server_data
            if ((isVietsub || isDubbed) && episode.server_data[0]?.link_embed) {
              const linkEmbed = episode.server_data[0].link_embed;
              
              if (isVietsub && !vietsubLink) {
                vietsubLink = linkEmbed;
              } else if (isDubbed && !dubbedLink) {
                dubbedLink = linkEmbed;
              }
            }
          }
        });
      }

      // Try to get embed from direct link as fallback
      if (detailData.link_embed) {
        defaultEmbed = detailData.link_embed;
      } 
      // Try to get embed from first episode as fallback
      else if (detailData.episodes && detailData.episodes[0]?.server_data) {
        const firstEpisode = detailData.episodes[0];
        let foundFallback = false;
        
        for (const serverData of firstEpisode.server_data) {
          const dataName = serverData.name?.toLowerCase() || '';
          const dataSlug = serverData.slug?.toLowerCase() || '';
          
          if (serverData.link_embed && (
            dataName.includes('full') || dataName.includes('vietsub') ||
            dataSlug.includes('full') || dataSlug.includes('vietsub')
          )) {
            defaultEmbed = serverData.link_embed;
            foundFallback = true;
            break;
          }
        }
        
        if (!foundFallback && firstEpisode.server_data[0]?.link_embed) {
          defaultEmbed = firstEpisode.server_data[0].link_embed;
        }
      }

      // Clean up URLs if they contain ?url= parameter
      const cleanUrl = (url: string) => {
        if (url && url.includes('?url=')) {
          return url.split('?url=')[1];
        }
        return url;
      };

      vietsubLink = cleanUrl(vietsubLink);
      dubbedLink = cleanUrl(dubbedLink);
      defaultEmbed = cleanUrl(defaultEmbed);

      // Set the appropriate link based on availability
      if (vietsubLink || dubbedLink) {
        const finalLink = vietsubLink || dubbedLink || defaultEmbed;
        setMovieLinks(links => ({ 
          ...links, 
          vietsub: vietsubLink,
          dubbed: dubbedLink,
          m3u8: finalLink
        }));
        setMovieLinksLoading(false);
        setApiSearchCompleted(true);
      } else if (defaultEmbed) {
        setMovieLinks(links => ({ ...links, m3u8: defaultEmbed }));
        setMovieLinksLoading(false);
        setApiSearchCompleted(true);
      }

    } catch {
      // Error occurred
    } finally {
      clearTimeout(timeoutId);
      setMovieLinksLoading(false);
      setApiSearchCompleted(true);
    }
  }

  // Helper function to search PhimAPI
  async function searchPhimApi(keyword: string, year?: number): Promise<PhimApiMovie[]> {
    try {
      let url = `https://phimapi.com/v1/api/tim-kiem?keyword=${encodeURIComponent(keyword)}`;
      if (year) url += `&year=${year}`;
      
      const res = await fetch(url);
      const data = await res.json();

      if (data.status === 'success' && data.data && Array.isArray(data.data.items)) {
        return data.data.items;
      }
      
      return [];
    } catch {
      return [];
    }
  }

  // Helper function to find best matching movie
  function findBestMatch(items: PhimApiMovie[], targetTitle: string, targetYear: number, tmdbId: string): PhimApiMovie | null {
    if (!items || items.length === 0) return null;

    // Priority 1: Exact TMDB ID match
    const tmdbMatch = items.find(item => 
      item.tmdb && item.tmdb.id && item.tmdb.id.toString() === tmdbId.toString()
    );
    if (tmdbMatch) {
      return tmdbMatch;
    }

    // Priority 2: Exact title and year match
    const exactMatch = items.find(item => {
      const titleMatch = normalizeTitle(item.name || item.title || '') === normalizeTitle(targetTitle);
      const yearMatch = item.year && parseInt(String(item.year)) === targetYear;
      return titleMatch && yearMatch;
    });
    if (exactMatch) {
      return exactMatch;
    }

    // Priority 3: Origin name match (similar to slug matching)
    const originNameMatch = items.find(item => {
      if (!item.origin_name) return false;
      const originNameNormalized = normalizeTitle(item.origin_name);
      const targetNormalized = normalizeTitle(targetTitle);
      const similarity = calculateSimilarity(originNameNormalized, targetNormalized);
      const yearDiff = Math.abs(parseInt(String(item.year || '0')) - targetYear);
      return similarity > 0.7 && yearDiff <= 2;
    });
    if (originNameMatch) {
      return originNameMatch;
    }

    // Priority 4: Title match with year tolerance
    const titleMatchWithYearTolerance = items.find(item => {
      const titleMatch = normalizeTitle(item.name || item.title || '') === normalizeTitle(targetTitle);
      const yearDiff = Math.abs(parseInt(String(item.year || '0')) - targetYear);
      return titleMatch && yearDiff <= 1;
    });
    if (titleMatchWithYearTolerance) {
      return titleMatchWithYearTolerance;
    }

    // Priority 5: Fuzzy title match
    const fuzzyMatch = items.find(item => {
      const itemTitle = normalizeTitle(item.name || item.title || '');
      const targetNormalized = normalizeTitle(targetTitle);
      const similarity = calculateSimilarity(itemTitle, targetNormalized);
      const yearDiff = Math.abs(parseInt(String(item.year || '0')) - targetYear);
      return similarity > 0.8 && yearDiff <= 2;
    });
    if (fuzzyMatch) {
      return fuzzyMatch;
    }

    return null;
  }

  // Helper function to normalize title for comparison
  function normalizeTitle(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ')    // Replace multiple spaces with single space
      .trim();
  }

  // Helper function to extract keywords from title
  function extractKeywords(title: string): string[] {
    const normalized = normalizeTitle(title);
    const words = normalized.split(' ').filter(word => word.length > 2);
    
    // Return combinations: full title, major words, individual significant words
    const keywords = [
      title, // Original title
      normalized, // Normalized title
      ...words.filter(word => word.length > 3) // Significant individual words
    ];

    return [...new Set(keywords)]; // Remove duplicates
  }

  // Helper function to calculate string similarity
  function calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  // Helper function to calculate Levenshtein distance
  function levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  fetchPhimApiEmbed();
}, [id, movie?.title, movie?.year, movieLinks.m3u8]);

  useEffect(() => {
    const fetchMovie = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `https://api.themoviedb.org/3/movie/${id}?api_key=${API_KEY}`
        );
        const data = response.data;
        let scenes: string[] = [];
        try {
          const imgRes = await axios.get(
            `https://api.themoviedb.org/3/movie/${id}/images?api_key=${API_KEY}`
          );
          const backdrops: { file_path: string }[] = imgRes.data.backdrops || [];
          scenes = backdrops.slice(0, 3).map((img) => `https://image.tmdb.org/t/p/w780${img.file_path}`);
        } catch {}
        if (scenes.length < 3) {
          if (data.backdrop_path) scenes.push(`https://image.tmdb.org/t/p/w780${data.backdrop_path}`);
          if (data.poster_path) scenes.push(`https://image.tmdb.org/t/p/w500${data.poster_path}`);
        }
        scenes = scenes.slice(0, 3);
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
        
        // Fetch credits for director and cast
        const creditsResponse = await axios.get(
          `https://api.themoviedb.org/3/movie/${id}/credits?api_key=${API_KEY}`
        );
        const credits = creditsResponse.data;
        
        const movieData = {
          id: data.id,
          title: data.title,

          duration: data.runtime ? `${Math.floor(data.runtime / 60)}h ${data.runtime % 60}m` : '',
          year: data.release_date ? Number(data.release_date.slice(0, 4)) : '' as number | '',
          releaseDate: data.release_date || '',
          director: credits.crew?.find((person: { job: string; name: string }) => person.job === 'Director')?.name || '',
          cast: credits.cast?.slice(0, 10).map((person: { name: string }) => person.name) || [],
          genre: data.genres ? data.genres.map((g: { name: string }) => g.name).join(', ') : '',
          description: data.overview,
          poster: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : '',
          backdrop: data.backdrop_path ? `https://image.tmdb.org/t/p/original${data.backdrop_path}` : '',
          trailer,
          movieUrl: '',
          scenes,
          status: generateMovieStatus(data.release_date),
        };
        setMovie(movieData);
      } catch {
        setMovie(null);
      }
      setLoading(false);
    };
    fetchMovie();
  }, [id, API_KEY]);

  // Helper to format date as dd/mm/yyyy (Vietnam locale)
  const formatDate = (dateStr?: string) => {
    try {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return dateStr || '';
    }
  };

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

  const { title, backdrop, poster, duration, year, genre, director, cast, description, scenes, trailer, status, releaseDate } = movie;

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      <div className="relative w-full overflow-hidden py-16 lg:py-0 min-h-screen flex items-center">
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
                <MoviePoster3D posterUrl={`/api/cache-image?id=${id}&url=${encodeURIComponent(poster ?? '')}&bust=${Date.now()}`} />
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
          
          <div className="text-white space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight"
              >
                {title}
              </motion.h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {status && (
                  <span className={`px-2 py-1 text-xs sm:text-sm font-bold rounded-md whitespace-nowrap ${
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
            </div>
            
            <div className="flex flex-wrap gap-4">
              
              <div className="flex items-center space-x-2">
                <ClockIcon className="h-6 w-6 text-gray-400" />
                <span className="text-gray-400">{duration}</span>
              </div>
              <div className="flex items-center space-x-2">
                <CalendarIcon className="h-6 w-6 text-gray-400" />
                <span className="text-gray-400">{releaseDate ? formatDate(releaseDate) : year}</span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-gray-300">{genre}</p>
              {director && (
                <p className="text-gray-300">Director: {director}</p>
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
                  onClick={() => { 
                    setSelectedServer('server1'); 
                    setShowServerModal(false); 
                    setShowMovie(true);
                  }}
                >
                  Server 1
                </button>
                <button
                  className={`px-4 py-2 rounded-lg transition-colors relative flex flex-col items-center ${
                    server2Status === 'checking' 
                      ? 'bg-gray-600 text-gray-300 cursor-not-allowed' 
                      : server2Status === 'available'
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-red-600 text-white cursor-not-allowed'
                  }`}
                  onClick={() => { 
                    if (server2Status === 'available') {
                      setSelectedServer('server2'); 
                      setShowServerModal(false); 
                      setShowMovie(true); 
                    }
                  }}
                  disabled={server2Status !== 'available'}
                >
                  <div className="flex items-center gap-2">
                    {server2Status === 'checking' && (
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full"
                      />
                    )}
                    Server 2
                    {server2Status === 'checking' && <span className="text-xs">(Checking...)</span>}
                    {server2Status === 'unavailable' && <span className="text-xs">(Unavailable)</span>}
                  </div>
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



      <AnimatePresence>
        {showMovie && movie && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-50 flex items-center justify-center"
            onClick={() => { setShowMovie(false); setSelectedServer(null); setSelectedAudio(null); }}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative w-full h-full max-w-7xl max-h-screen p-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-white text-xl font-semibold">{title}</h3>
                  {selectedAudio && (
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${
                      selectedAudio === 'vietsub' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-green-600 text-white'
                    }`}>
                      {selectedAudio === 'vietsub' ? 'Vietsub' : 'Vietnamese Dubbed'}
                    </span>
                  )}
                  {selectedAudio && (
                    <button
                      className="text-white bg-gray-600 rounded-full p-1 hover:bg-gray-700 transition-colors"
                      onClick={() => setSelectedAudio(null)}
                      title="Change audio version"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  )}
                </div>
                <button
                  className="text-white bg-black/50 rounded-full p-2 hover:bg-black/80 transition-colors"
                  onClick={() => { setShowMovie(false); setSelectedServer(null); setSelectedAudio(null); }}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="w-full h-[calc(100%-4rem)] rounded-lg overflow-hidden">
                {selectedServer === 'server1' && (
                  (() => {
                    // Show loading if API search is still in progress
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

                    // Check if we have any video source available
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

                    // If we have multiple audio options, show audio selection
                    if (movieLinks.vietsub && movieLinks.dubbed && !selectedAudio) {
                      return (
                        <div className="flex items-center justify-center h-full text-white">
                          <div className="flex flex-col items-center gap-6 max-w-md">
                            <h3 className="text-xl font-semibold">Select Audio Version</h3>
                            <div className="flex flex-col gap-4 w-full">
                              <button
                                className="px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-3"
                                onClick={() => setSelectedAudio('vietsub')}
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                </svg>
                                Vietsub (Vietnamese Subtitles)
                              </button>
                              <button
                                className="px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-3"
                                onClick={() => setSelectedAudio('dubbed')}
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                                Vietnamese Dubbed (Dubbed/Narrated)
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // Determine which link to use based on selected audio or availability
                    let videoSrc = '';
                    if (selectedAudio === 'vietsub' && movieLinks.vietsub) {
                      videoSrc = movieLinks.vietsub;
                    } else if (selectedAudio === 'dubbed' && movieLinks.dubbed) {
                      videoSrc = movieLinks.dubbed;
                    } else if (movieLinks.vietsub) {
                      videoSrc = movieLinks.vietsub; // Default to vietsub if available
                    } else if (movieLinks.dubbed) {
                      videoSrc = movieLinks.dubbed; // Fallback to dubbed
                    } else {
                      videoSrc = movieLinks.m3u8; // Fallback to original m3u8
                    }
                    
                    return videoSrc ? (
                      <MoviePlayer
                        ref={videoRef}
                        src={videoSrc}
                        poster={poster}
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
                    title={title + ' - Server 2'}
                    referrerPolicy="origin"
                  />
                )}
                {!selectedServer && (
                  <div className="flex items-center justify-center h-full text-white">Please select a server to watch the movie.</div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
