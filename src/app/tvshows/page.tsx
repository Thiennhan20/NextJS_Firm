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
  const [isRolling, setIsRolling] = useState(false)
  const [showThoughtBubble, setShowThoughtBubble] = useState(true)
  const [thoughtText, setThoughtText] = useState("Bored of old shows?\nTry random! 🎲")
  const [pageInput, setPageInput] = useState<string>(String(urlPage))

  
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
    setPageInput(String(p));
    
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

  // Sync page input when page changes due to URL/back/forward
  useEffect(() => {
    setPageInput(String(page));
  }, [page]);

  const submitPageInput = () => {
    const target = parseInt(pageInput || '1', 10);
    if (!isNaN(target) && target > 0) {
      handlePageChange(target);
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
  };

  // Random filter function
  const handleRandomFilter = () => {
    setIsRolling(true);
    setShowThoughtBubble(false); // Hide thought bubble when rolling
    
    // Random selection
    const randomYear = years[Math.floor(Math.random() * years.length)];
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const randomCountry = countries[Math.floor(Math.random() * countries.length)];
    
    // Apply random filters
    setSelectedYear(randomYear);
    setSelectedCategory(randomCategory);
    setSelectedCountry(randomCountry);
    setPage(1);
    
    // Stop rolling animation after delay
    setTimeout(() => {
      setIsRolling(false);
    }, 1000);
  };

  // Auto-show thought bubble after 5 seconds
  useEffect(() => {
    if (!showThoughtBubble) {
      const timer = setTimeout(() => {
        setShowThoughtBubble(true);
        // Change thought text randomly
        const thoughts = [
          "Bored of old shows?\nTry random! 🎲",
          "Don't know what\nto watch? 🎯",
          "Any show is fine,\ngo random! 🚀",
          "Out of ideas?\nTry random! 💡",
          "Test your luck\nwith random! 🍀"
        ];
        setThoughtText(thoughts[Math.floor(Math.random() * thoughts.length)]);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [showThoughtBubble]);



  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-2 md:px-4 pt-4 md:pt-6">

        
        {/* Filter and Dice Layout */}
        <div className="flex items-center justify-between gap-1 sm:gap-2 md:gap-4 mb-6 md:mb-8 px-2 md:px-4">
          {/* Filter Icon - Left Side */}
          <div className="flex-1 min-w-0">
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
          
          {/* Dice Button with Thought Bubble - Right Side */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {/* Thought Bubble */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: showThoughtBubble ? 1 : 0,
                scale: showThoughtBubble ? 1 : 0.8
              }}
              transition={{ duration: 0.3 }}
              className="relative"
            >
              {/* Bubble */}
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-1.5 py-0.5 shadow-lg">
                <span className="text-white text-[10px] sm:text-xs font-medium leading-tight whitespace-pre-line">
                  {thoughtText}
                </span>
              </div>
              
              {/* Arrow pointing to dice */}
              <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-0 h-0 border-l-[4px] sm:border-l-[6px] border-l-white/20 border-t-[3px] sm:border-t-[4px] border-t-transparent border-b-[3px] sm:border-b-[4px] border-b-transparent"></div>
            </motion.div>
            
            <motion.button
              onClick={handleRandomFilter}
              className="group relative p-2 sm:p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
            >
              <motion.div
                animate={{ rotate: isRolling ? 360 : 0 }}
                transition={{ 
                  duration: isRolling ? 0.8 : 0.3,
                  ease: "easeInOut"
                }}
                className="text-lg sm:text-xl md:text-2xl"
              >
                🎲
              </motion.div>
            </motion.button>
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
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-3 lg:gap-4 xl:gap-6 px-2 md:px-0"
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
                    <div className="border border-gray-700 rounded-lg overflow-hidden relative group bg-gray-800 hover:bg-gray-700 transition-colors duration-200">
                      {/* Poster Image with fixed frame and fallback */}
                      <div className="relative w-full h-[240px] md:h-[300px] lg:h-[360px] overflow-hidden bg-gray-900">
                        <Image
                          src={(tvShow.image && tvShow.image.length > 0) ? tvShow.image : '/window.svg'}
                          alt={tvShow.name}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                          className="object-cover"
                          priority={false}
                        />
                      </div>

                      {/* TV Show Info */}
                      <div className="p-2 md:p-3 bg-gray-900">
                        <div className="flex items-start justify-between mb-1 md:mb-2">
                          <h3 className="text-white font-semibold text-xs md:text-sm truncate leading-tight">
                            {tvShow.name}
                          </h3>
                        </div>
                        
                        {/* Date and Country */}
                        <div className="flex items-center justify-between text-[10px] md:text-xs text-gray-400">
                          <span className="truncate">
                            {tvShow.first_air_date ? new Date(tvShow.first_air_date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            }) : 'TBA'}
                          </span>
                          <span className="truncate ml-1">{tvShow.country}</span>
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
            {/* Go to page input */}
            <div className="mt-4 flex flex-col items-center gap-2">
              <span className="text-sm text-gray-400">Go to Page</span>
              <div className="flex items-center gap-2 px-2">
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') submitPageInput(); }}
                  className="w-20 rounded-lg bg-gray-800 text-white border border-gray-700 px-3 py-2 text-base text-center focus:outline-none focus:ring-2 focus:ring-red-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="Page"
                  style={{ fontSize: '16px' }}
                />
                <button
                  onClick={submitPageInput}
                  className="rounded-lg bg-red-600 text-white px-4 py-2 text-sm font-medium hover:bg-red-700 transition-colors"
                >
                  Go
                </button>
              </div>
            </div>
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