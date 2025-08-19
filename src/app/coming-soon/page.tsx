'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function ComingSoon() {
  const [currentImage, setCurrentImage] = useState(0);
  
  // Array of movie posters for the coming soon section
  const comingSoonMovies = [
    {
      id: 1,
      title: "The Last Frontier",
      year: 2025,
      genre: "Sci-Fi",
      image: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400&h=600&fit=crop&crop=center"
    },
    {
      id: 2,
      title: "Neon Dreams",
      year: 2025,
      genre: "Cyberpunk",
      image: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop&crop=center"
    },
    {
      id: 3,
      title: "Quantum Echo",
      year: 2025,
      genre: "Thriller",
      image: "https://images.unsplash.com/photo-1489599849927-2ee23cede5ae?w=400&h=600&fit=crop&crop=center"
    },
    {
      id: 4,
      title: "Stellar Odyssey",
      year: 2025,
      genre: "Adventure",
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop&crop=center"
    },
    {
      id: 5,
      title: "Digital Mirage",
      year: 2025,
      genre: "Mystery",
      image: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop&crop=center"
    }
  ];

  // Auto-rotate through movies
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % comingSoonMovies.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [comingSoonMovies.length]);

  return (
    <section className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating geometric shapes */}
        <motion.div
          className="absolute top-20 left-10 w-32 h-32 border border-purple-500/20 rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-40 right-20 w-24 h-24 border border-blue-500/20 rounded-lg"
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
            opacity: [0.4, 0.7, 0.4]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-40 left-20 w-20 h-20 border border-pink-500/20"
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, 90, 180, 270, 360],
            opacity: [0.2, 0.5, 0.2]
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        {/* Particle effects */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 1, 0],
              scale: [0, 1, 0]
            }}
            transition={{
              duration: 4 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-16">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-center mb-16"
        >
          <motion.h1
            className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6"
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{
              background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #feca57, #ff9ff3, #54a0ff)',
              backgroundSize: '400% 400%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            MovieWorld
          </motion.h1>
          
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="text-2xl md:text-3xl lg:text-4xl font-semibold text-white mb-4"
          >
            Coming Soon
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed"
          >
            Embark on a cinematic journey through our upcoming blockbusters. 
            Get ready for an extraordinary movie experience that will transport you to new worlds.
          </motion.p>
        </motion.div>

        {/* Coming Soon Movies Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="w-full max-w-6xl mx-auto"
        >
          <h3 className="text-2xl md:text-3xl font-bold text-center text-white mb-8">
            Upcoming Releases
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {comingSoonMovies.map((movie, index) => (
              <motion.div
                key={movie.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.8 + index * 0.1, duration: 0.6 }}
                whileHover={{ 
                  scale: 1.05,
                  y: -10,
                  transition: { duration: 0.3 }
                }}
                className="group cursor-pointer"
              >
                <div className="relative bg-gray-800 rounded-xl overflow-hidden shadow-2xl border border-gray-700/50">
                  {/* Movie Poster */}
                  <div className="relative aspect-[2/3] overflow-hidden">
                    <motion.div
                      className="w-full h-full bg-cover bg-center"
                      style={{
                        backgroundImage: `url(${movie.image})`
                      }}
                      animate={{
                        scale: currentImage === index ? 1.1 : 1
                      }}
                      transition={{ duration: 0.5 }}
                    />
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {/* Coming Soon Badge */}
                    <div className="absolute top-3 left-3 bg-gradient-to-r from-yellow-500 to-orange-500 px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg">
                      Coming Soon
                    </div>
                    
                    {/* Hover Effect */}
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      whileHover={{ scale: 1.1 }}
                    >
                      <div className="w-16 h-16 bg-red-600/90 rounded-full flex items-center justify-center shadow-2xl">
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </motion.div>
                  </div>
                  
                  {/* Movie Info */}
                  <div className="p-4">
                    <h4 className="text-white font-semibold text-sm md:text-base mb-2 truncate group-hover:text-red-400 transition-colors">
                      {movie.title}
                    </h4>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>{movie.year}</span>
                      <span className="px-2 py-1 bg-red-600/20 text-red-400 rounded-full text-xs">
                        {movie.genre}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.5, duration: 1 }}
          className="text-center mt-16"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-bold py-4 px-8 rounded-full text-lg shadow-2xl hover:shadow-red-500/25 transition-all duration-300"
          >
            Get Notified
          </motion.button>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3, duration: 1 }}
            className="mt-6"
          >
            <Link 
              href="/"
              className="text-gray-400 hover:text-white transition-colors duration-300 text-sm md:text-base"
            >
              ← Back to Home
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}