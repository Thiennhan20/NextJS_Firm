import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
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
  const [results, setResults] = useState<Movie[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!query) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    setLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await axios.get(
          `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}`
        );
        setResults(res.data.results || []);
        setShowDropdown(true);
      } catch {
        setResults([]);
        setShowDropdown(false);
      }
      setLoading(false);
    }, 400); // debounce
    return () => clearTimeout(timeout);
  }, [query]);

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

  const handleSelect = (movieId: number) => {
    setShowDropdown(false);
    setQuery('');
    if (onSelectMovie) onSelectMovie();
    router.push(`/movies/${movieId}`);
  };

  return (
    <div className={`relative w-full ${menu ? 'max-w-full' : ''}`}>
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          className={`px-4 py-2 rounded-full transition-all duration-300 pr-10 focus:outline-none focus:ring-2 focus:ring-red-500 ${
            menu
              ? 'w-full bg-gray-800 text-white border-2 border-red-400 placeholder-gray-300 focus:bg-gray-900'
              : 'w-full sm:w-48 sm:focus:w-64 bg-gray-200 text-gray-900 placeholder-gray-600 focus:bg-gray-900/50 focus:text-white focus:placeholder-gray-400 backdrop-blur-sm'
          } ${inputClassName || ''}`}
          placeholder="Search movies..."
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
      {showDropdown && (
        <div
          ref={dropdownRef}
          className={`absolute left-0 right-0 mt-2 rounded-2xl shadow-2xl z-50 max-h-80 overflow-y-auto border border-gray-200 scrollbar-hide ${
            menu ? 'bg-white text-gray-900' : 'bg-white'
          }`}
          style={{ 
            minWidth: menu ? '100%' : '220px', 
            maxWidth: '100%'
          }}
        >
          {loading ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-gray-400">No movies found.</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {results.map((movie) => (
                <li
                  key={movie.id}
                  className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-gray-100 transition"
                  onClick={() => handleSelect(movie.id)}
                >
                  <div className="flex-shrink-0 w-10 h-14 relative rounded overflow-hidden bg-gray-200">
                    {movie.poster_path ? (
                      <Image
                        src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                        alt={movie.title}
                        fill
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl">🎬</div>
                    )}
                  </div>
                  <span className="font-medium truncate max-w-[160px]">{movie.title}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}