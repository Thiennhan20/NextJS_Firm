'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import EnhancedMoviePlayer from '@/components/common/EnhancedMoviePlayer'
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
  const { id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [selectedServer, setSelectedServer] = useState<'server1' | 'server2'>('server1');
  const hasInitialized = useRef(false);

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

  // Mặc định chọn Vietsub khi có đủ 2 phiên bản và chưa chọn gì
  useEffect(() => {
    if (movieLinks.vietsub && movieLinks.dubbed && !selectedAudio) {
      setSelectedAudio('vietsub');
    }
  }, [movieLinks.vietsub, movieLinks.dubbed, selectedAudio]);

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
      console.log('🎬 [MOVIE DEBUG] Starting movie search process...');
      console.log('🎬 [MOVIE DEBUG] Movie data:', { title: movie?.title, year: movie?.year, id });
      
      if (movieLinks.m3u8) {
        console.log('🎬 [MOVIE DEBUG] Already have m3u8 link, skipping search');
        return;
      }
      
      setMovieLinksLoading(true);
      setApiSearchCompleted(false);
      timeoutId = setTimeout(() => {
        console.log('🎬 [MOVIE DEBUG] Search timeout reached (60s)');
      }, 60000);

      try {
        if (typeof id !== 'string') {
          console.log('🎬 [MOVIE DEBUG] Invalid ID type:', typeof id);
          return;
        }

        let slug = null;

        if (movie?.title) {
          console.log('🎬 [MOVIE DEBUG] Starting search strategies for:', movie.title);
          
          // Strategy 1: Search by exact title with year
          console.log('🎬 [MOVIE DEBUG] Strategy 1: Exact title with year');
          const searchResults1 = await searchPhimApi(movie.title, movie.year as number);
          console.log('🎬 [MOVIE DEBUG] Strategy 1 results:', searchResults1.length, 'items');
          const match1 = findBestMatch(searchResults1, movie.title, movie.year as number, id);
          if (match1) {
            slug = match1.slug;
            console.log('🎬 [MOVIE DEBUG] Strategy 1 SUCCESS:', match1.name, '->', match1.slug);
          } else {
            console.log('🎬 [MOVIE DEBUG] Strategy 1 failed');
          }

          // Strategy 2: Search by exact title without year
          if (!slug) {
            console.log('🎬 [MOVIE DEBUG] Strategy 2: Exact title without year');
            const searchResults2 = await searchPhimApi(movie.title);
            console.log('🎬 [MOVIE DEBUG] Strategy 2 results:', searchResults2.length, 'items');
            const match2 = findBestMatch(searchResults2, movie.title, movie.year as number, id);
            if (match2) {
              slug = match2.slug;
              console.log('🎬 [MOVIE DEBUG] Strategy 2 SUCCESS:', match2.name, '->', match2.slug);
            } else {
              console.log('🎬 [MOVIE DEBUG] Strategy 2 failed');
            }
          }

          // Strategy 3: Search by title with special characters removed
          if (!slug) {
            console.log('🎬 [MOVIE DEBUG] Strategy 3: Normalized title');
            const normalizedTitle = normalizeTitle(movie.title);
            console.log('🎬 [MOVIE DEBUG] Normalized title:', normalizedTitle);
            const searchResults3 = await searchPhimApi(normalizedTitle, movie.year as number);
            console.log('🎬 [MOVIE DEBUG] Strategy 3 results:', searchResults3.length, 'items');
            const match3 = findBestMatch(searchResults3, movie.title, movie.year as number, id);
            if (match3) {
              slug = match3.slug;
              console.log('🎬 [MOVIE DEBUG] Strategy 3 SUCCESS:', match3.name, '->', match3.slug);
            } else {
              console.log('🎬 [MOVIE DEBUG] Strategy 3 failed');
            }
          }

          // Strategy 4: Search by keywords from title
          if (!slug) {
            console.log('🎬 [MOVIE DEBUG] Strategy 4: Keywords search');
            const keywords = extractKeywords(movie.title);
            console.log('🎬 [MOVIE DEBUG] Extracted keywords:', keywords);
            for (const keyword of keywords) {
              console.log('🎬 [MOVIE DEBUG] Searching keyword:', keyword);
              const searchResults4 = await searchPhimApi(keyword, movie.year as number);
              console.log('🎬 [MOVIE DEBUG] Keyword results:', searchResults4.length, 'items');
              const match4 = findBestMatch(searchResults4, movie.title, movie.year as number, id);
              if (match4) {
                slug = match4.slug;
                console.log('🎬 [MOVIE DEBUG] Strategy 4 SUCCESS:', match4.name, '->', match4.slug);
                break;
              }
            }
            if (!slug) {
              console.log('🎬 [MOVIE DEBUG] Strategy 4 failed');
            }
          }

          // Strategy 5: Search by year range (±1 year)
          if (!slug && movie.year) {
            console.log('🎬 [MOVIE DEBUG] Strategy 5: Year range search');
            const years = [movie.year - 1, movie.year + 1];
            console.log('🎬 [MOVIE DEBUG] Year range:', years);
            for (const yearVariant of years) {
              console.log('🎬 [MOVIE DEBUG] Searching year:', yearVariant);
              const searchResults5 = await searchPhimApi(movie.title, yearVariant);
              console.log('🎬 [MOVIE DEBUG] Year results:', searchResults5.length, 'items');
              const match5 = findBestMatch(searchResults5, movie.title, movie.year as number, id);
              if (match5) {
                slug = match5.slug;
                console.log('🎬 [MOVIE DEBUG] Strategy 5 SUCCESS:', match5.name, '->', match5.slug);
                break;
              }
            }
            if (!slug) {
              console.log('🎬 [MOVIE DEBUG] Strategy 5 failed');
            }
          }

          // Strategy 6: Search by origin_name field (for movies with English titles)
          if (!slug) {
            console.log('🎬 [MOVIE DEBUG] Strategy 6: English title variations');
            const englishTitleVariations = [
              movie.title,
              movie.title.replace(/[^\w\s]/g, ''),
              movie.title.toLowerCase(),
              movie.title.split(' ').slice(0, 3).join(' ')
            ];
            console.log('🎬 [MOVIE DEBUG] English variations:', englishTitleVariations);
            
            for (const variation of englishTitleVariations) {
              console.log('🎬 [MOVIE DEBUG] Searching variation:', variation);
              const searchResults6 = await searchPhimApi(variation, movie.year as number);
              console.log('🎬 [MOVIE DEBUG] Variation results:', searchResults6.length, 'items');
              const match6 = findBestMatch(searchResults6, movie.title, movie.year as number, id);
              if (match6) {
                slug = match6.slug;
                console.log('🎬 [MOVIE DEBUG] Strategy 6 SUCCESS:', match6.name, '->', match6.slug);
                break;
              }
            }
            if (!slug) {
              console.log('🎬 [MOVIE DEBUG] Strategy 6 failed');
            }
          }
        }

        if (!slug) {
          console.log('🎬 [MOVIE DEBUG] No slug found after all strategies');
          return;
        }

        console.log('🎬 [MOVIE DEBUG] Final slug found:', slug);
        console.log('🎬 [MOVIE DEBUG] Fetching movie details...');

        // Get movie details and extract embed link
        const detailRes = await fetch(`https://phimapi.com/phim/${slug}`);
        const detailData = await detailRes.json();
        console.log('🎬 [MOVIE DEBUG] Movie details response:', {
          name: detailData.name,
          episodes: detailData.episodes?.length || 0,
          link_embed: !!detailData.link_embed
        });

        let vietsubLink = '';
        let dubbedLink = '';
        let defaultEmbed = '';

        // Extract links from episodes
        if (detailData.episodes && detailData.episodes.length > 0) {
          console.log('🎬 [MOVIE DEBUG] Processing episodes:', detailData.episodes.length);
          detailData.episodes.forEach((episode: PhimApiEpisode, index: number) => {
            const serverName = episode.server_name?.toLowerCase() || '';
            console.log(`🎬 [MOVIE DEBUG] Episode ${index + 1}:`, {
              server_name: episode.server_name,
              server_data_count: episode.server_data?.length || 0
            });
            
            if (episode.server_data && episode.server_data.length > 0) {
              // Check server_name first to determine audio type
              const isVietsub = serverName.includes('vietsub');
              const isDubbed = serverName.includes('thuyết minh') || serverName.includes('lồng tiếng') || serverName.includes('dubbed');
              console.log(`🎬 [MOVIE DEBUG] Episode ${index + 1} audio type:`, { isVietsub, isDubbed });
              
              // If server_name matches, take the first available link from server_data
              if ((isVietsub || isDubbed) && episode.server_data[0]?.link_embed) {
                const linkEmbed = episode.server_data[0].link_embed;
                console.log(`🎬 [MOVIE DEBUG] Episode ${index + 1} link found:`, linkEmbed);
                
                if (isVietsub && !vietsubLink) {
                  vietsubLink = linkEmbed;
                  console.log('🎬 [MOVIE DEBUG] Vietsub link set:', vietsubLink);
                } else if (isDubbed && !dubbedLink) {
                  dubbedLink = linkEmbed;
                  console.log('🎬 [MOVIE DEBUG] Dubbed link set:', dubbedLink);
                }
              }
            }
          });
        }

        // Try to get embed from direct link as fallback
        if (detailData.link_embed) {
          defaultEmbed = detailData.link_embed;
          console.log('🎬 [MOVIE DEBUG] Direct embed link found:', defaultEmbed);
        } 
        // Try to get embed from first episode as fallback
        else if (detailData.episodes && detailData.episodes[0]?.server_data) {
          console.log('🎬 [MOVIE DEBUG] Using first episode as fallback');
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
              console.log('🎬 [MOVIE DEBUG] Fallback link found:', defaultEmbed);
              break;
            }
          }
          
          if (!foundFallback && firstEpisode.server_data[0]?.link_embed) {
            defaultEmbed = firstEpisode.server_data[0].link_embed;
            console.log('🎬 [MOVIE DEBUG] Using first server data link:', defaultEmbed);
          }
        }

        // Clean up URLs if they contain ?url= parameter
        const cleanUrl = (url: string) => {
          if (url && url.includes('?url=')) {
            const cleaned = url.split('?url=')[1];
            console.log('🎬 [MOVIE DEBUG] Cleaned URL:', url, '->', cleaned);
            return cleaned;
          }
          return url;
        };

        console.log('🎬 [MOVIE DEBUG] Before cleaning:', { vietsubLink, dubbedLink, defaultEmbed });
        vietsubLink = cleanUrl(vietsubLink);
        dubbedLink = cleanUrl(dubbedLink);
        defaultEmbed = cleanUrl(defaultEmbed);
        console.log('🎬 [MOVIE DEBUG] After cleaning:', { vietsubLink, dubbedLink, defaultEmbed });

        // Set the appropriate link based on availability
        if (vietsubLink || dubbedLink) {
          const finalLink = vietsubLink || dubbedLink || defaultEmbed;
          console.log('🎬 [MOVIE DEBUG] Setting links with audio options:', {
            vietsub: vietsubLink,
            dubbed: dubbedLink,
            final: finalLink
          });
          setMovieLinks(links => ({ 
            ...links, 
            vietsub: vietsubLink,
            dubbed: dubbedLink,
            m3u8: finalLink
          }));
          setMovieLinksLoading(false);
          setApiSearchCompleted(true);
        } else if (defaultEmbed) {
          console.log('🎬 [MOVIE DEBUG] Setting default embed link:', defaultEmbed);
          setMovieLinks(links => ({ ...links, m3u8: defaultEmbed }));
          setMovieLinksLoading(false);
          setApiSearchCompleted(true);
        } else {
          console.log('🎬 [MOVIE DEBUG] No video links found');
        }

      } catch (error) {
        console.log('🎬 [MOVIE DEBUG] Error occurred:', error);
      } finally {
        clearTimeout(timeoutId);
        setMovieLinksLoading(false);
        setApiSearchCompleted(true);
        console.log('🎬 [MOVIE DEBUG] Search process completed');
      }
    }

    // Helper function to search PhimAPI
    async function searchPhimApi(keyword: string, year?: number): Promise<PhimApiMovie[]> {
      try {
        let url = `https://phimapi.com/v1/api/tim-kiem?keyword=${encodeURIComponent(keyword)}`;
        if (year) url += `&year=${year}`;
        
        console.log('🎬 [MOVIE DEBUG] API Request:', { keyword, year, url });
        const res = await fetch(url);
        const data = await res.json();
        console.log('🎬 [MOVIE DEBUG] API Response:', { 
          status: data.status, 
          itemsCount: data.data?.items?.length || 0,
          firstItem: data.data?.items?.[0]?.name || 'none'
        });

        if (data.status === 'success' && data.data && Array.isArray(data.data.items)) {
          return data.data.items;
        }
        
        return [];
      } catch (error) {
        console.log('🎬 [MOVIE DEBUG] API Error:', error);
        return [];
      }
    }

    // Helper function to find best matching movie
    function findBestMatch(items: PhimApiMovie[], targetTitle: string, targetYear: number, tmdbId: string): PhimApiMovie | null {
      console.log('🎬 [MOVIE DEBUG] findBestMatch called:', { 
        itemsCount: items?.length || 0, 
        targetTitle, 
        targetYear, 
        tmdbId 
      });
      
      if (!items || items.length === 0) {
        console.log('🎬 [MOVIE DEBUG] No items to match');
        return null;
      }

      // Priority 1: Exact TMDB ID match
      console.log('🎬 [MOVIE DEBUG] Priority 1: TMDB ID match');
      const tmdbMatch = items.find(item => 
        item.tmdb && item.tmdb.id && item.tmdb.id.toString() === tmdbId.toString()
      );
      if (tmdbMatch) {
        console.log('🎬 [MOVIE DEBUG] TMDB match found:', tmdbMatch.name);
        return tmdbMatch;
      }

      // Priority 2: Exact title and year match
      console.log('🎬 [MOVIE DEBUG] Priority 2: Exact title and year match');
      const exactMatch = items.find(item => {
        const titleMatch = normalizeTitle(item.name || item.title || '') === normalizeTitle(targetTitle);
        const yearMatch = item.year && parseInt(String(item.year)) === targetYear;
        console.log('🎬 [MOVIE DEBUG] Checking item:', {
          name: item.name,
          title: item.title,
          year: item.year,
          titleMatch,
          yearMatch
        });
        return titleMatch && yearMatch;
      });
      if (exactMatch) {
        console.log('🎬 [MOVIE DEBUG] Exact match found:', exactMatch.name);
        return exactMatch;
      }

      // Priority 3: Origin name match (similar to slug matching)
      console.log('🎬 [MOVIE DEBUG] Priority 3: Origin name match');
      const originNameMatch = items.find(item => {
        if (!item.origin_name) return false;
        const originNameNormalized = normalizeTitle(item.origin_name);
        const targetNormalized = normalizeTitle(targetTitle);
        const similarity = calculateSimilarity(originNameNormalized, targetNormalized);
        const yearDiff = Math.abs(parseInt(String(item.year || '0')) - targetYear);
        console.log('🎬 [MOVIE DEBUG] Origin name check:', {
          origin_name: item.origin_name,
          similarity,
          yearDiff
        });
        return similarity > 0.7 && yearDiff <= 2;
      });
      if (originNameMatch) {
        console.log('🎬 [MOVIE DEBUG] Origin name match found:', originNameMatch.name);
        return originNameMatch;
      }

      // Priority 4: Title match with year tolerance
      console.log('🎬 [MOVIE DEBUG] Priority 4: Title match with year tolerance');
      const titleMatchWithYearTolerance = items.find(item => {
        const titleMatch = normalizeTitle(item.name || item.title || '') === normalizeTitle(targetTitle);
        const yearDiff = Math.abs(parseInt(String(item.year || '0')) - targetYear);
        console.log('🎬 [MOVIE DEBUG] Title tolerance check:', {
          name: item.name,
          titleMatch,
          yearDiff
        });
        return titleMatch && yearDiff <= 1;
      });
      if (titleMatchWithYearTolerance) {
        console.log('🎬 [MOVIE DEBUG] Title tolerance match found:', titleMatchWithYearTolerance.name);
        return titleMatchWithYearTolerance;
      }

      // Priority 5: Fuzzy title match
      console.log('🎬 [MOVIE DEBUG] Priority 5: Fuzzy title match');
      const fuzzyMatch = items.find(item => {
        const itemTitle = normalizeTitle(item.name || item.title || '');
        const targetNormalized = normalizeTitle(targetTitle);
        const similarity = calculateSimilarity(itemTitle, targetNormalized);
        const yearDiff = Math.abs(parseInt(String(item.year || '0')) - targetYear);
        console.log('🎬 [MOVIE DEBUG] Fuzzy match check:', {
          name: item.name,
          similarity,
          yearDiff
        });
        return similarity > 0.8 && yearDiff <= 2;
      });
      if (fuzzyMatch) {
        console.log('🎬 [MOVIE DEBUG] Fuzzy match found:', fuzzyMatch.name);
        return fuzzyMatch;
      }

      console.log('🎬 [MOVIE DEBUG] No match found');
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
                    onClick={() => setSelectedAudio('vietsub')}
                  >
                    Vietsub
                  </button>
                )}
                {movieLinks.dubbed && (
                  <button
                    className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${selectedAudio === 'dubbed' ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
                    onClick={() => setSelectedAudio('dubbed')}
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
