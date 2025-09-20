'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { 
  SparklesIcon,
  StarIcon,
  HeartIcon,
  EyeIcon
} from '@heroicons/react/24/outline'

// Lazy load heavy components
const HeroMovies = dynamic(() => import('@/components/HeroMovies'), {
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
    </div>
  )
});

const TrendingMovies = dynamic(() => import('@/components/TrendingMovies'), {
  loading: () => (
    <div className="py-8 flex items-center justify-center">
      <div className="animate-pulse bg-gray-800 rounded-lg h-64 w-full max-w-7xl"></div>
    </div>
  )
});

const ComingSoonMovies = dynamic(() => import('@/components/ComingSoonMovies'), {
  loading: () => (
    <div className="py-8 flex items-center justify-center">
      <div className="animate-pulse bg-gray-800 rounded-lg h-64 w-full max-w-7xl"></div>
    </div>
  )
});

const EntertainmentFrames = dynamic(() => import('@/components/EntertainmentFrames'), {
  loading: () => (
    <div className="py-8 flex items-center justify-center">
      <div className="animate-pulse bg-gray-800 rounded-lg h-96 w-full max-w-6xl"></div>
    </div>
  )
});

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
            size: Math.random() * 1.5 + 0.5, // Smaller particles
            duration: Math.random() * 10 + 6, // Shorter duration
          }));
          setParticles(newParticles);
        } else if (mobile && particles.length > 0) {
          setParticles([]); // Clear particles on mobile
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

      {/* Hero Movies Section */}
      <HeroMovies />

      {/* Entertainment Frames Section */}
      <EntertainmentFrames />

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