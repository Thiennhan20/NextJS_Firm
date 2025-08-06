'use client'

import { motion, useScroll, useTransform, MotionValue } from 'framer-motion'
import { useEffect, useState, useRef, ReactNode } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import useAuthStore from '@/store/useAuthStore'
import TrendingMovies from '@/components/TrendingMovies'
import MovieCard from '@/components/MovieCard'
import { 
  PlayIcon, 
  UserIcon, 
  FilmIcon, 
  SparklesIcon,
  TvIcon,
  CodeBracketIcon,
  VideoCameraIcon,
  CubeTransparentIcon,
  StarIcon,
  HeartIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import FeatureCard from '@/components/common/FeatureCard'
import { MorphingIcon } from '@/components/common/MorphingIcon'

// --- INTERFACES ---
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
}

interface Particle {
  x: number;
  y: number;
  size: number;
  duration: number;
}

// --- CUSTOM HOOKS ---
const useResponsiveColumnCount = (config: { base: number; md?: number; lg?: number }) => {
  const [count, setCount] = useState(config.lg || config.md || config.base);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const getCount = () => {
      if (config.lg && window.matchMedia(`(min-width: 1024px)`).matches) {
        return config.lg;
      }
      if (config.md && window.matchMedia(`(min-width: 768px)`).matches) {
        return config.md;
      }
      return config.base;
    };

    const handleResize = () => setCount(getCount());

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial count

    return () => window.removeEventListener('resize', handleResize);
  }, [config]);

  return count;
};

// --- STATUS GENERATION FUNCTION ---
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
  
  // Trường hợp Full HD/CAM: phim mới xuất hiện dưới 2 tuần
  if (timeDiffInWeeks < 2) return 'Full HD/CAM';
  
  // Trường hợp Full HD: phim đã xuất hiện hơn 2 tuần
  return 'Full HD';
};

// --- REUSABLE COMPONENTS ---
const ScrollRevealItem = ({ children, index, columnCount, scrollProgress }: { children: ReactNode, index: number, columnCount: number, scrollProgress: MotionValue<number> }) => {
  const column = index % columnCount;
  const isLeft = column === 0;
  const isRight = column === columnCount - 1;
  const isCenter = !isLeft && !isRight;

  // Improved morphing effect with better timing
  const x = useTransform(
    scrollProgress,
    [0, 0.2, 0.8, 1],
    isLeft ? ['-120%', '0%', '0%', '-120%'] : isRight ? ['120%', '0%', '0%', '120%'] : ['0%', '0%', '0%', '0%']
  );
  
  const opacity = useTransform(scrollProgress, [0, 0.15, 0.85, 1], [0, 1, 1, 0]);
  
  const scale = useTransform(
    scrollProgress,
    [0, 0.2, 0.8, 1],
    isCenter ? [0.3, 1, 1, 0.3] : [0.7, 1, 1, 0.7]
  );

  const y = useTransform(
    scrollProgress,
    [0, 0.2, 0.8, 1],
    [50, 0, 0, -50]
  );
  
  return (
    <motion.div 
      style={{ x, opacity, scale, y }} 
      className="h-full w-full"
      initial={{ opacity: 0, scale: 0.8, y: 50 }}
      whileInView={{ 
        opacity: 1, 
        scale: 1, 
        y: 0,
        transition: {
          duration: 0.8,
          ease: "easeOut",
          delay: index * 0.1
        }
      }}
      viewport={{ once: false, margin: "-10% 0px -10% 0px" }}
    >
      {children}
    </motion.div>
  );
};

// Original morphing effect for Redefining Entertainment section
const OriginalScrollRevealItem = ({ children, index, columnCount, scrollProgress }: { children: ReactNode, index: number, columnCount: number, scrollProgress: MotionValue<number> }) => {
  const column = index % columnCount;
  const isLeft = column === 0;
  const isRight = column === columnCount - 1;
  const isCenter = !isLeft && !isRight;

  const x = useTransform(
    scrollProgress,
    [0.1, 0.4, 0.6, 0.9],
    isLeft ? ['-100%', '0%', '0%', '-100%'] : isRight ? ['100%', '0%', '0%', '100%'] : ['0%', '0%', '0%', '0%']
  );
  
  const opacity = useTransform(scrollProgress, [0.1, 0.4, 0.6, 0.9], [0, 1, 1, 0]);
  
  const scale = useTransform(
    scrollProgress,
    [0.1, 0.4, 0.6, 0.9],
    isCenter ? [0.6, 1, 1, 0.6] : [0.9, 1, 1, 0.9]
  );
  
  return (
    <motion.div style={{ x, opacity, scale }} className="h-full">
      {children}
    </motion.div>
  );
};


export default function Home() {
  const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
  const [featuredMovies, setFeaturedMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [lastFetchDate, setLastFetchDate] = useState<string>('');
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  
  // --- REFS & SCROLL ---
  const heroRef = useRef<HTMLElement>(null)
  const featuresRef = useRef<HTMLElement>(null)
  const moviesRef = useRef<HTMLElement>(null)

  const { scrollY } = useScroll()
  const heroY = useTransform(scrollY, [0, 800], [0, -200])
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0])
  
  const { scrollYProgress: featuresScrollProgress } = useScroll({ 
    target: featuresRef, 
    offset: ["start end", "end start"]
  });
  const { scrollYProgress: moviesScrollProgress } = useScroll({ 
    target: moviesRef, 
    offset: ["start end", "end start"]
  });

  const featuresColumnCount = useResponsiveColumnCount({ base: 1, md: 2, lg: 3 });
  const moviesColumnCount = useResponsiveColumnCount({ base: 2, md: 3, lg: 3 });


  useEffect(() => {
    const newParticles = Array.from({ length: 50 }).map(() => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      duration: Math.random() * 20 + 10,
    }));
    setParticles(newParticles);

    const fetchMovies = async () => {
      setLoading(true);
      try {
        // Get upcoming movies from current date
        const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        const upcomingResponse = await axios.get(`https://api.themoviedb.org/3/movie/upcoming?api_key=${API_KEY}&page=1&region=US`);
        
        const processMovies = (movies: Movie[]) => movies.map((movie: Movie) => ({
          id: movie.id,
          title: movie.title,
          year: movie.release_date ? Number(movie.release_date.slice(0, 4)) : 0,
          image: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '',
          backdrop: movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : '',
          genre: [],
          release_date: movie.release_date || '',
          status: generateMovieStatus(movie.release_date),
        }));

        // Filter for Coming Soon movies and take first 12
        const processedUpcoming = processMovies(upcomingResponse.data.results)
          .filter((movie: ProcessedMovie) => movie.status === 'Coming Soon')
          .slice(0, 12)
          .map((movie: ProcessedMovie) => ({
            ...movie,
            poster_path: movie.image ? movie.image.replace('https://image.tmdb.org/t/p/w500', '') : '',
            release_date: movie.release_date || '',
          }));
        
        setFeaturedMovies(processedUpcoming as unknown as Movie[]);
        setLastFetchDate(currentDate);
      } catch (error) {
        console.error(error);
        setFeaturedMovies([]);
      }
      setLoading(false);
    };
    fetchMovies();
  }, [API_KEY]);

  // Check for daily updates
  useEffect(() => {
    const checkForDailyUpdate = () => {
      const currentDate = new Date().toISOString().split('T')[0];
      if (lastFetchDate && lastFetchDate !== currentDate) {
        // Date has changed, refetch movies
        const fetchMovies = async () => {
          setLoading(true);
          try {
            const upcomingResponse = await axios.get(`https://api.themoviedb.org/3/movie/upcoming?api_key=${API_KEY}&page=1&region=US`);
            
            const processMovies = (movies: Movie[]) => movies.map((movie: Movie) => ({
              id: movie.id,
              title: movie.title,
              year: movie.release_date ? Number(movie.release_date.slice(0, 4)) : 0,
              image: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '',
              backdrop: movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : '',
              genre: [],
              release_date: movie.release_date || '',
              status: generateMovieStatus(movie.release_date),
            }));

            const processedUpcoming = processMovies(upcomingResponse.data.results)
              .filter((movie: ProcessedMovie) => movie.status === 'Coming Soon')
              .slice(0, 12)
              .map((movie: ProcessedMovie) => ({
                ...movie,
                poster_path: movie.image ? movie.image.replace('https://image.tmdb.org/t/p/w500', '') : '',
                release_date: movie.release_date || '',
              }));
            
            setFeaturedMovies(processedUpcoming as unknown as Movie[]);
            setLastFetchDate(currentDate);
          } catch (error) {
            console.error(error);
          }
          setLoading(false);
        };
        fetchMovies();
      }
    };

    // Check every hour for date changes
    const interval = setInterval(checkForDailyUpdate, 60 * 60 * 1000); // 1 hour

    return () => clearInterval(interval);
  }, [lastFetchDate, API_KEY]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-black text-white">
      {/* Background Particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {particles.map((p, i) => (
          <motion.div
            key={i}
            className="absolute bg-purple-400/30 rounded-full"
            animate={{
              x: [0, 50, 0],
              y: [0, 50, 0],
              scale: [1, 1.5, 1],
            }}
            transition={{ 
              duration: p.duration, 
              repeat: Infinity, 
              repeatType: "reverse",
              ease: "easeInOut"
            }}
            style={{ 
              left: `${p.x}%`, 
              top: `${p.y}%`, 
              width: p.size, 
              height: p.size 
            }}
          />
        ))}
      </div>

      {/* Hero Section */}
      <motion.section 
        ref={heroRef}
        style={{ y: heroY, opacity: heroOpacity }}
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
      >
        <motion.div 
          className="absolute inset-0"
          animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
          transition={{ duration: 20, repeat: Infinity, repeatType: "mirror" }}
          style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #8b5cf620 0%, transparent 40%), radial-gradient(circle at 80% 30%, #ef444420 0%, transparent 40%)"}}
        />
        <div className="relative z-10 text-center px-4 max-w-6xl mx-auto">
          {/* ... Hero Content ... */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 mb-6">
            <div className="hidden sm:block">
              <MorphingIcon direction="left" />
            </div>
            <div className="flex flex-col items-center">
              <h1 className="text-4xl sm:text-5xl lg:text-7xl xl:text-8xl font-black leading-tight text-center">
                <motion.span
                  animate={{ backgroundPosition: ["0% 50%", "100% 50%"]}}
                  transition={{ duration: 4, repeat: Infinity, repeatType: "mirror" }}
                  className="bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-300% text-transparent bg-clip-text"
                  style={{ backgroundSize: "300% 300%" }}
                >
                  Entertainment Galaxy
                </motion.span>
              </h1>
              {/* Mobile MorphingIcon */}
              <div className="sm:hidden mt-4">
                <MorphingIcon direction="left" />
              </div>
            </div>
            <div className="hidden sm:block">
              <MorphingIcon direction="right" />
            </div>
          </div>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <motion.button
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 20px 40px rgba(239, 68, 68, 0.4)",
                }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                className="group relative px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg text-lg font-bold shadow-2xl"
                onClick={() => router.push('/movies')}
              >
                <div className="flex items-center gap-3">
                  <PlayIcon className="w-6 h-6" />
                  <span>Explore Now</span>
                </div>
              </motion.button>
              {!isAuthenticated ? (
                <motion.button
                  whileHover={{
                    scale: 1.05,
                    boxShadow: "0 20px 40px rgba(168, 85, 247, 0.4)",
                  }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  className="group px-8 py-4 bg-transparent border-2 border-purple-400 text-purple-400 rounded-lg text-lg font-bold hover:bg-purple-400/10"
                  onClick={() => router.push('/login')}
                >
                  <div className="flex items-center gap-3">
                    <UserIcon className="w-6 h-6" />
                    <span>Sign In</span>
                  </div>
                </motion.button>
              ) : (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg text-lg font-bold flex items-center gap-3"
                >
                  <UserIcon className="w-6 h-6" />
                  <span>Hello, {user?.name || 'User'}! 👋</span>
                </motion.div>
              )}
            </div>
        </div>
        {/* Floating Icons */}
        {[
          { icon: <FilmIcon className="w-16 h-16 text-purple-400" />, top: "20%", left: "10%", duration: 20 },
          { icon: <SparklesIcon className="w-20 h-20 text-red-400" />, bottom: "20%", right: "10%", duration: 15 },
          { icon: <VideoCameraIcon className="w-12 h-12 text-blue-400" />, top: "15%", right: "20%", duration: 25 },
          { icon: <CubeTransparentIcon className="w-14 h-14 text-pink-400" />, bottom: "15%", left: "20%", duration: 18 },
        ].map((item, index) => (
          <motion.div
            key={index}
            animate={{ y: ["0%", "5%", "-5%", "0%"]}}
            transition={{ duration: item.duration, repeat: Infinity, ease: "linear", repeatType: "mirror" }}
            className="absolute opacity-20"
            style={{ top: item.top, bottom: item.bottom, left: item.left, right: item.right }}
          >
            {item.icon}
          </motion.div>
        ))}
      </motion.section>

      {/* Features Section */}
      <section ref={featuresRef} className="py-12 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-8 sm:mb-16 lg:mb-20 px-4">
            <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 text-transparent bg-clip-text leading-tight">
              Redefining Entertainment
            </h2>
            <p className="text-sm sm:text-lg lg:text-xl xl:text-2xl text-gray-300 max-w-4xl mx-auto">
              Built with cutting-edge technology for an unparalleled viewing experience.
            </p>
        </div>
        <div className="max-w-7xl mx-auto grid grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-10 lg:gap-12">
            {[
              { icon: <TvIcon className="w-10 h-10" />, title: "4K Streaming", description: "NULL", color: "purple" },
              { icon: <CodeBracketIcon className="w-10 h-10" />, title: "Gaming Hub", description: "NULL", color: "red" },
              { icon: <SparklesIcon className="w-10 h-10" />, title: "AI Smart", description: "NULL", color: "blue" }
            ].map((feature, index) => (
              <OriginalScrollRevealItem key={index} index={index} columnCount={featuresColumnCount} scrollProgress={featuresScrollProgress}>
                  <FeatureCard
                    icon={feature.icon}
                    title={feature.title}
                    description={feature.description}
                    color={feature.color as "purple" | "red" | "blue"}
                  />
              </OriginalScrollRevealItem>
            ))}
        </div>
      </section>

      {/* Trending Movies Section */}
      <TrendingMovies />

      {/* Coming Soon Movies Section */}
      <section ref={moviesRef} className="py-8 sm:py-12 lg:py-20 px-4 sm:px-6 lg:px-8 relative">
         <div className="text-center mb-8 sm:mb-12 lg:mb-16 px-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-6 bg-gradient-to-r from-yellow-400 to-orange-400 text-transparent bg-clip-text leading-tight">
              Coming Soon
            </h2>
            <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-gray-400 max-w-3xl mx-auto">Exciting new releases coming to theaters and streaming platforms.</p>
          </div>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
              />
            </div>
          ) : (
            <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {featuredMovies.map((movie, index) => (
                <ScrollRevealItem key={movie.id} index={index} columnCount={moviesColumnCount} scrollProgress={moviesScrollProgress}>
                  <MovieCard 
                    {...movie} 
                    image={movie.image ?? ''} 
                    year={movie.year ?? 0} 
                    genre={Array.isArray(movie.genre) ? movie.genre : [movie.genre ?? '']} 
                    status={movie.status}
                  />
                </ScrollRevealItem>
              ))}
            </div>
          )}
      </section>

       {/* Call to Action Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <motion.div
            className="absolute inset-0"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 40, repeat: Infinity, repeatType: "mirror" }}
            style={{ backgroundImage: "radial-gradient(circle at 30% 20%, rgba(139, 92, 246, 0.2) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(239, 68, 68, 0.2) 0%, transparent 50%)"}}
        />
        <div className="max-w-5xl mx-auto text-center relative z-10 px-4">
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="bg-black/40 backdrop-blur-xl rounded-3xl p-8 sm:p-12 border border-white/10"
            >
              <motion.h2 
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-300% text-transparent bg-clip-text leading-tight"
                style={{ backgroundSize: "300% 300%" }}
              >
                Coming Soon
              </motion.h2>
              
              <motion.p 
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="text-lg text-gray-300 mb-8"
              >
                Something extraordinary is brewing in our galaxy...
              </motion.p>

              {/* Simple Feature Icons */}
              <div className="flex justify-center gap-8 mb-8">
                {[
                  { icon: <SparklesIcon className="w-8 h-8" />, color: "text-purple-400" },
                  { icon: <StarIcon className="w-8 h-8" />, color: "text-yellow-400" },
                  { icon: <HeartIcon className="w-8 h-8" />, color: "text-red-400" },
                  { icon: <EyeIcon className="w-8 h-8" />, color: "text-blue-400" }
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    animate={{ 
                      rotate: [0, 360],
                      scale: [1, 1.2, 1]
                    }}
                    transition={{ 
                      rotate: { duration: 6, repeat: Infinity, ease: "linear" },
                      scale: { duration: 2, delay: index * 0.5, repeat: Infinity, repeatType: "mirror" }
                    }}
                    className={item.color}
                  >
                    {item.icon}
                  </motion.div>
                ))}
              </div>

            </motion.div>
        </div>
      </section>
    </main>
  )
}