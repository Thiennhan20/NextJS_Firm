'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Pagination from '@/components/Pagination'
import axios from 'axios'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Suspense } from 'react'

// Định nghĩa kiểu Movie rõ ràng
interface Movie {
  id: number;
  title: string;
  poster_path: string;
  image?: string;

  year?: number;
  genre?: string;
  release_date?: string;
  country?: string;
  status?: 'Full HD' | 'Full HD/CAM' | 'Coming Soon' | 'Non';
}

// Type for TMDB API movie response
interface TMDBMovie {
  id: number;
  title: string;
  poster_path: string;
  vote_average: number;
  release_date?: string;
  original_language?: string;
}

function MoviesPageContent() {
  const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Lấy giá trị từ URL parameters cho cả page và year
  const urlPage = Number(searchParams.get('page')) || 1;
  const urlYear = searchParams.get('year') || 'All';
  
  // Khởi tạo state từ URL thay vì hardcode
  const [selectedYear, setSelectedYear] = useState<string | number>(urlYear)
  const [page, setPage] = useState(urlPage)
  const [loading, setLoading] = useState(false)
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false)
  
  // Cache các trang đã load: { [year]: { [page]: Movie[] } }
  const [pagesCache, setPagesCache] = useState<{ [year: string]: { [page: number]: Movie[] } }>({})
  // Lưu các trang đã load cho từng năm: { [year]: number[] }
  const [loadedPages, setLoadedPages] = useState<{ [year: string]: number[] }>({})

  // Helper functions để làm việc với cache theo năm
  const getCurrentYearCache = () => {
    const yearKey = String(selectedYear);
    return pagesCache[yearKey] || {};
  };

  const getCurrentYearLoadedPages = () => {
    const yearKey = String(selectedYear);
    return loadedPages[yearKey] || [];
  };

  const setCurrentYearCache = (page: number, movies: Movie[]) => {
    const yearKey = String(selectedYear);
    setPagesCache(prev => ({
      ...prev,
      [yearKey]: {
        ...prev[yearKey],
        [page]: movies
      }
    }));
  };

  const setCurrentYearLoadedPages = (pages: number[]) => {
    const yearKey = String(selectedYear);
    setLoadedPages(prev => ({
      ...prev,
      [yearKey]: pages
    }));
  };

  // Track previous values to avoid infinite loops
  const prevPageRef = useRef(page);
  const prevYearRef = useRef(selectedYear);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.year-dropdown-container')) {
        setIsYearDropdownOpen(false);
      }
    };

    if (isYearDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isYearDropdownOpen]);

  // Sync state với URL parameters khi URL thay đổi (browser navigation)
  useEffect(() => {
    const newPage = Number(searchParams.get('page')) || 1;
    const newYear = searchParams.get('year') || 'All';
    
    // Chỉ update nếu thực sự có thay đổi để tránh infinite loop
    if (newPage !== prevPageRef.current) {
      setPage(newPage);
      prevPageRef.current = newPage;
    }
    
    if (newYear !== prevYearRef.current) {
      setSelectedYear(newYear);
      prevYearRef.current = newYear;
    }
  }, [searchParams]);

  // Khởi tạo cache cho năm đầu tiên khi component mount
  useEffect(() => {
    if (!getCurrentYearCache()[urlPage]) {
      const initCache = async () => {
        setLoading(true);
        try {
          const movies = await fetchMoviesPage(urlPage);
          setCurrentYearCache(urlPage, movies);
          setCurrentYearLoadedPages([urlPage]);
        } catch {
          setCurrentYearCache(urlPage, []);
          setCurrentYearLoadedPages([urlPage]);
        }
        setLoading(false);
        // Prefetch các trang tiếp theo
        loadNext10Pages(urlPage + 1);
      };
      initCache();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Khi page hoặc year thay đổi từ user action, update URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(page));
    params.set('year', String(selectedYear));
    
    // Sử dụng push thay vì replace để tạo history entries
    router.push(`?${params.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, selectedYear]);

  // Xử lý khi thay đổi filter (selectedYear)
  useEffect(() => {
    // Chỉ reset khi year thực sự thay đổi từ user action
    if (selectedYear !== urlYear) {
      setPage(1);
      // Fetch trang 1 ngay lập tức nếu chưa có cache cho năm này
      const fetchFirstPage = async () => {
        if (!getCurrentYearCache()[1]) {
          setLoading(true);
          try {
            const movies = await fetchMoviesPage(1);
            setCurrentYearCache(1, movies);
            setCurrentYearLoadedPages([1]);
          } catch {
            setCurrentYearCache(1, []);
            setCurrentYearLoadedPages([1]);
          }
          setLoading(false);
          // Prefetch các trang tiếp theo
          loadNext10Pages(2);
        }
      };
      fetchFirstPage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear]);

  // Compute years dynamically from movies
  const currentYear = new Date().getFullYear();
  const years = useMemo(() => {
    const yearArr = [];
    for (let y = currentYear; y >= 2000; y--) {
      yearArr.push(y);
    }
    return ['All', ...yearArr];
  }, [currentYear]);

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
    
    // Trường hợp Full HD/CAM: phim mới xuất hiện dưới 1 tháng (4 tuần)
    if (timeDiffInWeeks < 4) return 'Full HD/CAM';
    
    // Trường hợp Full HD: phim đã xuất hiện hơn 1 tháng (4 tuần)
    return 'Full HD';
  };

  // Hàm chuyển đổi language code thành tên quốc gia
  const getCountryName = (languageCode?: string): string => {
    const countryMap: { [key: string]: string } = {
      'en': 'USA',
      'ja': 'Japan',
      'ko': 'Korea',
      'zh': 'China',
      'hi': 'India',
      'fr': 'France',
      'de': 'Germany',
      'es': 'Spain',
      'it': 'Italy',
      'pt': 'Brazil',
      'ru': 'Russia',
      'ar': 'Egypt',
      'th': 'Thailand',
      'vi': 'Vietnam',
      'id': 'Indonesia',
      'ms': 'Malaysia',
      'tl': 'Philippines',
      'my': 'Myanmar',
      'km': 'Cambodia',
      'lo': 'Laos'
    };
    return countryMap[languageCode || 'en'] || 'USA';
  };

  // Hàm fetch 1 trang phim
  const fetchMoviesPage = async (pageToFetch: number) => {
    let url = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&sort_by=popularity.desc&page=${pageToFetch}`;
    if (selectedYear !== 'All') {
      url += `&primary_release_year=${selectedYear}`;
    }
    const response = await axios.get(url);
    let fetchedMovies = response.data.results
    fetchedMovies = fetchedMovies.map((movie: TMDBMovie) => ({
      id: movie.id,
      title: movie.title,
      
      year: movie.release_date ? Number(movie.release_date.slice(0, 4)) : '',
      image: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '',
      genre: [],
      release_date: movie.release_date,
      country: getCountryName(movie.original_language),
      status: generateMovieStatus(movie.release_date),
    }))
    return fetchedMovies
  }

  // Khi page thay đổi, nếu chưa có trong cache thì fetch
  useEffect(() => {
    let ignore = false;
    const loadPage = async () => {
      if (getCurrentYearCache()[page]) return;
      setLoading(true);
      try {
        const movies = await fetchMoviesPage(page);
        if (!ignore) {
          setCurrentYearCache(page, movies);
          const currentPages = getCurrentYearLoadedPages();
          const newPages = currentPages.includes(page) ? currentPages : [...currentPages, page].sort((a, b) => a - b);
          setCurrentYearLoadedPages(newPages);
        }
      } catch {
        if (!ignore) setCurrentYearCache(page, []);
      }
      if (!ignore) setLoading(false);
    }
    loadPage();
    return () => { ignore = true; }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, selectedYear, API_KEY]);

  // Hàm load thêm 10 trang tiếp theo (khi bấm vào 1 trong 2 trang kế tiếp)
  const loadNext10Pages = async (startPage: number) => {
    const promises = [];
    for (let p = startPage; p < startPage + 10; p++) {
      if (!getCurrentYearCache()[p]) {
        promises.push(fetchMoviesPage(p).then(movies => ({ p, movies })));
      }
    }
    
    if (promises.length > 0) {
      setLoading(true);
      const results = await Promise.all(promises);
      results.forEach(({ p, movies }) => {
        setCurrentYearCache(p, movies);
      });
      
      const currentPages = getCurrentYearLoadedPages();
      const newPages = [...currentPages];
      for (let p = startPage; p < startPage + 10; p++) {
        if (!newPages.includes(p)) newPages.push(p);
      }
      setCurrentYearLoadedPages(newPages.sort((a, b) => a - b));
      setLoading(false);
    }
  }

  // Lấy phim của trang hiện tại
  const pagedMovies = getCurrentYearCache()[page] || [];

  // Animation variants for grid items
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  // Xác định maxLoadedPage
  const maxLoadedPage = getCurrentYearLoadedPages().length > 0 ? Math.max(...getCurrentYearLoadedPages()) : 1;

  // Xử lý khi đổi trang - Fix logic để đảm bảo window.scrollTo() được gọi đúng thời điểm
  const handlePageChange = (p: number) => {
    if (p < 1) return;
    
    // Nếu bấm vào trang cuối cùng đã load, tự động load tiếp 10 trang mới
    if (p === maxLoadedPage) {
      loadNext10Pages(maxLoadedPage + 1).then(() => {
        setPage(p);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    } else if (p === maxLoadedPage + 1 || p === maxLoadedPage + 2) {
      loadNext10Pages(maxLoadedPage + 1).then(() => {
        setPage(p);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    } else {
      setPage(p);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // Xử lý khi thay đổi year filter
  const handleYearChange = (year: string | number) => {
    setSelectedYear(year);
    // Reset page về 1 khi thay đổi năm
    setPage(1);
    // Clear cache cho năm cũ nếu cần thiết để tiết kiệm memory
    if (Object.keys(pagesCache).length > 10) {
      const currentYearKey = String(selectedYear);
      const newCache = { [currentYearKey]: pagesCache[currentYearKey] || {} };
      setPagesCache(newCache);
    }
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl sm:text-5xl font-bold mb-8 bg-gradient-to-r from-red-500 to-blue-500 text-transparent bg-clip-text text-center"
        >
          All Movies
        </motion.h1>
        
        {/* Filter chỉ còn Year */}
        <div className="flex flex-col gap-4 mb-10">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4">
              <div className="relative year-dropdown-container">
                <button
                  onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
                >
                  <span className="font-medium text-sm">
                    {selectedYear === 'All' ? 'All Years' : selectedYear}
                  </span>
                  <motion.svg 
                    className="w-4 h-4 text-gray-400"
                    animate={{ rotate: isYearDropdownOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </motion.svg>
                </button>
                
                {/* Custom Dropdown */}
                <AnimatePresence>
                  {isYearDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-0 mt-1 w-27 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-50 max-h-36 overflow-y-auto scrollbar-hide"
                    >
                      <div className="py-1">
                        {years.map((year) => (
                          <button
                            key={year}
                            onClick={() => {
                              handleYearChange(year === 'All' ? 'All' : Number(year));
                              setIsYearDropdownOpen(false);
                            }}
                            className={`w-full px-2 py-1.5 text-left hover:bg-gray-700 transition-colors duration-150 text-sm ${
                              String(selectedYear) === String(year)
                                ? 'bg-purple-600 text-white font-medium' 
                                : 'text-gray-300 hover:text-white'
                            }`}
                          >
                            {year === 'All' ? 'All Years' : year}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
        {/* Movie Grid + Loading + Pagination */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
              className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full"
            />
            <p className="mt-4 text-gray-400 text-lg">Loading Movies...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${selectedYear}-${page}`}
              variants={{
                hidden: { opacity: 0, y: 30 },
                show: {
                  opacity: 1,
                  y: 0,
                  transition: { staggerChildren: 0.08 },
                },
              }}
              initial="hidden"
              animate="show"
              exit="hidden"
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6"
            >
              {/* Sửa điều kiện: chỉ hiện No movies found khi !loading, cache đã có key cho page hiện tại và không có phim */}
              {!loading && getCurrentYearCache().hasOwnProperty(page) && pagedMovies.length === 0 && (
                <motion.div
                  key="no-movies"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="col-span-full text-center text-gray-400 py-12 text-xl"
                >
                  No movies found.
                </motion.div>
              )}
                             {pagedMovies.map((movie: Movie) => (
                 <motion.div
                   key={movie.id}
                   variants={itemVariants}
                   whileHover={{ scale: 1.05 }}
                   transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                 >
                   <Link key={movie.id} href={`/movies/${movie.id}?page=${page}&year=${selectedYear}`} className="block">
                     <div className="border rounded-lg overflow-hidden relative group">
                                               {/* Poster Image */}
                        <div className="relative">
                          <Image
                            src={movie.image ?? ''}
                            alt={movie.title}
                            width={500}
                            height={750}
                            className="w-full"
                          />
                          
                                                     {/* Status Badge */}
                           <div className="absolute top-2 left-2">
                             <span className={`px-2 py-1 text-xs font-bold rounded-md ${
                               movie.status === 'Full HD' ? 'bg-green-500 text-white' :
                               movie.status === 'Full HD/CAM' ? 'bg-red-500 text-white' :
                               movie.status === 'Coming Soon' ? 'bg-yellow-500 text-black' :
                               movie.status === 'Non' ? 'bg-gray-500 text-white' :
                               'bg-yellow-500 text-black'
                             }`}>
                               {movie.status}
                             </span>
                           </div>
                        </div>

                        {/* Movie Info */}
                        <div className="p-3 bg-gray-900">
                          <h3 className="text-white font-semibold text-sm mb-2 truncate">
                            {movie.title}
                          </h3>
                          
                          {/* Date and Country */}
                          <div className="flex items-center justify-between text-xs text-gray-400">
                            <span>
                              {movie.release_date ? new Date(movie.release_date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              }) : 'TBA'}
                            </span>
                            <span>{movie.country}</span>
                          </div>
                        </div>
                     </div>
                   </Link>
                 </motion.div>
               ))}
            </motion.div>
          </AnimatePresence>
        )}
        {!loading && getCurrentYearLoadedPages().length > 0 && (
          <div className="max-w-7xl mx-auto px-4 pb-12">
            <Pagination
              currentPage={page}
              loadedPages={getCurrentYearLoadedPages()}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default function MoviesPage() {
  return (
    <Suspense>
      <MoviesPageContent />
    </Suspense>
  );
}
