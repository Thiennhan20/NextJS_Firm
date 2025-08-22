'use client'

import { motion, useScroll, useTransform, MotionValue } from 'framer-motion'
import { useEffect, useState, useRef, ReactNode } from 'react'
import TrendingMovies from '@/components/TrendingMovies'
import ComingSoonMovies from '@/components/ComingSoonMovies'
import HeroMovies from '@/components/HeroMovies'
import { 
  SparklesIcon,
  TvIcon,
  CodeBracketIcon,
  StarIcon,
  HeartIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import FeatureCard from '@/components/common/FeatureCard'

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

  // --- REFS & SCROLL ---
  const featuresRef = useRef<HTMLElement>(null)

  const { scrollYProgress: featuresScrollProgress } = useScroll({ 
    target: featuresRef, 
    offset: ["start end", "end start"]
  });

  const featuresColumnCount = useResponsiveColumnCount({ base: 1, md: 2, lg: 3 });






  useEffect(() => {
    const newParticles = Array.from({ length: 50 }).map(() => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      duration: Math.random() * 20 + 10,
    }));
    setParticles(newParticles);


  }, []);








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

      {/* Hero Movies Section */}
      <HeroMovies />

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