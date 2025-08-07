import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  type: 'movie';
}

interface TVShow {
  id: number;
  name: string;
  poster_path: string | null;
  type: 'tv';
}

interface Season {
  id: number;
  name: string;
  poster_path: string | null;
  season_number: number;
  tvShowId: number;
  tvShowName: string;
  type: 'season';
}

type SearchResult = Movie | TVShow | Season;

// API response interfaces
interface TMDBMovieResult {
  id: number;
  title: string;
  poster_path: string | null;
}

interface TMDBTVResult {
  id: number;
  name: string;
  poster_path: string | null;
}

interface TMDBSeasonResult {
  id: number;
  name: string;
  poster_path: string | null;
  season_number: number;
}

interface AutocompleteSearchProps {
  menu?: boolean;
  onSelectMovie?: () => void;
  inputClassName?: string;
  showClose?: boolean;
  onClose?: () => void;
}

export default function AutocompleteSearch({ menu, onSelectMovie, inputClassName, showClose, onClose }: AutocompleteSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Function to parse search query for season information
  const parseSearchQuery = (query: string) => {
    const seasonMatch = query.match(/(.*?)\s*(?:season|s)\s*(\d+)/i);
    if (seasonMatch) {
      return {
        showName: seasonMatch[1].trim(),
        seasonNumber: parseInt(seasonMatch[2]),
        isSeasonSearch: true
      };
    }
    return {
      showName: query,
      seasonNumber: null,
      isSeasonSearch: false
    };
  };

  // Function to get seasons for a TV show
  const getSeasonsForTVShow = async (tvShowId: number, tvShowName: string): Promise<Season[]> => {
    try {
      const response = await axios.get(`https://api.themoviedb.org/3/tv/${tvShowId}?api_key=${API_KEY}`);
      const seasons = response.data.seasons || [];
      
      return seasons.slice(0, 5).map((season: TMDBSeasonResult) => ({
        id: season.id,
        name: season.name,
        poster_path: season.poster_path,
        season_number: season.season_number,
        tvShowId,
        tvShowName,
        type: 'season' as const
      }));
    } catch {
      return [];
    }
  };

  // Function to search for specific season
  const searchForSpecificSeason = useCallback(async (showName: string, seasonNumber: number): Promise<Season[]> => {
    try {
      // First, search for the TV show
      const tvResponse = await axios.get(`https://api.themoviedb.org/3/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(showName)}`);
      const tvShows = tvResponse.data.results || [];
      
      if (tvShows.length === 0) return [];

      // Get the first (most relevant) TV show
      const tvShow = tvShows[0];
      
      // Get seasons for this TV show
      const seasons = await getSeasonsForTVShow(tvShow.id, tvShow.name);
      
      // Filter for the specific season number
      return seasons.filter(season => season.season_number === seasonNumber);
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    if (!query) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    // Don't search if query is less than 2 characters
    if (query.length < 2) {
      setResults([]);
      setShowDropdown(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timeout = setTimeout(async () => {
      try {
        // Parse the search query
        const { showName, seasonNumber, isSeasonSearch } = parseSearchQuery(query);
        
        let movies: Movie[] = [];
        let tvShows: TVShow[] = [];
        let seasons: Season[] = [];

        if (isSeasonSearch && seasonNumber) {
          // If searching for a specific season, prioritize that
          const specificSeasons = await searchForSpecificSeason(showName, seasonNumber);
          seasons = specificSeasons;
          
          // Also search for the TV show itself
          const tvResponse = await axios.get(`https://api.themoviedb.org/3/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(showName)}`);
          tvShows = (tvResponse.data.results || []).slice(0, 3).map((tvShow: TMDBTVResult) => ({
            id: tvShow.id,
            name: tvShow.name,
            poster_path: tvShow.poster_path,
            type: 'tv' as const
          }));
        } else {
          // Regular search for movies and TV shows
          const [moviesRes, tvShowsRes] = await Promise.all([
            axios.get(`https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(showName)}`),
            axios.get(`https://api.themoviedb.org/3/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(showName)}`)
          ]);

          movies = (moviesRes.data.results || []).slice(0, 8).map((movie: TMDBMovieResult) => ({
            id: movie.id,
            title: movie.title,
            poster_path: movie.poster_path,
            type: 'movie' as const
          }));

          tvShows = (tvShowsRes.data.results || []).slice(0, 6).map((tvShow: TMDBTVResult) => ({
            id: tvShow.id,
            name: tvShow.name,
            poster_path: tvShow.poster_path,
            type: 'tv' as const
          }));

          // Get seasons for the first few TV shows
          const seasonsPromises = tvShows.slice(0, 3).map((tvShow: TVShow) => 
            getSeasonsForTVShow(tvShow.id, tvShow.name)
          );
          const seasonsArrays = await Promise.all(seasonsPromises);
          seasons = seasonsArrays.flat();
        }

        // Combine and sort results (seasons first if season search, then movies, then TV shows)
        let combinedResults: SearchResult[] = [];
        if (isSeasonSearch) {
          combinedResults = [...seasons, ...tvShows, ...movies];
        } else {
          combinedResults = [...movies, ...tvShows, ...seasons];
        }
        
        setResults(combinedResults);
        setShowDropdown(true);
      } catch {
        setResults([]);
        setShowDropdown(false);
      }
      setLoading(false);
    }, 400); // debounce
    return () => clearTimeout(timeout);
  }, [query, searchForSpecificSeason]);

  // Đóng dropdown khi click ngoài
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) && inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showDropdown]);

  const handleSelect = (item: SearchResult) => {
    setShowDropdown(false);
    setQuery('');
    if (onSelectMovie) onSelectMovie();
    
    // Navigate to appropriate page based on type
    if (item.type === 'movie') {
      router.push(`/movies/${item.id}`);
    } else if (item.type === 'tv') {
      router.push(`/tvshows/${item.id}`);
    } else if (item.type === 'season') {
      // Navigate to TV show detail with specific season selected
      router.push(`/tvshows/${item.tvShowId}?season=${item.season_number}`);
    }
  };

  const getTitle = (item: SearchResult) => {
    if (item.type === 'movie') return item.title;
    if (item.type === 'tv') return item.name;
    if (item.type === 'season') return `${item.tvShowName} - ${item.name}`;
    return '';
  };

  const getTypeIcon = (type: 'movie' | 'tv' | 'season') => {
    if (type === 'movie') return '🎬';
    if (type === 'tv') return '📺';
    if (type === 'season') return '📋';
    return '🎬';
  };

  const getTypeLabel = (type: 'movie' | 'tv' | 'season') => {
    if (type === 'movie') return 'Movie';
    if (type === 'tv') return 'TV Show';
    if (type === 'season') return 'Season';
    return 'Movie';
  };

  const getDisplayTitle = (item: SearchResult) => {
    if (item.type === 'season') {
      return (
        <div>
          <div className="font-medium text-sm leading-tight">{item.tvShowName}</div>
          <div className="text-xs text-gray-500">{item.name}</div>
        </div>
      );
    }
    return (
      <div 
        className="font-medium text-sm leading-tight line-clamp-2 hover:line-clamp-none transition-all duration-200"
        title={getTitle(item)}
      >
        {getTitle(item)}
      </div>
    );
  };

  return (
    <div className={`relative w-full ${menu ? 'max-w-full' : ''}`}>
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          className={`px-4 py-2 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500 ${
            menu
              ? 'w-full bg-gray-800 text-white border-2 border-red-400 placeholder-gray-300 focus:bg-gray-900 pr-16'
              : 'w-full sm:w-48 sm:focus:w-64 bg-gray-200 text-gray-900 placeholder-gray-600 focus:bg-gray-900/50 focus:text-white focus:placeholder-gray-400 backdrop-blur-sm pr-16'
          } ${inputClassName || ''}`}
          placeholder={menu ? "Search..." : "Search movies, TV shows & seasons (e.g. 'Game of Thrones season 2')..."}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => { setIsFocused(true); if (results.length > 0) setShowDropdown(true); }}
          onBlur={() => setIsFocused(false)}
          autoComplete="off"
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2"
          tabIndex={-1}
        >
          <MagnifyingGlassIcon className={`h-5 w-5 ${menu ? 'text-gray-200' : isFocused ? 'text-gray-400' : 'text-gray-600'}`} />
        </button>
        {showClose && (
          <button
            type="button"
            className="absolute right-12 top-1/2 -translate-y-1/2 p-1 rounded-full bg-transparent hover:bg-red-100 text-red-500 text-xl"
            onClick={onClose}
            tabIndex={-1}
            aria-label="Close search"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`absolute left-0 right-0 mt-2 rounded-2xl shadow-2xl z-50 max-h-80 overflow-y-auto border border-gray-200 scrollbar-hide ${
              menu ? 'bg-white text-gray-900' : 'bg-white'
            }`}
            style={{ 
              minWidth: menu ? '100%' : '220px', 
              maxWidth: '100%'
            }}
          >
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-4 text-center text-gray-500"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="inline-block"
                  >
                    <MagnifyingGlassIcon className="h-5 w-5 mx-auto mb-2" />
                  </motion.div>
                  Loading...
                </motion.div>
              ) : query.length < 2 ? (
                <motion.div
                  key="encourage"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="p-4 text-center"
                >
                  <div className="flex flex-col items-center gap-2">
                    <motion.div
                      animate={{ 
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="relative"
                    >
                      <SparklesIcon className="h-6 w-6 text-yellow-500" />
                      <motion.div
                        animate={{ 
                          scale: [1, 1.3, 1],
                          opacity: [0.7, 1, 0.7]
                        }}
                        transition={{ 
                          duration: 1.5, 
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"
                      />
                    </motion.div>
                    <div className="space-y-1">
                      <p className="text-gray-500 text-xs">
                        Enter at least 2 characters
                      </p>
                    </div>
                    <motion.div 
                      className="flex items-center gap-1"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <motion.div 
                        className="w-1.5 h-1.5 bg-gray-300 rounded-full"
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
                      />
                      <motion.div 
                        className="w-1.5 h-1.5 bg-gray-300 rounded-full"
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
                      />
                      <motion.div 
                        className="w-1.5 h-1.5 bg-gray-300 rounded-full"
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
                      />
                    </motion.div>
                  </div>
                </motion.div>
              ) : results.length === 0 ? (
                <motion.div
                  key="no-results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-4 text-center text-gray-400"
                >
                  No results found.
                </motion.div>
              ) : (
                <motion.div
                  key="results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <ul className="divide-y divide-gray-100">
                    {results.map((item, index) => (
                      <motion.li
                        key={`${item.type}-${item.id}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-gray-100 transition"
                        onClick={() => handleSelect(item)}
                      >
                        <div className="flex-shrink-0 w-10 h-14 relative rounded overflow-hidden bg-gray-200">
                          {item.poster_path ? (
                            <Image
                              src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
                              alt={getTitle(item)}
                              fill
                              style={{ objectFit: 'cover' }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl">
                              {getTypeIcon(item.type)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2">
                            <div className="flex-1 min-w-0">
                              {getDisplayTitle(item)}
                            </div>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded flex-shrink-0 mt-0.5">
                              {getTypeLabel(item.type)}
                            </span>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}