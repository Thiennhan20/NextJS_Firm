'use client'

import { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import axios from 'axios'
import Link from 'next/link'

interface Movie {
  id: number;
  title: string;
  poster_path: string;
  vote_average?: number;
  release_date?: string;
  image?: string;
  year?: number;
  genre?: string;
  backdrop_path?: string;
  status?: 'Full HD' | 'Full HD/CAM' | 'Coming Soon' | 'Non';
  original_language?: string;
}

interface ProcessedMovie {
  id: number;
  title: string;
  year: number;
  image: string;
  backdrop: string;
  genre: never[];
  release_date?: string;
  status?: 'Full HD' | 'Full HD/CAM' | 'Coming Soon' | 'Non';
  original_language?: string;
  type: 'movie';
}

interface TVShow {
  id: number;
  name: string;
  poster_path: string;
  first_air_date?: string;
  original_language?: string;
  backdrop_path?: string;
}

interface TVShowDetail {
  id: number;
  name: string;
  poster_path: string;
  first_air_date?: string;
  original_language?: string;
  backdrop_path?: string;
  seasons?: Array<{
    id: number;
    name: string;
    poster_path?: string;
    air_date?: string;
    season_number: number;
  }>;
}

interface ProcessedTVShow {
  id: number;
  name: string;
  year: number;
  image: string;
  backdrop: string;
  genre: never[];
  first_air_date?: string;
  status?: 'Full HD' | 'Full HD/CAM' | 'Coming Soon' | 'Non';
  original_language?: string;
  type: 'tv';
}

type ContentItem = ProcessedMovie | ProcessedTVShow;

export default function ComingSoonMovies() {
  const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
  const [featuredContent, setFeaturedContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastFetchDate, setLastFetchDate] = useState<string>('');
  const [canScrollLeftComingSoon, setCanScrollLeftComingSoon] = useState(false);
  const [canScrollRightComingSoon, setCanScrollRightComingSoon] = useState(false);
  const comingSoonScrollRef = useRef<HTMLDivElement>(null);

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

  // --- STATUS GENERATION FUNCTION ---
  const generateMovieStatus = (releaseDate?: string): 'Full HD' | 'Full HD/CAM' | 'Coming Soon' | 'Non' => {
    if (!releaseDate) return 'Coming Soon';
    
    const releaseDateObj = new Date(releaseDate);
    const currentDate = new Date();
    const releaseYear = releaseDateObj.getFullYear();
    
    // Trường hợp Non: phim từ 1990 trở về quá khứ
    if (releaseYear < 1990) return 'Non';
    
    // Tính khoảng cách thời gian giữa ngày hiện tại và ngày phát hành (tính bằng tháng)
    const timeDiffInMs = releaseDateObj.getTime() - currentDate.getTime();
    const timeDiffInMonths = timeDiffInMs / (1000 * 60 * 60 * 24 * 30.44); // 30.44 ngày = 1 tháng
    
    // Trường hợp Coming Soon: phim sẽ phát hành từ 1 tháng trở đi (giảm từ 2 xuống 1)
    if (timeDiffInMonths >= 1) return 'Coming Soon';
    
    // Trường hợp Full HD/CAM: phim mới xuất hiện dưới 1 tháng
    if (timeDiffInMonths >= 0 && timeDiffInMonths < 1) return 'Full HD/CAM';
    
    // Trường hợp Full HD: phim đã xuất hiện (quá khứ)
    return 'Full HD';
  };

  // --- TV SHOW STATUS GENERATION FUNCTION ---
  const generateTVShowStatus = (firstAirDate?: string): 'Full HD' | 'Full HD/CAM' | 'Coming Soon' | 'Non' => {
    if (!firstAirDate) return 'Coming Soon';
    
    const firstAirDateObj = new Date(firstAirDate);
    const currentDate = new Date();
    const firstAirYear = firstAirDateObj.getFullYear();
    
    // Trường hợp Non: TV show từ 1990 trở về quá khứ
    if (firstAirYear < 1990) return 'Non';
    
    // Tính khoảng cách thời gian giữa ngày hiện tại và ngày phát sóng đầu tiên (tính bằng tháng)
    const timeDiffInMs = firstAirDateObj.getTime() - currentDate.getTime();
    const timeDiffInMonths = timeDiffInMs / (1000 * 60 * 60 * 24 * 30.44); // 30.44 ngày = 1 tháng
    
    // Trường hợp Coming Soon: TV show sẽ phát sóng từ 1 tháng trở đi (giảm từ 2 xuống 1)
    if (timeDiffInMonths >= 1) return 'Coming Soon';
    
    // Trường hợp Full HD/CAM: TV show mới xuất hiện dưới 1 tháng
    if (timeDiffInMonths >= 0 && timeDiffInMonths < 1) return 'Full HD/CAM';
    
    // Trường hợp Full HD: TV show đã xuất hiện (quá khứ)
    return 'Full HD';
  };

  // Check scroll position for Coming Soon section
  const checkComingSoonScrollPosition = () => {
    if (comingSoonScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = comingSoonScrollRef.current;
      setCanScrollLeftComingSoon(scrollLeft > 0);
      setCanScrollRightComingSoon(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  // Scroll functions for Coming Soon section
  const scrollComingSoonLeft = () => {
    if (comingSoonScrollRef.current) {
      comingSoonScrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollComingSoonRight = () => {
    if (comingSoonScrollRef.current) {
      comingSoonScrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  // Fetch content on component mount
  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      try {
        const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        
        // Fetch upcoming movies and popular TV shows
        const [upcomingResponse, popularTVResponse] = await Promise.all([
          axios.get(`https://api.themoviedb.org/3/movie/upcoming?api_key=${API_KEY}&page=1&region=US`),
          axios.get(`https://api.themoviedb.org/3/tv/popular?api_key=${API_KEY}&page=1`)
        ]);

        // Fetch detailed TV show information including latest season
        const tvShowDetails = await Promise.all(
          popularTVResponse.data.results.slice(0, 20).map(async (tvShow: TVShow) => {
            try {
              const detailResponse = await axios.get(`https://api.themoviedb.org/3/tv/${tvShow.id}?api_key=${API_KEY}&append_to_response=seasons`);
              return detailResponse.data;
            } catch (error) {
              console.error(`Error fetching TV show details for ${tvShow.id}:`, error);
              return null;
            }
          })
        );

        // Filter out failed requests
        const validTVShowDetails = tvShowDetails.filter(detail => detail !== null);
        
        // Process movies
        const processMovies = (movies: Movie[]) => movies.map((movie: Movie) => ({
          id: movie.id,
          title: movie.title,
          year: movie.release_date ? Number(movie.release_date.slice(0, 4)) : 0,
          image: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '',
          backdrop: movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : '',
          genre: [],
          release_date: movie.release_date || '',
          status: generateMovieStatus(movie.release_date),
          original_language: movie.original_language || 'en',
          type: 'movie' as const,
        }));

        // Process TV shows with latest season information
        const processTVShows = (tvShowDetails: TVShowDetail[]) => tvShowDetails.map((tvShow: TVShowDetail) => {
          // Find the latest season with air date
          const latestSeason = tvShow.seasons
            ?.filter(season => season.air_date)
            ?.sort((a, b) => {
              if (!a.air_date || !b.air_date) return 0;
              return new Date(b.air_date).getTime() - new Date(a.air_date).getTime();
            })[0];

          // Use latest season info if available, otherwise fall back to show info
          const posterPath = latestSeason?.poster_path || tvShow.poster_path;
          const airDate = latestSeason?.air_date || tvShow.first_air_date;
          const seasonName = latestSeason ? `${tvShow.name} - S${latestSeason.season_number}` : tvShow.name;

          return {
            id: tvShow.id,
            name: seasonName,
            year: airDate ? Number(airDate.slice(0, 4)) : 0,
            image: posterPath ? `https://image.tmdb.org/t/p/w500${posterPath}` : '',
            backdrop: tvShow.backdrop_path ? `https://image.tmdb.org/t/p/w1280${tvShow.backdrop_path}` : '',
            genre: [],
            first_air_date: airDate || '',
            status: generateTVShowStatus(airDate),
            original_language: tvShow.original_language || 'en',
            type: 'tv' as const,
          };
        });

        // Filter for Coming Soon content from 2025 onwards
        const upcomingMovies = processMovies(upcomingResponse.data.results)
          .filter((movie: ProcessedMovie) => 
            movie.status === 'Coming Soon' && 
            movie.year >= 2025
          );

        const comingSoonTVShows = processTVShows(validTVShowDetails)
          .filter((tvShow: ProcessedTVShow) => 
            tvShow.status === 'Coming Soon' && 
            tvShow.year >= 2025
          );



        // Logic mới: Luôn cố gắng có 5 TV shows và 10 movies
        let finalContent = [];
        
        // 1. Lấy TV shows trước (ưu tiên 5 items)
        let selectedTVShows = comingSoonTVShows.slice(0, 5);
        
        // 2. Nếu không đủ 5 TV shows Coming Soon, tìm thêm từ các tháng xa hơn
        if (selectedTVShows.length < 5) {
          const allTVShows = processTVShows(validTVShowDetails);
          const availableTVShows = allTVShows
            .filter(tvShow => tvShow.status !== 'Non' && tvShow.year >= 2025)
            .sort((a, b) => {
              if (!a.first_air_date || !b.first_air_date) return 0;
              return new Date(a.first_air_date).getTime() - new Date(b.first_air_date).getTime();
            });
          
          // Lấy thêm TV shows cho đủ 5
          const additionalTVShows = availableTVShows
            .filter(tvShow => !selectedTVShows.some(selected => selected.id === tvShow.id))
            .slice(0, 5 - selectedTVShows.length);
          
          selectedTVShows = [...selectedTVShows, ...additionalTVShows];
        }
        
        // 3. Lấy movies để bù vào phần còn lại
        const remainingSlots = 15 - selectedTVShows.length;
        let selectedMovies = upcomingMovies.slice(0, remainingSlots);
        
        // 4. Nếu không đủ movies Coming Soon, lấy thêm từ các status khác
        if (selectedMovies.length < remainingSlots) {
          const allMovies = processMovies(upcomingResponse.data.results);
          const availableMovies = allMovies
            .filter(movie => movie.status !== 'Non' && movie.year >= 2025)
            .sort((a, b) => {
              if (!a.release_date || !b.release_date) return 0;
              return new Date(a.release_date).getTime() - new Date(b.release_date).getTime();
            });
          
          // Lấy thêm movies cho đủ slots còn lại
          const additionalMovies = availableMovies
            .filter(movie => !selectedMovies.some(selected => selected.id === movie.id))
            .slice(0, remainingSlots - selectedMovies.length);
          
          selectedMovies = [...selectedMovies, ...additionalMovies];
        }
        
        // 5. Kết hợp và xáo trộn
        finalContent = [...selectedMovies, ...selectedTVShows];
        const shuffledContent = finalContent.sort(() => Math.random() - 0.5);
        

        
        setFeaturedContent(shuffledContent);
        setLastFetchDate(currentDate);
      } catch (error) {
        console.error(error);
        setFeaturedContent([]);
      }
      setLoading(false);
    };
    fetchContent();
  }, [API_KEY]);

  // Check for daily updates
  useEffect(() => {
    const checkForDailyUpdate = () => {
      const currentDate = new Date().toISOString().split('T')[0];
      if (lastFetchDate && lastFetchDate !== currentDate) {
        // Date has changed, refetch content
        const fetchContent = async () => {
          setLoading(true);
          try {
            const [upcomingResponse, popularTVResponse] = await Promise.all([
              axios.get(`https://api.themoviedb.org/3/movie/upcoming?api_key=${API_KEY}&page=1&region=US`),
              axios.get(`https://api.themoviedb.org/3/tv/popular?api_key=${API_KEY}&page=1`)
            ]);

            // Fetch detailed TV show information including latest season
            const tvShowDetails = await Promise.all(
              popularTVResponse.data.results.slice(0, 20).map(async (tvShow: TVShow) => {
                try {
                  const detailResponse = await axios.get(`https://api.themoviedb.org/3/tv/${tvShow.id}?api_key=${API_KEY}&append_to_response=seasons`);
                  return detailResponse.data;
                } catch (error) {
                  console.error(`Error fetching TV show details for ${tvShow.id}:`, error);
                  return null;
                }
              })
            );

            // Filter out failed requests
            const validTVShowDetails = tvShowDetails.filter(detail => detail !== null);
            
            // Process movies
            const processMovies = (movies: Movie[]) => movies.map((movie: Movie) => ({
              id: movie.id,
              title: movie.title,
              year: movie.release_date ? Number(movie.release_date.slice(0, 4)) : 0,
              image: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '',
              backdrop: movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : '',
              genre: [],
              release_date: movie.release_date || '',
              status: generateMovieStatus(movie.release_date),
              original_language: movie.original_language || 'en',
              type: 'movie' as const,
            }));

            // Process TV shows with latest season information
            const processTVShows = (tvShowDetails: TVShowDetail[]) => tvShowDetails.map((tvShow: TVShowDetail) => {
              // Find the latest season with air date
              const latestSeason = tvShow.seasons
                ?.filter(season => season.air_date)
                ?.sort((a, b) => {
                  if (!a.air_date || !b.air_date) return 0;
                  return new Date(b.air_date).getTime() - new Date(a.air_date).getTime();
                })[0];

              // Use latest season info if available, otherwise fall back to show info
              const posterPath = latestSeason?.poster_path || tvShow.poster_path;
              const airDate = latestSeason?.air_date || tvShow.first_air_date;
              const seasonName = latestSeason ? `${tvShow.name} - S${latestSeason.season_number}` : tvShow.name;

              return {
                id: tvShow.id,
                name: seasonName,
                year: airDate ? Number(airDate.slice(0, 4)) : 0,
                image: posterPath ? `https://image.tmdb.org/t/p/w500${posterPath}` : '',
                backdrop: tvShow.backdrop_path ? `https://image.tmdb.org/t/p/w1280${tvShow.backdrop_path}` : '',
                genre: [],
                first_air_date: airDate || '',
                status: generateTVShowStatus(airDate),
                original_language: tvShow.original_language || 'en',
                type: 'tv' as const,
              };
            });

            // Filter for Coming Soon content from 2025 onwards
            const upcomingMovies = processMovies(upcomingResponse.data.results)
              .filter((movie: ProcessedMovie) => 
                movie.status === 'Coming Soon' && 
                movie.year >= 2025
              );

            const comingSoonTVShows = processTVShows(validTVShowDetails)
              .filter((tvShow: ProcessedTVShow) => 
                tvShow.status === 'Coming Soon' && 
                tvShow.year >= 2025
              );



            // Logic mới: Luôn cố gắng có 5 TV shows và 10 movies
            let finalContent = [];
            
            // 1. Lấy TV shows trước (ưu tiên 5 items)
            let selectedTVShows = comingSoonTVShows.slice(0, 5);
            
            // 2. Nếu không đủ 5 TV shows Coming Soon, tìm thêm từ các tháng xa hơn
            if (selectedTVShows.length < 5) {
              const allTVShows = processTVShows(validTVShowDetails);
              const availableTVShows = allTVShows
                .filter(tvShow => tvShow.status !== 'Non' && tvShow.year >= 2025)
                .sort((a, b) => {
                  if (!a.first_air_date || !b.first_air_date) return 0;
                  return new Date(a.first_air_date).getTime() - new Date(b.first_air_date).getTime();
                });
              
              // Lấy thêm TV shows cho đủ 5
              const additionalTVShows = availableTVShows
                .filter(tvShow => !selectedTVShows.some(selected => selected.id === tvShow.id))
                .slice(0, 5 - selectedTVShows.length);
              
              selectedTVShows = [...selectedTVShows, ...additionalTVShows];
            }
            
            // 3. Lấy movies để bù vào phần còn lại
            const remainingSlots = 15 - selectedTVShows.length;
            let selectedMovies = upcomingMovies.slice(0, remainingSlots);
            
            // 4. Nếu không đủ movies Coming Soon, lấy thêm từ các status khác
            if (selectedMovies.length < remainingSlots) {
              const allMovies = processMovies(upcomingResponse.data.results);
              const availableMovies = allMovies
                .filter(movie => movie.status !== 'Non' && movie.year >= 2025)
                .sort((a, b) => {
                  if (!a.release_date || !b.release_date) return 0;
                  return new Date(a.release_date).getTime() - new Date(b.release_date).getTime();
                });
              
              // Lấy thêm movies cho đủ slots còn lại
              const additionalMovies = availableMovies
                .filter(movie => !selectedMovies.some(selected => selected.id === movie.id))
                .slice(0, remainingSlots - selectedMovies.length);
              
              selectedMovies = [...selectedMovies, ...additionalMovies];
            }
            
            // 5. Kết hợp và xáo trộn
            finalContent = [...selectedMovies, ...selectedTVShows];
            const shuffledContent = finalContent.sort(() => Math.random() - 0.5);
            

            
            setFeaturedContent(shuffledContent);
            setLastFetchDate(currentDate);
          } catch (error) {
            console.error(error);
          }
          setLoading(false);
        };
        fetchContent();
      }
    };

    const interval = setInterval(checkForDailyUpdate, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [API_KEY, lastFetchDate]);

  // Add scroll event listeners
  useEffect(() => {
    const scrollContainer = comingSoonScrollRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', checkComingSoonScrollPosition);
      scrollContainer.addEventListener('resize', checkComingSoonScrollPosition);
      
      return () => {
        scrollContainer.removeEventListener('scroll', checkComingSoonScrollPosition);
        scrollContainer.removeEventListener('resize', checkComingSoonScrollPosition);
      };
    }
  }, []);

  // Add wheel event listener for horizontal scrolling
  useEffect(() => {
    const scrollContainer = comingSoonScrollRef.current;
    if (scrollContainer) {
      const handleWheel = (e: WheelEvent) => {
        if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
          e.preventDefault();
          scrollContainer.scrollLeft += e.deltaY;
        }
      };

      scrollContainer.addEventListener('wheel', handleWheel, { passive: false });
      return () => scrollContainer.removeEventListener('wheel', handleWheel);
    }
  }, []);

  return (
    <section className="py-8 sm:py-12 md:py-16 px-2 sm:px-4 bg-gradient-to-b from-gray-900 to-black">
      <div className="max-w-7xl mx-auto">
                 <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold mb-4 sm:mb-6 md:mb-8 bg-gradient-to-r from-yellow-400 to-pink-500 text-transparent bg-clip-text text-center leading-tight px-4">
           What&apos;s Next
         </h2>
        <div className="relative">
          {/* Fade left */}
          <div className="pointer-events-none absolute left-0 top-0 h-full w-8 z-10 bg-gradient-to-r from-black/90 to-transparent" />
          {/* Fade right */}
          <div className="pointer-events-none absolute right-0 top-0 h-full w-8 z-10 bg-gradient-to-l from-black/90 to-transparent" />
          
          {/* Navigation arrows */}
          <motion.button
            onClick={scrollComingSoonLeft}
            className={`absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/70 text-white hover:bg-black/90 transition-all duration-200 ${
              canScrollLeftComingSoon ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </motion.button>
          
          <motion.button
            onClick={scrollComingSoonRight}
            className={`absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/70 text-white hover:bg-black/90 transition-all duration-200 ${
              canScrollRightComingSoon ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </motion.button>
        
          {/* Scroll indicator */}
          <div className={`absolute -bottom-2 sm:-bottom-4 md:-bottom-8 left-1/2 transform -translate-x-1/2 z-20 transition-opacity duration-300 ${
            canScrollLeftComingSoon ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}>
            <div className="flex items-center space-x-1 sm:space-x-2 text-white/60">
              <svg className="w-3 h-3 sm:w-4 sm:h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-xs sm:text-sm font-medium">Swipe or click &lt; &gt;</span>
              <svg className="w-3 h-3 sm:w-4 sm:h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
          
          <div
            ref={comingSoonScrollRef}
            className="flex gap-6 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory relative horizontal-scroll-container"
            style={{ 
              WebkitOverflowScrolling: 'touch', 
              scrollbarWidth: 'none', 
              msOverflowStyle: 'none',
              scrollBehavior: 'smooth'
            }}
          >
                         {loading ? (
               <div className="text-gray-400 text-center py-8">Loading...</div>
             ) : (
               featuredContent.map((item) => (
                 <Link 
                   key={item.id} 
                   href={item.type === 'tv' ? `/tvshows/${item.id}` : `/movies/${item.id}`} 
                   className="min-w-[180px] sm:min-w-[220px] md:min-w-[260px] max-w-[260px]"
                 >
                   <motion.div
                     whileHover={{ scale: 1.07 }}
                     className="bg-gray-800 rounded-xl overflow-hidden shadow-lg snap-center cursor-pointer group relative"
                   >
                     {item.image ? (
                       <Image
                         src={item.image}
                         alt={item.type === 'tv' ? item.name : item.title}
                         width={400}
                         height={600}
                         className="w-full h-56 sm:h-72 object-cover group-hover:scale-105 transition-transform duration-300"
                       />
                     ) : (
                       <div className="w-full h-56 sm:h-72 flex items-center justify-center bg-gray-700 text-3xl sm:text-4xl">🎬</div>
                     )}
                     {/* Status badge - top left */}
                     <div className="absolute top-3 left-3 bg-yellow-500/90 px-2 py-1 rounded-full text-xs text-white font-bold">
                       Coming Soon
                     </div>
                                           {/* Type badge - top right */}
                      <div className="absolute top-3 right-3 bg-black/70 px-2 py-1 rounded-full text-xs text-white font-bold">
                        {item.type === 'tv' ? '📺 Season' : '🎬 Movie'}
                      </div>
                     <div className="p-3 sm:p-4">
                       <div className="font-semibold text-base sm:text-lg text-white mb-1 truncate">
                         {item.type === 'tv' ? item.name : item.title}
                       </div>
                       
                       {/* Date and Country */}
                       <div className="flex items-center justify-between text-gray-400 text-xs sm:text-sm">
                         <span className="truncate">
                           {item.type === 'tv' 
                             ? (item.first_air_date ? new Date(item.first_air_date).toLocaleDateString('en-US', {
                                 year: 'numeric',
                                 month: 'short',
                                 day: 'numeric'
                               }) : item.year)
                             : (item.release_date ? new Date(item.release_date).toLocaleDateString('en-US', {
                                 year: 'numeric',
                                 month: 'short',
                                 day: 'numeric'
                               }) : item.year)
                           }
                         </span>
                         <span className="truncate ml-1">
                           {getCountryName(item.original_language)}
                         </span>
                       </div>
                     </div>
                   </motion.div>
                 </Link>
               ))
             )}
          </div>
        </div>
      </div>
    </section>
  )
}
