'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Pagination from '@/components/Pagination'
import FilterIcon from '@/components/FilterIcon'
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
  genre_ids?: number[];
}

function MoviesPageContent() {
  const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Lấy giá trị từ URL parameters cho cả page, year, category và country
  const urlPage = Number(searchParams.get('page')) || 1;
  const urlYear = searchParams.get('year') || 'All';
  const urlCategory = searchParams.get('category') || 'All';
  const urlCountry = searchParams.get('country') || 'All';
  
  // Khởi tạo state từ URL thay vì hardcode
  const [selectedYear, setSelectedYear] = useState<string | number>(urlYear)
  const [selectedCategory, setSelectedCategory] = useState<string>(urlCategory)
  const [selectedCountry, setSelectedCountry] = useState<string>(urlCountry)
  const [page, setPage] = useState(urlPage)
  const [loading, setLoading] = useState(false)

  
  // Cache các trang đã load: { [filterKey]: { [page]: Movie[] } }
  const [pagesCache, setPagesCache] = useState<{ [filterKey: string]: { [page: number]: Movie[] } }>({})
  // Lưu các trang đã load cho từng filter: { [filterKey]: number[] }
  const [loadedPages, setLoadedPages] = useState<{ [filterKey: string]: number[] }>({})

  // Helper functions để làm việc với cache theo filter
  const getCurrentFilterKey = () => {
    return `${selectedYear}-${selectedCategory}-${selectedCountry}`;
  };

  const getCurrentFilterCache = () => {
    const filterKey = getCurrentFilterKey();
    return pagesCache[filterKey] || {};
  };

  const getCurrentFilterLoadedPages = () => {
    const filterKey = getCurrentFilterKey();
    return loadedPages[filterKey] || [];
  };

  const setCurrentFilterCache = (page: number, movies: Movie[]) => {
    const filterKey = getCurrentFilterKey();
    setPagesCache(prev => ({
      ...prev,
      [filterKey]: {
        ...prev[filterKey],
        [page]: movies
      }
    }));
  };

  const setCurrentFilterLoadedPages = (pages: number[]) => {
    const filterKey = getCurrentFilterKey();
    setLoadedPages(prev => ({
      ...prev,
      [filterKey]: pages
    }));
  };

  // Track previous values to avoid infinite loops
  const prevPageRef = useRef(page);
  const prevYearRef = useRef(selectedYear);
  const prevCategoryRef = useRef(selectedCategory);
  const prevCountryRef = useRef(selectedCountry);
  


  // Sync state với URL parameters khi URL thay đổi (browser navigation)
  useEffect(() => {
    const newPage = Number(searchParams.get('page')) || 1;
    const newYear = searchParams.get('year') || 'All';
    const newCategory = searchParams.get('category') || 'All';
    const newCountry = searchParams.get('country') || 'All';
    
    // Chỉ update nếu thực sự có thay đổi để tránh infinite loop
    if (newPage !== prevPageRef.current) {
      setPage(newPage);
      prevPageRef.current = newPage;
    }
    
    if (newYear !== prevYearRef.current) {
      setSelectedYear(newYear);
      prevYearRef.current = newYear;
    }

    if (newCategory !== prevCategoryRef.current) {
      setSelectedCategory(newCategory);
      prevCategoryRef.current = newCategory;
    }

    if (newCountry !== prevCountryRef.current) {
      setSelectedCountry(newCountry);
      prevCountryRef.current = newCountry;
    }
  }, [searchParams]);

  // Khởi tạo cache cho filter đầu tiên khi component mount
  useEffect(() => {
    if (!getCurrentFilterCache()[urlPage]) {
      const initCache = async () => {
        setLoading(true);
        try {
          const movies = await fetchMoviesPage(urlPage);
          setCurrentFilterCache(urlPage, movies);
          setCurrentFilterLoadedPages([urlPage]);
        } catch {
          setCurrentFilterCache(urlPage, []);
          setCurrentFilterLoadedPages([urlPage]);
        }
        setLoading(false);
        // Prefetch các trang tiếp theo
        loadNext10Pages(urlPage + 1);
      };
      initCache();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Khi page hoặc filter thay đổi từ user action, update URL
  useEffect(() => {
      // Tránh push trùng URL gây thêm history entry không cần thiết
    const currentPageInUrl = Number(searchParams.get('page')) || 1;
    const currentYearInUrl = searchParams.get('year') || 'All';
    const currentCategoryInUrl = searchParams.get('category') || 'All';
    const currentCountryInUrl = searchParams.get('country') || 'All';
    
    if (currentPageInUrl === page && 
        String(currentYearInUrl) === String(selectedYear) &&
        currentCategoryInUrl === selectedCategory &&
        currentCountryInUrl === selectedCountry) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(page));
    params.set('year', String(selectedYear));
    params.set('category', String(selectedCategory));
    params.set('country', String(selectedCountry));
    
    // Sử dụng push thay vì replace để tạo history entries
    router.push(`?${params.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, selectedYear, selectedCategory, selectedCountry]);

  // Xử lý khi thay đổi filter
  useEffect(() => {
    // Chỉ reset khi filter thực sự thay đổi từ user action
    if (selectedYear !== urlYear || selectedCategory !== urlCategory || selectedCountry !== urlCountry) {
      setPage(1);
      // Fetch trang 1 ngay lập tức nếu chưa có cache cho filter này
      const fetchFirstPage = async () => {
        if (!getCurrentFilterCache()[1]) {
          setLoading(true);
          try {
            const movies = await fetchMoviesPage(1);
            setCurrentFilterCache(1, movies);
            setCurrentFilterLoadedPages([1]);
          } catch {
            setCurrentFilterCache(1, []);
            setCurrentFilterLoadedPages([1]);
          }
          setLoading(false);
          // Prefetch các trang tiếp theo
          loadNext10Pages(2);
        }
      };
      fetchFirstPage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, selectedCategory, selectedCountry]);

  // Compute years dynamically from movies
  const currentYear = new Date().getFullYear();
  const years = useMemo(() => {
    const yearArr = [];
    for (let y = currentYear; y >= 2000; y--) {
      yearArr.push(y);
    }
    return ['All', ...yearArr];
  }, [currentYear]);

  // Categories for movies
  const categories = useMemo(() => [
    'All',
    'Action',
    'Adventure',
    'Animation',
    'Comedy',
    'Crime',
    'Documentary',
    'Drama',
    'Family',
    'Fantasy',
    'History',
    'Horror',
    'Music',
    'Mystery',
    'Romance',
    'Science Fiction',
    'TV Movie',
    'Thriller',
    'War',
    'Western'
  ], []);

  // Countries for movies
  const countries = useMemo(() => [
    'All',
    'USA',
    'Japan',
    'Korea',
    'China',
    'India',
    'France',
    'Germany',
    'Spain',
    'Italy',
    'Brazil',
    'Russia',
    'Egypt',
    'Thailand',
    'Vietnam',
    'Indonesia',
    'Malaysia',
    'Philippines',
    'Myanmar',
    'Cambodia',
    'Laos'
  ], []);

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
    if (selectedCategory !== 'All') {
      // Sử dụng genre ID thay vì tên genre
      const genreMap: { [key: string]: number } = {
        'Action': 28,
        'Adventure': 12,
        'Animation': 16,
        'Comedy': 35,
        'Crime': 80,
        'Documentary': 99,
        'Drama': 18,
        'Family': 10751,
        'Fantasy': 14,
        'History': 36,
        'Horror': 27,
        'Music': 10402,
        'Mystery': 9648,
        'Romance': 10749,
        'Science Fiction': 878,
        'TV Movie': 10770,
        'Thriller': 53,
        'War': 10752,
        'Western': 37
      };
      const genreId = genreMap[selectedCategory];
      if (genreId) {
        url += `&with_genres=${genreId}`;
      }
    }
    if (selectedCountry !== 'All') {
      // Sử dụng language code thay vì tên quốc gia
      const countryToLanguageMap: { [key: string]: string } = {
        'USA': 'en',
        'Japan': 'ja',
        'Korea': 'ko',
        'China': 'zh',
        'India': 'hi',
        'France': 'fr',
        'Germany': 'de',
        'Spain': 'es',
        'Italy': 'it',
        'Brazil': 'pt',
        'Russia': 'ru',
        'Egypt': 'ar',
        'Thailand': 'th',
        'Vietnam': 'vi',
        'Indonesia': 'id',
        'Malaysia': 'ms',
        'Philippines': 'tl',
        'Myanmar': 'my',
        'Cambodia': 'km',
        'Laos': 'lo'
      };
      const languageCode = countryToLanguageMap[selectedCountry];
      if (languageCode) {
        url += `&with_original_language=${languageCode}`;
      }
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
      if (getCurrentFilterCache()[page]) return;
      setLoading(true);
      try {
        const movies = await fetchMoviesPage(page);
        if (!ignore) {
          setCurrentFilterCache(page, movies);
          const currentPages = getCurrentFilterLoadedPages();
          const newPages = currentPages.includes(page) ? currentPages : [...currentPages, page].sort((a, b) => a - b);
          setCurrentFilterLoadedPages(newPages);
        }
      } catch {
        if (!ignore) setCurrentFilterCache(page, []);
      }
      if (!ignore) setLoading(false);
    }
    loadPage();
    return () => { ignore = true; }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, selectedYear, selectedCategory, selectedCountry, API_KEY]);

  // Hàm load thêm 10 trang tiếp theo (khi bấm vào 1 trong 2 trang kế tiếp)
  const loadNext10Pages = async (startPage: number) => {
    const promises = [];
    for (let p = startPage; p < startPage + 10; p++) {
      if (!getCurrentFilterCache()[p]) {
        promises.push(fetchMoviesPage(p).then(movies => ({ p, movies })));
      }
    }
    
    if (promises.length > 0) {
      setLoading(true);
      const results = await Promise.all(promises);
      results.forEach(({ p, movies }) => {
        setCurrentFilterCache(p, movies);
      });
      
      const currentPages = getCurrentFilterLoadedPages();
      const newPages = [...currentPages];
      for (let p = startPage; p < startPage + 10; p++) {
        if (!newPages.includes(p)) newPages.push(p);
      }
      setCurrentFilterLoadedPages(newPages.sort((a, b) => a - b));
      setLoading(false);
    }
  }

  // Lấy phim của trang hiện tại
  const pagedMovies = getCurrentFilterCache()[page] || [];

  // Animation variants for grid items
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  // Xác định maxLoadedPage
  const maxLoadedPage = getCurrentFilterLoadedPages().length > 0 ? Math.max(...getCurrentFilterLoadedPages()) : 1;

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

  // Xử lý khi thay đổi filter
  const handleYearChange = (year: string | number) => {
    setSelectedYear(year);
    // Reset page về 1 khi thay đổi filter
    setPage(1);
    // Clear cache nếu cần thiết để tiết kiệm memory
    if (Object.keys(pagesCache).length > 10) {
      const currentFilterKey = getCurrentFilterKey();
      const newCache = { [currentFilterKey]: pagesCache[currentFilterKey] || {} };
      setPagesCache(newCache);
    }
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setPage(1);
    // Clear cache nếu cần thiết để tiết kiệm memory
    if (Object.keys(pagesCache).length > 10) {
      const currentFilterKey = getCurrentFilterKey();
      const newCache = { [currentFilterKey]: pagesCache[currentFilterKey] || {} };
      setPagesCache(newCache);
    }
  };

  const handleCountryChange = (country: string) => {
    setSelectedCountry(country);
    setPage(1);
    // Clear cache nếu cần thiết để tiết kiệm memory
    if (Object.keys(pagesCache).length > 10) {
      const currentFilterKey = getCurrentFilterKey();
      const newCache = { [currentFilterKey]: pagesCache[currentFilterKey] || {} };
      setPagesCache(newCache);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-2 md:px-4">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-6 md:mb-8 bg-gradient-to-r from-red-500 to-blue-500 text-transparent bg-clip-text text-center px-2"
        >
          All Movies
        </motion.h1>
        
        {/* Filter Icon */}
        <div className="flex justify-center mb-6 md:mb-8 px-2 md:px-4">
          <FilterIcon
            selectedYear={selectedYear}
            selectedCategory={selectedCategory}
            selectedCountry={selectedCountry}
            onYearChange={handleYearChange}
            onCategoryChange={handleCategoryChange}
            onCountryChange={handleCountryChange}
            years={years}
            categories={categories}
            countries={countries}
          />
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
              key={`${getCurrentFilterKey()}-${page}`}
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
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-3 lg:gap-4 xl:gap-6 px-2 md:px-0"
            >
              {/* Sửa điều kiện: chỉ hiện No movies found khi !loading, cache đã có key cho page hiện tại và không có phim */}
              {!loading && getCurrentFilterCache().hasOwnProperty(page) && pagedMovies.length === 0 && (
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
                   <Link key={movie.id} href={`/movies/${movie.id}?page=${page}&year=${selectedYear}&category=${selectedCategory}&country=${selectedCountry}`} className="block">
                     <div className="border border-gray-700 rounded-lg overflow-hidden relative group bg-gray-800 hover:bg-gray-700 transition-colors duration-200">
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
                        <div className="p-2 md:p-3 bg-gray-900">
                          <h3 className="text-white font-semibold text-xs md:text-sm mb-1 md:mb-2 truncate leading-tight">
                            {movie.title}
                          </h3>
                          
                          {/* Date and Country */}
                          <div className="flex items-center justify-between text-[10px] md:text-xs text-gray-400">
                            <span className="truncate">
                              {movie.release_date ? new Date(movie.release_date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              }) : 'TBA'}
                            </span>
                            <span className="truncate ml-1">{movie.country}</span>
                          </div>
                        </div>
                     </div>
                   </Link>
                 </motion.div>
               ))}
            </motion.div>
          </AnimatePresence>
        )}
        {!loading && getCurrentFilterLoadedPages().length > 0 && (
          <div className="max-w-7xl mx-auto px-2 md:px-4 pb-8 md:pb-12">
            <Pagination
              currentPage={page}
              loadedPages={getCurrentFilterLoadedPages()}
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
