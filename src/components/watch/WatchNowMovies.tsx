'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import EnhancedMoviePlayer from '@/components/common/EnhancedMoviePlayer'
import useAuthStore from '@/store/useAuthStore'
import { setupAudioNodes, cleanupAudioNodes, AudioNodes } from '@/lib/audioUtils'

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

interface WatchNowMoviesProps {
  movie: Movie;
}

export default function WatchNowMovies({ movie }: WatchNowMoviesProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = useAuthStore((s) => (s.user as any)?.id || (s.user as any)?._id)
  const { id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [selectedServer, setSelectedServer] = useState<'server1' | 'server2'>('server1');
  const hasInitialized = useRef(false);
  
  // Read audio parameter from URL
  const audioFromUrl = searchParams.get('audio');

  // Cập nhật URL khi thay đổi server
  const updateServerInUrl = (server: 'server1' | 'server2') => {
    const params = new URLSearchParams(searchParams.toString());
    const currentServer = searchParams.get('server');
    
    // Chỉ cập nhật nếu server thực sự thay đổi
    if (currentServer !== server) {
      params.set('server', server);
      const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
      
      // Nếu đang từ server2 về server1, sử dụng replace để không tạo history entry mới
      if (currentServer === 'server2' && server === 'server1') {
        router.replace(newUrl, { scroll: false });
      } else {
        router.push(newUrl, { scroll: false });
      }
    }
  };

  // Cập nhật server và URL
  const handleServerChange = (server: 'server1' | 'server2') => {
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

  // Đọc server từ URL khi component mount hoặc URL thay đổi
  useEffect(() => {
    const serverFromUrl = searchParams.get('server');
    if (serverFromUrl === 'server1' || serverFromUrl === 'server2') {
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
    if (audioFromUrl === 'vietsub' && movieLinks.vietsub && selectedAudio !== 'vietsub') {
      setSelectedAudio('vietsub');
    } else if (audioFromUrl === 'dubbed' && movieLinks.dubbed && selectedAudio !== 'dubbed') {
      setSelectedAudio('dubbed');
    }
  }, [audioFromUrl, movieLinks.vietsub, movieLinks.dubbed, selectedAudio]);
  
  // State cho server 2
  const [server2Link, setServer2Link] = useState('');

  // Check server 2 availability
  useEffect(() => {
    if (typeof id === 'string' && id) {
      const server2Url = `https://vidsrc.me/embed/movie?tmdb=${id}&ds_lang=vi&sub_url=https%3A%2F%2Fvidsrc.me%2Fsample.srt&autoplay=1`;
      setServer2Link(server2Url);
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

  // Tự động chọn audio khi có sẵn, ưu tiên từ URL
  useEffect(() => {
    if (!selectedAudio) {
      // Nếu URL có tham số audio, ưu tiên sử dụng audio từ URL
      if (audioFromUrl === 'dubbed' && movieLinks.dubbed) {
        setSelectedAudio('dubbed');
        return;
      }
      if (audioFromUrl === 'vietsub' && movieLinks.vietsub) {
        setSelectedAudio('vietsub');
        return;
      }
      
      // Nếu không có audio từ URL hoặc audio từ URL không khả dụng, chọn mặc định
      // Nếu có cả hai, ưu tiên Vietsub
      if (movieLinks.vietsub && movieLinks.dubbed) {
        setSelectedAudio('vietsub');
        return;
      }
      // Nếu chỉ có một loại audio, tự động chọn
      if (movieLinks.vietsub) {
        setSelectedAudio('vietsub');
        return;
      }
      if (movieLinks.dubbed) {
        setSelectedAudio('dubbed');
        return;
      }
    }
  }, [movieLinks.vietsub, movieLinks.dubbed, selectedAudio, audioFromUrl]);

  // Audio hiệu lực để hiển thị ngoài player
  const effectiveAudio = useMemo<('vietsub' | 'dubbed' | null)>(() => {
    if (selectedAudio === 'vietsub' && movieLinks.vietsub) return 'vietsub';
    if (selectedAudio === 'dubbed' && movieLinks.dubbed) return 'dubbed';
    if (movieLinks.vietsub) return 'vietsub';
    if (movieLinks.dubbed) return 'dubbed';
    return null;
  }, [selectedAudio, movieLinks.vietsub, movieLinks.dubbed]);

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

  // Replace the existing fetchPhimApiEmbed function in your useEffect with this improved version
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    async function fetchPhimApiEmbed() {
      if (movieLinks.m3u8) {
        return;
      }
      
      setMovieLinksLoading(true);
      setApiSearchCompleted(false);
      timeoutId = setTimeout(() => {
        // Timeout handler
      }, 60000);

      try {
        if (typeof id !== 'string') {
          return;
        }

        let slug = null;

        // UNIFIED STRATEGY: Try TMDB direct API first, then search with all keywords in parallel
        
        // Step 1: Try TMDB ID direct API (HIGHEST PRIORITY)
        try {
          const tmdbDirectUrl = `https://phimapi.com/tmdb/movie/${id}`;
          const tmdbDirectRes = await fetch(tmdbDirectUrl);
          const tmdbDirectData = await tmdbDirectRes.json();
          
          if (tmdbDirectData?.status === true && tmdbDirectData?.movie?.slug) {
            slug = tmdbDirectData.movie.slug;
          }
        } catch {
          // TMDB direct API failed
        }

        // Step 2: If TMDB fails, search with ALL keywords in parallel
        if (!slug && movie?.title) {
          
          // Collect ALL keywords from all strategies
          const normalizedTitle = normalizeTitle(movie.title);
          const keywords = extractKeywords(movie.title);
          const titleVariations = [
            movie.title,
            movie.title.replace(/[^\w\s]/g, ''),
            movie.title.toLowerCase(),
            movie.title.split(' ').slice(0, 3).join(' ')
          ];
          
          // Combine all unique keywords
          const allKeywords = [
            movie.title,           // Original
            normalizedTitle,       // Normalized
            ...keywords,           // Keywords
            ...titleVariations     // Variations
          ].filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates
          
          // Search all keywords in parallel using Promise.race
          const searchPromises = allKeywords.map(async (keyword) => {
            const searchResults = await searchPhimApi(keyword, movie.year as number);
            if (searchResults.length > 0) {
              const match = findBestMatch(searchResults, movie.title, movie.year as number, id);
              if (match) {
                return { keyword, match };
              }
            }
            return null;
          });
          
          // Race all searches - first one to find a match wins
          const result = await Promise.race(
            searchPromises.map(async (promise, index) => {
              const res = await promise;
              return res ? { ...res, index } : null;
            })
          );
          
          if (result) {
            slug = result.match.slug;
          } else {
            // Wait for all to complete if race didn't find anything
            const allResults = await Promise.all(searchPromises);
            const firstMatch = allResults.find(r => r !== null);
            if (firstMatch) {
              slug = firstMatch.match.slug;
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
        // Error handling
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
      
      if (!items || items.length === 0) {
        return null;
      }

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, movie?.title, movie?.year]);

  return (
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
          {selectedServer === 'server1' && (
            (movieLinks.vietsub || movieLinks.dubbed) && (
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
            )
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
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="text-white text-xs sm:text-sm md:text-base font-semibold truncate" title={movie.title}>{movie.title}</h3>
          {selectedServer === 'server1' && effectiveAudio && (
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
      </div>
    </div>
  );
}
