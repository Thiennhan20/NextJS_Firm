'use client'

import { motion } from 'framer-motion'
import { useEffect, useState, lazy, Suspense } from 'react'
import { 
  SparklesIcon,
  StarIcon,
  HeartIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import LazySection from '@/components/common/LazySection'

// ONLY load HeroMovies immediately (above the fold)
import HeroMovies from '@/components/home/HeroMovies'

// Lazy load all other components with React.lazy (true code splitting)
const RecentlyWatchedMovies = lazy(() => import('@/components/home').then(m => ({ default: m.RecentlyWatched })))
const EntertainmentFrames = lazy(() => import('@/components/home').then(m => ({ default: m.EntertainmentFrames })))
const TrendingMovies = lazy(() => import('@/components/home').then(m => ({ default: m.TrendingMovies })))
const ComingSoonMovies = lazy(() => import('@/components/home').then(m => ({ default: m.ComingSoonMovies })))
const TopComments = lazy(() => import('@/components/home').then(m => ({ default: m.TopComments })))

// Skeleton loader
const SectionSkeleton = () => (
  <div className="py-8 px-4">
    <div className="max-w-7xl mx-auto">
      <div className="h-8 w-64 bg-gray-800 rounded-lg mb-6 mx-auto animate-pulse" />
      <div className="flex gap-4 overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="min-w-[200px] h-64 bg-gray-800 rounded-xl animate-pulse"
          />
        ))}
      </div>
    </div>
  </div>
)

interface Particle {
  x: number;
  y: number;
  size: number;
  duration: number;
}

export default function Home() {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect mobile device with debounce
    let resizeTimeout: NodeJS.Timeout;
    const checkMobile = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const mobile = window.innerWidth < 768;
        setIsMobile(mobile);
        
        // Only create particles on desktop and if not already created
        if (!mobile && particles.length === 0) {
          const newParticles = Array.from({ length: 8 }).map(() => ({
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 1.5 + 0.5,
            duration: Math.random() * 10 + 6,
          }));
          setParticles(newParticles);
        } else if (mobile && particles.length > 0) {
          setParticles([]);
        }
      }, 100);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      clearTimeout(resizeTimeout);
    };
  }, [particles.length]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-black text-white">
      {/* Background Particles - Only on desktop for better performance */}
      {!isMobile && particles.length > 0 && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          {particles.map((p, i) => (
            <div
              key={i}
              className="absolute bg-purple-400/30 rounded-full performance-particle"
              style={{ 
                left: `${p.x}%`, 
                top: `${p.y}%`, 
                width: p.size, 
                height: p.size,
                willChange: 'transform, opacity',
                animation: `particleFloat ${p.duration}s ease-in-out infinite alternate`
              }}
            />
          ))}
        </div>
      )}

      {/* Hero Movies Section - Load immediately (above the fold) */}
      <HeroMovies />

      {/* Recently Watched Movies Section - Lazy load when scrolling */}
      <LazySection rootMargin="400px" minHeight="300px">
        <Suspense fallback={<SectionSkeleton />}>
          <RecentlyWatchedMovies />
        </Suspense>
      </LazySection>

      {/* Entertainment Frames Section - Lazy load */}
      <LazySection rootMargin="400px" minHeight="500px">
        <Suspense fallback={<SectionSkeleton />}>
          <EntertainmentFrames />
        </Suspense>
      </LazySection>

      {/* Trending Movies Section - Lazy load */}
      <LazySection rootMargin="400px" minHeight="350px">
        <Suspense fallback={<SectionSkeleton />}>
          <div data-section="trending">
            <TrendingMovies />
          </div>
        </Suspense>
      </LazySection>

      {/* Coming Soon Movies Section - Lazy load */}
      <LazySection rootMargin="400px" minHeight="350px">
        <Suspense fallback={<SectionSkeleton />}>
          <ComingSoonMovies />
        </Suspense>
      </LazySection>

      {/* Top Comments Section - Lazy load */}
      <LazySection rootMargin="400px" minHeight="500px">
        <Suspense fallback={<SectionSkeleton />}>
          <TopComments />
        </Suspense>
      </LazySection>

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
