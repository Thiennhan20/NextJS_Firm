'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Pagination from '@/components/Pagination'
import axios from 'axios'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Suspense } from 'react'

// Định nghĩa kiểu TVShow rõ ràng
interface TVShow {
  id: number;
  name: string;
  poster_path: string;
  image?: string;
  year?: number;
  genre?: string;
  first_air_date?: string;
  country?: string;
  status?: 'Full HD' | 'Full HD/CAM' | 'Coming Soon' | 'Non';
  totalSeasons?: number;
  totalEpisodes?: number;
}

// Type for TMDB API TV response
interface TMDBTV {
  id: number;
  name: string;
  poster_path: string;
  vote_average: number;
  first_air_date?: string;
  original_language?: string;
  number_of_seasons?: number;
  number_of_episodes?: number;
  genre_ids?: number[];
}

function TVShowsPageContent() {
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
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false)
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false)
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false)
  
  // Cache các trang đã load: { [filterKey]: { [page]: TVShow[] } }
  const [pagesCache, setPagesCache] = useState<{ [filterKey: string]: { [page: number]: TVShow[] } }>({})
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

  const setCurrentFilterCache = (page: number, tvShows: TVShow[]) => {
    const filterKey = getCurrentFilterKey();
    setPagesCache(prev => ({
      ...prev,
      [filterKey]: {
        ...prev[filterKey],
        [page]: tvShows
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
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.year-dropdown-container')) {
        setIsYearDropdownOpen(false);
      }
      if (!target.closest('.category-dropdown-container')) {
        setIsCategoryDropdownOpen(false);
      }
      if (!target.closest('.country-dropdown-container')) {
        setIsCountryDropdownOpen(false);
      }
    };

    if (isYearDropdownOpen || isCategoryDropdownOpen || isCountryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isYearDropdownOpen, isCategoryDropdownOpen, isCountryDropdownOpen]);

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
          const tvShows = await fetchTVShowsPage(urlPage);
          setCurrentFilterCache(urlPage, tvShows);
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
            const tvShows = await fetchTVShowsPage(1);
            setCurrentFilterCache(1, tvShows);
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

  // Compute years dynamically from tvshows
  const currentYear = new Date().getFullYear();
  const years = useMemo(() => {
    const yearArr = [];
    for (let y = currentYear; y >= 2000; y--) {
      yearArr.push(y);
    }
    return ['All', ...yearArr];
  }, [currentYear]);

  // Categories for TV shows
  const categories = useMemo(() => [
    'All',
    'Action & Adventure',
    'Animation',
    'Comedy',
    'Crime',
    'Documentary',
    'Drama',
    'Family',
    'Kids',
    'Mystery',
    'News',
    'Reality',
    'Sci-Fi & Fantasy',
    'Soap',
    'Talk',
    'War & Politics',
    'Western'
  ], []);

  // Countries for TV shows
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

  // Hàm tạo status cho TV show dựa trên ngày phát hành
  const generateTVShowStatus = (firstAirDate?: string): 'Full HD' | 'Full HD/CAM' | 'Coming Soon' | 'Non' => {
    if (!firstAirDate) return 'Coming Soon';
    
    const firstAirDateObj = new Date(firstAirDate);
    const currentDate = new Date();
    const firstAirYear = firstAirDateObj.getFullYear();
    
    // Trường hợp Non: TV show từ 1990 trở về quá khứ
    if (firstAirYear < 1990) return 'Non';
    
    // Tính khoảng cách thời gian giữa ngày hiện tại và ngày phát hành (tính bằng tuần)
    const timeDiffInMs = currentDate.getTime() - firstAirDateObj.getTime();
    const timeDiffInWeeks = timeDiffInMs / (1000 * 60 * 60 * 24 * 7);
    
    // Trường hợp Coming Soon: TV show chưa phát hành (trước thời điểm hiện tại)
    if (timeDiffInWeeks < 0) return 'Coming Soon';
    
    // Trường hợp Full HD/CAM: TV show mới xuất hiện dưới 1 tháng (4 tuần)
    if (timeDiffInWeeks < 4) return 'Full HD/CAM';
    
    // Trường hợp Full HD: TV show đã xuất hiện hơn 1 tháng (4 tuần)
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

  // Hàm fetch 1 trang TV shows
  const fetchTVShowsPage = async (pageToFetch: number) => {
    let url = `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&sort_by=popularity.desc&page=${pageToFetch}`;
    if (selectedYear !== 'All') {
      url += `&first_air_date_year=${selectedYear}`;
    }
    if (selectedCategory !== 'All') {
      // Sử dụng genre ID thay vì tên genre
      const genreMap: { [key: string]: number } = {
        'Action & Adventure': 10759,
        'Animation': 16,
        'Comedy': 35,
        'Crime': 80,
        'Documentary': 99,
        'Drama': 18,
        'Family': 10751,
        'Kids': 10762,
        'Mystery': 9648,
        'News': 10763,
        'Reality': 10764,
        'Sci-Fi & Fantasy': 10765,
        'Soap': 10766,
        'Talk': 10767,
        'War & Politics': 10768,
        'Western': 37
      };
      const genreId = genreMap[selectedCategory];
      if (genreId) {
        url += `&with_genres=${genreId}`;
      }
    }
    if (selectedCountry !== 'All') {
      // Sử dụng country code thay vì tên quốc gia
      const countryToCodeMap: { [key: string]: string } = {
        'USA': 'US',
        'Japan': 'JP',
        'Korea': 'KR',
        'China': 'CN',
        'India': 'IN',
        'France': 'FR',
        'Germany': 'DE',
        'Spain': 'ES',
        'Italy': 'IT',
        'Brazil': 'BR',
        'Russia': 'RU',
        'Egypt': 'EG',
        'Thailand': 'TH',
        'Vietnam': 'VN',
        'Indonesia': 'ID',
        'Malaysia': 'MY',
        'Philippines': 'PH',
        'Myanmar': 'MM',
        'Cambodia': 'KH',
        'Laos': 'LA'
      };
      const countryCode = countryToCodeMap[selectedCountry];
      if (countryCode) {
        url += `&with_origin_country=${countryCode}`;
      }
    }
    const response = await axios.get(url);
    const fetchedTVShows = response.data.results;
    
    return fetchedTVShows.map((tvShow: TMDBTV) => ({
      id: tvShow.id,
      name: tvShow.name,
      year: tvShow.first_air_date ? Number(tvShow.first_air_date.slice(0, 4)) : '',
      image: tvShow.poster_path ? `https://image.tmdb.org/t/p/w500${tvShow.poster_path}` : '',
      genre: [],
      first_air_date: tvShow.first_air_date,
      country: getCountryName(tvShow.original_language),
      status: generateTVShowStatus(tvShow.first_air_date),
      totalSeasons: tvShow.number_of_seasons || 0,
      totalEpisodes: tvShow.number_of_episodes || 0
    }));
  }

  // Khi page thay đổi, nếu chưa có trong cache thì fetch
  useEffect(() => {
    let ignore = false;
    const loadPage = async () => {
      if (getCurrentFilterCache()[page]) return;
      setLoading(true);
      try {
        const tvShows = await fetchTVShowsPage(page);
        if (!ignore) {
          setCurrentFilterCache(page, tvShows);
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
        promises.push(fetchTVShowsPage(p).then(tvShows => ({ p, tvShows })));
      }
    }
    
    if (promises.length > 0) {
      setLoading(true);
      const results = await Promise.all(promises);
      results.forEach(({ p, tvShows }) => {
        setCurrentFilterCache(p, tvShows);
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

  // Lấy TV shows của trang hiện tại
  const pagedTVShows = getCurrentFilterCache()[page] || [];

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
    // Reset page về 1 khi thay đổi năm
    setPage(1);
    // Clear cache cho filter cũ nếu cần thiết để tiết kiệm memory
    if (Object.keys(pagesCache).length > 10) {
      const currentFilterKey = getCurrentFilterKey();
      const newCache = { [currentFilterKey]: pagesCache[currentFilterKey] || {} };
      setPagesCache(newCache);
    }
  }

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setPage(1);
    if (Object.keys(pagesCache).length > 10) {
      const currentFilterKey = getCurrentFilterKey();
      const newCache = { [currentFilterKey]: pagesCache[currentFilterKey] || {} };
      setPagesCache(newCache);
    }
  }

  const handleCountryChange = (country: string) => {
    setSelectedCountry(country);
    setPage(1);
    if (Object.keys(pagesCache).length > 10) {
      const currentFilterKey = getCurrentFilterKey();
      const newCache = { [currentFilterKey]: pagesCache[currentFilterKey] || {} };
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
          All TV Shows
        </motion.h1>
        {/* Filter cho Year, Category và Country */}
        <div className="flex flex-col gap-4 mb-10">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4">
              {/* Year Filter */}
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

              {/* Category Filter */}
              <div className="relative category-dropdown-container">
                <button
                  onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
                >
                  <span className="font-medium text-sm">
                    {selectedCategory === 'All' ? 'All Categories' : selectedCategory}
                  </span>
                  <motion.svg 
                    className="w-4 h-4 text-gray-400"
                    animate={{ rotate: isCategoryDropdownOpen ? 180 : 0 }}
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
                  {isCategoryDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-0 mt-1 w-36 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-50 max-h-36 overflow-y-auto scrollbar-hide"
                    >
                      <div className="py-1">
                        {categories.map((category) => (
                          <button
                            key={category}
                            onClick={() => {
                              handleCategoryChange(category);
                              setIsCategoryDropdownOpen(false);
                            }}
                            className={`w-full px-2 py-1.5 text-left hover:bg-gray-700 transition-colors duration-150 text-sm ${
                              selectedCategory === category
                                ? 'bg-purple-600 text-white font-medium' 
                                : 'text-gray-300 hover:text-white'
                            }`}
                          >
                            {category === 'All' ? 'All Categories' : category}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Country Filter */}
              <div className="relative country-dropdown-container">
                <button
                  onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
                >
                  <span className="font-medium text-sm">
                    {selectedCountry === 'All' ? 'All Countries' : selectedCountry}
                  </span>
                  <motion.svg 
                    className="w-4 h-4 text-gray-400"
                    animate={{ rotate: isCountryDropdownOpen ? 180 : 0 }}
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
                  {isCountryDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-0 mt-1 w-28 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-50 max-h-36 overflow-y-auto scrollbar-hide"
                    >
                      <div className="py-1">
                        {countries.map((country) => (
                          <button
                            key={country}
                            onClick={() => {
                              handleCountryChange(country);
                              setIsCountryDropdownOpen(false);
                            }}
                            className={`w-full px-2 py-1.5 text-left hover:bg-gray-700 transition-colors duration-150 text-sm ${
                              selectedCountry === country
                                ? 'bg-purple-600 text-white font-medium' 
                                : 'text-gray-300 hover:text-white'
                            }`}
                          >
                            {country === 'All' ? 'All Countries' : country}
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
        {/* TV Shows Grid + Loading + Pagination */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
              className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full"
            />
            <p className="mt-4 text-gray-400 text-lg">Loading TV Shows...</p>
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
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6"
            >
              {/* Sửa điều kiện: chỉ hiện No TV shows found khi !loading, cache đã có key cho page hiện tại và không có TV show */}
              {!loading && getCurrentFilterCache().hasOwnProperty(page) && pagedTVShows.length === 0 && (
                <motion.div
                  key="no-tvshows"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="col-span-full text-center text-gray-400 py-12 text-xl"
                >
                  No TV shows found.
                </motion.div>
              )}
              {pagedTVShows.map((tvShow: TVShow) => (
                <motion.div
                  key={tvShow.id}
                  variants={itemVariants}
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                >
                  <Link key={tvShow.id} href={`/tvshows/${tvShow.id}?page=${page}&year=${selectedYear}&category=${selectedCategory}&country=${selectedCountry}&season=1`} className="block">
                    <div className="border rounded-lg overflow-hidden relative group">
                      {/* Poster Image */}
                      <div className="relative">
                        <Image
                          src={tvShow.image ?? ''}
                          alt={tvShow.name}
                          width={500}
                          height={750}
                          className="w-full"
                        />
                        
                        {/* Status Badge */}
                        <div className="absolute top-2 left-2">
                          <span className={`px-2 py-1 text-xs font-bold rounded-md ${
                            tvShow.status === 'Full HD' ? 'bg-green-500 text-white' :
                            tvShow.status === 'Full HD/CAM' ? 'bg-red-500 text-white' :
                            tvShow.status === 'Coming Soon' ? 'bg-yellow-500 text-black' :
                            tvShow.status === 'Non' ? 'bg-gray-500 text-white' :
                            'bg-yellow-500 text-black'
                          }`}>
                            {tvShow.status}
                          </span>
                        </div>
                      </div>

                      {/* TV Show Info */}
                      <div className="p-3 bg-gray-900">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-white font-semibold text-sm truncate">
                            {tvShow.name}
                          </h3>
                        </div>
                        
                        {/* Date and Country */}
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span>
                            {tvShow.first_air_date ? new Date(tvShow.first_air_date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            }) : 'TBA'}
                          </span>
                          <span>{tvShow.country}</span>
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
          <div className="max-w-7xl mx-auto px-4 pb-12">
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

export default function TVShowsPage() {
  return (
    <Suspense>
      <TVShowsPageContent />
    </Suspense>
  );
} 