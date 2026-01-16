import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import axios, { CancelTokenSource } from 'axios';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon, SparklesIcon, MicrophoneIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

// Type definitions for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const DEBOUNCE_DELAY = 600;
const MAX_CACHE_SIZE = 50;
const MIN_QUERY_LENGTH = 2;

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
  onFocusChange?: (isFocused: boolean) => void;
}

interface CacheEntry {
  results: SearchResult[];
  timestamp: number;
}

export default function AutocompleteSearch({ 
  menu, 
  onSelectMovie, 
  inputClassName, 
  showClose, 
  onClose, 
  onFocusChange 
}: AutocompleteSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [cache, setCache] = useState<{ [key: string]: CacheEntry }>({});
  
  // Voice search states
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cancelTokenRef = useRef<CancelTokenSource | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const router = useRouter();

  // Check if voice recognition is supported
  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    setVoiceSupported(!!SpeechRecognitionAPI);
  }, []);

  // Initialize speech recognition
  const startVoiceSearch = useCallback(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognitionAPI) {
      console.error('Speech recognition not supported');
      return;
    }

    // Stop any existing recognition
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    const recognition = new SpeechRecognitionAPI();
    recognitionRef.current = recognition;

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'vi-VN'; // Vietnamese, change to 'en-US' for English

    recognition.onstart = () => {
      setIsListening(true);
      setInterimTranscript('');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interim += transcript;
        }
      }

      if (finalTranscript) {
        setQuery(prev => prev + finalTranscript);
        setInterimTranscript('');
      } else {
        setInterimTranscript(interim);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      setInterimTranscript('');
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
      inputRef.current?.focus();
    };

    recognition.start();
  }, []);

  const stopVoiceSearch = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  const toggleVoiceSearch = useCallback(() => {
    if (isListening) {
      stopVoiceSearch();
    } else {
      startVoiceSearch();
    }
  }, [isListening, startVoiceSearch, stopVoiceSearch]);

  // Cleanup recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Parse search query for season information
  const parseSearchQuery = useCallback((query: string) => {
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
  }, []);

  // Get seasons for a TV show
  const getSeasonsForTVShow = useCallback(async (
    tvShowId: number, 
    tvShowName: string,
    cancelToken: CancelTokenSource
  ): Promise<Season[]> => {
    try {
      const response = await axios.get(
        `https://api.themoviedb.org/3/tv/${tvShowId}?api_key=${API_KEY}`,
        { cancelToken: cancelToken.token }
      );
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
    } catch (error) {
      if (axios.isCancel(error)) {
        throw error;
      }
      return [];
    }
  }, []);

  // Search for specific season
  const searchForSpecificSeason = useCallback(async (
    showName: string, 
    seasonNumber: number,
    cancelToken: CancelTokenSource
  ): Promise<Season[]> => {
    try {
      const tvResponse = await axios.get(
        `https://api.themoviedb.org/3/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(showName)}`,
        { cancelToken: cancelToken.token }
      );
      const tvShows = tvResponse.data.results || [];
      
      if (tvShows.length === 0) return [];

      const tvShow = tvShows[0];
      const seasons = await getSeasonsForTVShow(tvShow.id, tvShow.name, cancelToken);
      
      return seasons.filter(season => season.season_number === seasonNumber);
    } catch (error) {
      if (axios.isCancel(error)) {
        throw error;
      }
      return [];
    }
  }, [getSeasonsForTVShow]);

  // Clean old cache entries
  const cleanCache = useCallback((currentCache: { [key: string]: CacheEntry }) => {
    const entries = Object.entries(currentCache);
    if (entries.length <= MAX_CACHE_SIZE) return currentCache;
    
    const sorted = entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
    return Object.fromEntries(sorted.slice(0, MAX_CACHE_SIZE));
  }, []);

  // Main search function
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setShowDropdown(searchQuery.length > 0);
      setLoading(false);
      return;
    }

    // Check cache first (valid for 5 minutes)
    const cacheKey = searchQuery.toLowerCase().trim();
    const cachedEntry = cache[cacheKey];
    if (cachedEntry) {
      const cacheAge = Date.now() - cachedEntry.timestamp;
      if (cacheAge < 5 * 60 * 1000) {
        setResults(cachedEntry.results);
        setShowDropdown(true);
        setLoading(false);
        return;
      }
    }

    setLoading(true);

    // Cancel previous request
    if (cancelTokenRef.current) {
      cancelTokenRef.current.cancel('New search initiated');
    }

    cancelTokenRef.current = axios.CancelToken.source();

    try {
      const { showName, seasonNumber, isSeasonSearch } = parseSearchQuery(searchQuery);
      
      let movies: Movie[] = [];
      let tvShows: TVShow[] = [];
      let seasons: Season[] = [];

      if (isSeasonSearch && seasonNumber) {
        // Search for specific season
        const [specificSeasons, tvResponse] = await Promise.all([
          searchForSpecificSeason(showName, seasonNumber, cancelTokenRef.current),
          axios.get(
            `https://api.themoviedb.org/3/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(showName)}`,
            { cancelToken: cancelTokenRef.current.token }
          )
        ]);

        seasons = specificSeasons;
        tvShows = (tvResponse.data.results || []).slice(0, 3).map((tvShow: TMDBTVResult) => ({
          id: tvShow.id,
          name: tvShow.name,
          poster_path: tvShow.poster_path,
          type: 'tv' as const
        }));
      } else {
        // Regular search for movies and TV shows
        const [moviesRes, tvShowsRes] = await Promise.all([
          axios.get(
            `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(showName)}`,
            { cancelToken: cancelTokenRef.current.token }
          ),
          axios.get(
            `https://api.themoviedb.org/3/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(showName)}`,
            { cancelToken: cancelTokenRef.current.token }
          )
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

        // Get seasons for top 2 TV shows only (reduced from 3)
        const seasonsPromises = tvShows.slice(0, 2).map((tvShow: TVShow) => 
          getSeasonsForTVShow(tvShow.id, tvShow.name, cancelTokenRef.current!)
        );
        
        try {
          const seasonsArrays = await Promise.all(seasonsPromises);
          seasons = seasonsArrays.flat();
        } catch (error) {
          if (axios.isCancel(error)) {
            throw error;
          }
          // Continue without seasons if this fails
          seasons = [];
        }
      }

      // Combine results
      const combinedResults: SearchResult[] = isSeasonSearch
        ? [...seasons, ...tvShows, ...movies]
        : [...movies, ...tvShows, ...seasons];
      
      setResults(combinedResults);
      setShowDropdown(true);

      // Update cache
      setCache(prev => {
        const updated = {
          ...prev,
          [cacheKey]: {
            results: combinedResults,
            timestamp: Date.now()
          }
        };
        return cleanCache(updated);
      });

    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Search cancelled:', error.message);
        return;
      }
      console.error('Search error:', error);
      setResults([]);
      setShowDropdown(false);
    } finally {
      setLoading(false);
    }
  }, [cache, parseSearchQuery, searchForSpecificSeason, getSeasonsForTVShow, cleanCache]);

  // Debounced search effect
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!query) {
      setResults([]);
      setShowDropdown(false);
      setLoading(false);
      return;
    }

    if (query.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setShowDropdown(true);
      setLoading(false);
      return;
    }

    // Set loading immediately when user types
    setLoading(true);

    debounceTimerRef.current = setTimeout(() => {
      performSearch(query);
    }, DEBOUNCE_DELAY);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, performSearch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(e.target as Node) && 
        inputRef.current && 
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    
    if (showDropdown) {
      document.addEventListener('mousedown', handleClick);
    }
    
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showDropdown]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cancelTokenRef.current) {
        cancelTokenRef.current.cancel('Component unmounted');
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleSelect = useCallback((item: SearchResult) => {
    setShowDropdown(false);
    setQuery('');
    onSelectMovie?.();
    
    if (item.type === 'movie') {
      router.push(`/movies/${item.id}`);
    } else if (item.type === 'tv') {
      router.push(`/tvshows/${item.id}`);
    } else if (item.type === 'season') {
      router.push(`/tvshows/${item.tvShowId}?season=${item.season_number}`);
    }
  }, [router, onSelectMovie]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      e.preventDefault();
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setShowDropdown(false);
      setQuery('');
      inputRef.current?.blur();
      onSelectMovie?.();
    }
  }, [query, router, onSelectMovie]);

  const handleSearchClick = useCallback(() => {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setShowDropdown(false);
      setQuery('');
      inputRef.current?.blur();
      onSelectMovie?.();
    }
  }, [query, router, onSelectMovie]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    if (results.length > 0) setShowDropdown(true);
    onFocusChange?.(true);
  }, [results.length, onFocusChange]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    onFocusChange?.(false);
  }, [onFocusChange]);

  const getTitle = useCallback((item: SearchResult) => {
    if (item.type === 'movie') return item.title;
    if (item.type === 'tv') return item.name;
    if (item.type === 'season') return `${item.tvShowName} - ${item.name}`;
    return '';
  }, []);

  const getTypeIcon = useCallback((type: 'movie' | 'tv' | 'season') => {
    if (type === 'movie') return '🎬';
    if (type === 'tv') return '📺';
    if (type === 'season') return '📋';
    return '🎬';
  }, []);

  const getTypeLabel = useCallback((type: 'movie' | 'tv' | 'season') => {
    if (type === 'movie') return 'Movie';
    if (type === 'tv') return 'TV Show';
    if (type === 'season') return 'Season';
    return 'Movie';
  }, []);

  const getDisplayTitle = useCallback((item: SearchResult) => {
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
  }, [getTitle]);

  const inputClassNames = useMemo(() => 
    `px-4 py-2 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500 ${
      menu
        ? 'w-full bg-gray-800 text-white border-2 border-red-400 placeholder-gray-300 focus:bg-gray-900 pr-24'
        : 'w-full sm:w-48 sm:focus:w-64 bg-gray-200 text-gray-900 placeholder-gray-600 focus:bg-gray-900/50 focus:text-white focus:placeholder-gray-400 backdrop-blur-sm pr-24'
    } ${inputClassName || ''}`
  , [menu, inputClassName]);

  const searchIconColor = useMemo(() => {
    if (query.trim()) {
      return menu ? 'text-red-400 drop-shadow-lg' : 'text-red-500 drop-shadow-lg';
    }
    return menu ? 'text-gray-400' : isFocused ? 'text-gray-400' : 'text-gray-500';
  }, [query, menu, isFocused]);

  return (
    <div className={`relative w-full ${menu ? 'max-w-full' : ''}`}>
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          className={inputClassNames}
          placeholder={menu ? "Search" : "Search"}
          value={isListening ? query + interimTranscript : query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          autoComplete="off"
        />
        
        {/* Voice Search Button */}
        {voiceSupported && (
          <button
            type="button"
            onClick={toggleVoiceSearch}
            className={`absolute right-10 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-all duration-300 ${
              isListening 
                ? 'bg-red-500 text-white animate-pulse' 
                : 'hover:bg-gray-200/50 hover:scale-110 active:scale-95'
            }`}
            tabIndex={-1}
            aria-label={isListening ? "Stop voice search" : "Start voice search"}
          >
            <motion.div
              animate={{
                scale: isListening ? [1, 1.2, 1] : 1,
              }}
              transition={{ 
                duration: 0.8, 
                repeat: isListening ? Infinity : 0,
                ease: "easeInOut"
              }}
            >
              <MicrophoneIcon 
                className={`h-5 w-5 transition-all duration-300 ${
                  isListening 
                    ? 'text-white' 
                    : menu 
                      ? 'text-gray-400 hover:text-red-400' 
                      : isFocused 
                        ? 'text-red-500 hover:text-red-600' 
                        : 'text-gray-500 hover:text-red-500'
                }`}
              />
            </motion.div>
          </button>
        )}
        
        <button
          type="button"
          onClick={handleSearchClick}
          className={`absolute ${voiceSupported ? 'right-3' : 'right-3'} top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-all duration-300 hover:bg-gray-200/50 hover:scale-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100`}
          tabIndex={-1}
          disabled={!query.trim() && !interimTranscript}
          aria-label="Search"
        >
          <motion.div
            animate={{
              scale: query.trim() ? 1.1 : 1,
              opacity: query.trim() ? 1 : 0.4,
            }}
            transition={{ duration: 0.2 }}
          >
            <MagnifyingGlassIcon 
              className={`h-5 w-5 transition-all duration-300 ${searchIconColor}`}
              style={{
                filter: query.trim() ? 'drop-shadow(0 0 4px rgba(239, 68, 68, 0.5))' : 'none'
              }}
            />
          </motion.div>
        </button>
        {showClose && (
          <button
            type="button"
            className={`absolute ${voiceSupported ? 'right-[4.5rem]' : 'right-12'} top-1/2 -translate-y-1/2 p-1 rounded-full bg-transparent hover:bg-red-100 text-red-500 text-xl transition-colors`}
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
      
      {/* Voice Listening Indicator */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute left-0 right-0 mt-2 p-3 bg-red-50 border border-red-200 rounded-xl shadow-lg z-50"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {[0, 0.15, 0.3, 0.45, 0.6].map((delay, i) => (
                  <motion.div
                    key={i}
                    className="w-1 bg-red-500 rounded-full"
                    animate={{ 
                      height: [8, 20, 8],
                    }}
                    transition={{ 
                      duration: 0.5, 
                      repeat: Infinity, 
                      delay,
                      ease: "easeInOut"
                    }}
                  />
                ))}
              </div>
              <div className="flex-1">
                <p className="text-sm text-red-600 font-medium">Đang nghe...</p>
                {interimTranscript && (
                  <p className="text-xs text-gray-600 mt-1 italic">&quot;{interimTranscript}&quot;</p>
                )}
              </div>
              <button
                onClick={stopVoiceSearch}
                className="px-3 py-1 text-xs bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                Dừng
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
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
                  <p className="text-sm">Searching...</p>
                </motion.div>
              ) : query.length < MIN_QUERY_LENGTH ? (
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
                        Enter at least {MIN_QUERY_LENGTH} characters
                      </p>
                    </div>
                    <motion.div 
                      className="flex items-center gap-1"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      {[0, 0.2, 0.4].map((delay, i) => (
                        <motion.div
                          key={i}
                          className="w-1.5 h-1.5 bg-gray-300 rounded-full"
                          animate={{ scale: [1, 1.5, 1] }}
                          transition={{ duration: 0.8, repeat: Infinity, delay }}
                        />
                      ))}
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
                  <p className="text-sm">No results found.</p>
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
                        key={`${item.type}-${item.id}-${index}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSelect(item)}
                      >
                        <div className="flex-shrink-0 w-10 h-14 relative rounded overflow-hidden bg-gray-200">
                          {item.poster_path ? (
                            <Image
                              src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
                              alt={getTitle(item)}
                              fill
                              sizes="40px"
                              style={{ objectFit: 'cover' }}
                              loading="lazy"
                              quality={60}
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