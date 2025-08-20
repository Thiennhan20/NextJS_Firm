'use client'

import { motion, useScroll, useTransform, MotionValue } from 'framer-motion'
import { useEffect, useState, useRef, ReactNode } from 'react'
// axios import removed as it's not used
import { useRouter } from 'next/navigation'
// Image import removed as it's not used
// Link import removed as it's not used
import useAuthStore from '@/store/useAuthStore'
import TrendingMovies from '@/components/TrendingMovies'
import ComingSoonMovies from '@/components/ComingSoonMovies'
// MovieCard import removed as it's not used
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
// Movie interface removed as it's not used



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



  

// --- REUSABLE COMPONENTS ---
// ScrollRevealItem component removed as it's not used

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
  // API_KEY removed as it's not used
  const [particles, setParticles] = useState<Particle[]>([]);

 
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  
  // --- REFS & SCROLL ---
  const heroRef = useRef<HTMLElement>(null)
  const featuresRef = useRef<HTMLElement>(null)
  // moviesRef removed as it's not used


  const { scrollY } = useScroll()
  const heroY = useTransform(scrollY, [0, 800], [0, -200])
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0])
  
  const { scrollYProgress: featuresScrollProgress } = useScroll({ 
    target: featuresRef, 
    offset: ["start end", "end start"]
  });
  // moviesScrollProgress removed as it's not used

  const featuresColumnCount = useResponsiveColumnCount({ base: 1, md: 2, lg: 3 });
  // moviesColumnCount removed as it's not used






  useEffect(() => {
    const newParticles = Array.from({ length: 50 }).map(() => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      duration: Math.random() * 20 + 10,
    }));
    setParticles(newParticles);


  }, []);

  // Check scroll position for Coming Soon section on mount and scroll






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
      <ComingSoonMovies />

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