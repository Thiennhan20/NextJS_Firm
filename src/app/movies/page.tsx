'use client'

import { useState, useEffect, useMemo } from 'react'
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
  rating?: number;
  year?: number;
  genre?: string;
}

// Type for TMDB API movie response
interface TMDBMovie {
  id: number;
  title: string;
  poster_path: string;
  vote_average: number;
  release_date?: string;
}

function MoviesPageContent() {
  const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPage = Number(searchParams.get('page')) || 1;
  const [selectedYear, setSelectedYear] = useState<string | number>('All')
  const [page, setPage] = useState(initialPage)
  const [loading, setLoading] = useState(false)
  // Cache các trang đã load: { [page]: Movie[] }
  const [pagesCache, setPagesCache] = useState<{ [page: number]: Movie[] }>({})
  // Lưu các trang đã load
  const [loadedPages, setLoadedPages] = useState<number[]>([initialPage])

  // Khi page thay đổi, update URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(page));
    router.replace(`?${params.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    setPage(1);
    setPagesCache({});
    setLoadedPages([1]);
    // Fetch trang 1 ngay lập tức
    const fetchFirstPage = async () => {
      setLoading(true);
      try {
        const movies = await fetchMoviesPage(1);
        setPagesCache({ 1: movies });
        setLoadedPages([1]);
      } catch {
        setPagesCache({ 1: [] });
        setLoadedPages([1]);
      }
      setLoading(false);
      // Prefetch các trang tiếp theo
      loadNext10Pages(2);
    };
    fetchFirstPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear]);

  // Compute years dynamically from movies
  const currentYear = new Date().getFullYear();
  const years = useMemo(() => {
    const yearArr = [];
    for (let y = currentYear; y >= 2020; y--) {
      yearArr.push(y);
    }
    return ['All', ...yearArr];
  }, [currentYear]);

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
      rating: movie.vote_average,
      year: movie.release_date ? Number(movie.release_date.slice(0, 4)) : '',
      image: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '',
      genre: [],
    }))
    return fetchedMovies
  }

  // Khi page thay đổi, nếu chưa có trong cache thì fetch
  useEffect(() => {
    let ignore = false;
    const loadPage = async () => {
      if (pagesCache[page]) return;
      setLoading(true);
      try {
        const movies = await fetchMoviesPage(page);
        if (!ignore) {
          setPagesCache(prev => ({ ...prev, [page]: movies }));
          setLoadedPages(prev => prev.includes(page) ? prev : [...prev, page].sort((a, b) => a - b));
        }
      } catch {
        if (!ignore) setPagesCache(prev => ({ ...prev, [page]: [] }));
      }
      if (!ignore) setLoading(false);
    }
    loadPage();
    return () => { ignore = true; }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, API_KEY, selectedYear]);

  // Hàm load thêm 10 trang tiếp theo (khi bấm vào 1 trong 2 trang kế tiếp)
  const loadNext10Pages = async (startPage: number) => {
    setLoading(true);
    const promises = [];
    for (let p = startPage; p < startPage + 10; p++) {
      if (!pagesCache[p]) {
        promises.push(fetchMoviesPage(p).then(movies => ({ p, movies })));
      }
    }
    const results = await Promise.all(promises);
    setPagesCache(prev => {
      const newCache = { ...prev };
      results.forEach(({ p, movies }) => {
        newCache[p] = movies;
      });
      return newCache;
    });
    setLoadedPages(prev => {
      const newPages = [...prev];
      for (let p = startPage; p < startPage + 10; p++) {
        if (!newPages.includes(p)) newPages.push(p);
      }
      return newPages.sort((a, b) => a - b);
    });
    setLoading(false);
  }

  // Lấy phim của trang hiện tại
  const pagedMovies = pagesCache[page] || [];

  // Animation variants for grid items
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  // Xác định maxLoadedPage
  const maxLoadedPage = loadedPages.length > 0 ? Math.max(...loadedPages) : 1;

  // Xử lý khi đổi trang
  const handlePageChange = (p: number) => {
    if (p < 1) return;
    // Nếu bấm vào trang cuối cùng đã load, tự động load tiếp 10 trang mới
    if (p === maxLoadedPage) {
      loadNext10Pages(maxLoadedPage + 1).then(() => setPage(p));
    } else if (p === maxLoadedPage + 1 || p === maxLoadedPage + 2) {
      loadNext10Pages(maxLoadedPage + 1).then(() => setPage(p));
    } else {
      setPage(p);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
              <div className="relative">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value === 'All' ? 'All' : Number(e.target.value))}
                  className="appearance-none px-4 py-2 rounded-full bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer pr-8"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
                {/* Custom dropdown arrow */}
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 dado-gray-400">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
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
              key={page}
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
              {!loading && pagesCache.hasOwnProperty(page) && pagedMovies.length === 0 && (
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
                  <Link key={movie.id} href={`/movies/${movie.id}?page=${page}`} className="block">
                    <div className="border rounded-lg ">
                      <Image
                        src={movie.image ?? ''}
                        alt={movie.title}
                        width={500}
                        height={750}
                        className="w-full"
                      />
                      <p className="p-2 text-center text-white">{movie.title}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
        {!loading && loadedPages.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 pb-12">
            <Pagination
              currentPage={page}
              loadedPages={loadedPages}
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