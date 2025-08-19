'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Hide splash screen after 2 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      // Wait for fade out animation to complete before calling onComplete
      setTimeout(() => {
        onComplete();
      }, 1000); // Reduced from 1200ms for smoother transition
    }, 2000);

    return () => {
      clearTimeout(timer);
    };
  }, [onComplete]);

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: [0.4, 0.0, 0.2, 1] }} // Optimized easing
          className="fixed inset-0 z-[9999] bg-gradient-to-br from-gray-900 via-blue-900 to-black flex items-center justify-center"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 9999
          }}
        >
          {/* Background decorative elements */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Floating geometric shapes */}
            <motion.div
              className="absolute top-20 left-10 w-32 h-32 border border-blue-500/20 rounded-full"
              animate={{
                scale: [1, 1.15, 1],
                rotate: [0, 180, 360],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{
                duration: 12,
                repeat: Infinity,
                ease: "easeInOut",
                times: [0, 0.5, 1]
              }}
            />
            <motion.div
              className="absolute top-40 right-20 w-24 h-24 border border-cyan-500/20 rounded-lg"
              animate={{
                scale: [1.1, 1, 1.1],
                rotate: [360, 180, 0],
                opacity: [0.4, 0.7, 0.4]
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: "easeInOut",
                times: [0, 0.5, 1]
              }}
            />
            <motion.div
              className="absolute bottom-40 left-20 w-20 h-20 border border-teal-500/20"
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 90, 180, 270, 360],
                opacity: [0.2, 0.5, 0.2]
              }}
              transition={{
                duration: 18,
                repeat: Infinity,
                ease: "linear",
                times: [0, 0.25, 0.5, 0.75, 1]
              }}
            />
            
            {/* Additional Entertainment Icons */}
            {/* Popcorn Icon - Top Left */}
            <motion.div
              className="absolute top-16 left-16 w-12 h-12 border border-yellow-400/30 rounded-full flex items-center justify-center bg-gradient-to-br from-yellow-400/20 to-orange-400/20 backdrop-blur-sm"
              animate={{
                scale: [1, 1.08, 1],
                rotate: [0, 3, -3, 0],
                opacity: [0.4, 0.7, 0.4]
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
                times: [0, 0.5, 1]
              }}
            >
              <svg className="w-6 h-6 text-yellow-400/60" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </motion.div>

            {/* Music Note Icon - Top Right */}
            <motion.div
              className="absolute top-24 right-16 w-10 h-10 border border-pink-400/30 rounded-full flex items-center justify-center bg-gradient-to-br from-pink-400/20 to-purple-400/20 backdrop-blur-sm"
              animate={{
                scale: [1, 1.12, 1],
                rotate: [0, -5, 5, 0],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut",
                times: [0, 0.5, 1]
              }}
            >
              <svg className="w-5 h-5 text-pink-400/60" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            </motion.div>

            {/* Star Icon - Bottom Right */}
            <motion.div
              className="absolute bottom-24 right-24 w-14 h-14 border border-amber-400/30 rounded-full flex items-center justify-center bg-gradient-to-br from-amber-400/20 to-yellow-400/20 backdrop-blur-sm"
              animate={{
                scale: [1, 1.15, 1],
                rotate: [0, 180, 360],
                opacity: [0.4, 0.8, 0.4]
              }}
              transition={{
                duration: 14,
                repeat: Infinity,
                ease: "easeInOut",
                times: [0, 0.5, 1]
              }}
            >
              <svg className="w-7 h-7 text-amber-400/60" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
              </svg>
            </motion.div>

            {/* Heart Icon - Middle Left */}
            <motion.div
              className="absolute top-1/2 left-8 w-11 h-11 border border-red-400/30 rounded-full flex items-center justify-center bg-gradient-to-br from-red-400/20 to-pink-400/20 backdrop-blur-sm"
              animate={{
                scale: [1, 1.08, 1],
                rotate: [0, 2, -2, 0],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{
                duration: 7,
                repeat: Infinity,
                ease: "easeInOut",
                times: [0, 0.5, 1]
              }}
            >
              <svg className="w-6 h-6 text-red-400/60" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </motion.div>

            {/* Lightning Icon - Middle Right */}
            <motion.div
              className="absolute top-1/2 right-8 w-12 h-12 border border-yellow-400/30 rounded-full flex items-center justify-center bg-gradient-to-br from-yellow-400/20 to-orange-400/20 backdrop-blur-sm"
              animate={{
                scale: [1, 1.12, 1],
                rotate: [0, -3, 3, 0],
                opacity: [0.4, 0.7, 0.4]
              }}
              transition={{
                duration: 9,
                repeat: Infinity,
                ease: "easeInOut",
                times: [0, 0.5, 1]
              }}
            >
              <svg className="w-6 h-6 text-yellow-400/60" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7 2v11h3v9l7-12h-4l4-8z"/>
              </svg>
            </motion.div>

            {/* Game Controller Icon - Bottom Left */}
            <motion.div
              className="absolute bottom-16 left-24 w-13 h-13 border border-green-400/30 rounded-full flex items-center justify-center bg-gradient-to-br from-green-400/20 to-teal-400/20 backdrop-blur-sm"
              animate={{
                scale: [1, 1.08, 1],
                rotate: [0, 5, -5, 0],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{
                duration: 11,
                repeat: Infinity,
                ease: "easeInOut",
                times: [0, 0.5, 1]
              }}
            >
              <svg className="w-6 h-6 text-green-400/60" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5S18.67 9 19.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
              </svg>
            </motion.div>
            
            {/* Particle effects - Reduced count and optimized */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white/30 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -60, 0],
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0]
                }}
                transition={{
                  duration: 4 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                  ease: [0.4, 0.0, 0.2, 1]
                }}
              />
            ))}
          </div>

          {/* Main Logo Container */}
          <motion.div
            initial={{ opacity: 1, scale: 1, y: 0 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -15 }}
            transition={{ 
              duration: 1.2, 
              ease: [0.4, 0.0, 0.2, 1],
              exit: { duration: 1.2, ease: [0.4, 0.0, 0.2, 1] }
            }}
            className="relative z-10 text-center"
          >
            {/* Integrated Logo with Icon */}
            <motion.div
              className="relative mx-auto mb-6"
              animate={{
                scale: [1, 1.015, 1],
                rotate: [0, 0.5, -0.5, 0]
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
                times: [0, 0.33, 0.66, 1]
              }}
            >
              {/* Main Logo Text - styled like navigation logo */}
              <div className="relative flex justify-center mb-4">
                <motion.div
                  className="relative flex items-center justify-center px-4 py-3 rounded-xl backdrop-blur-sm border border-white/20 shadow-xl bg-black/50"
                  animate={{
                    boxShadow: [
                      '0 15px 30px -4px rgba(0, 0, 0, 0.5)',
                      '0 20px 40px -12px rgba(59, 130, 246, 0.4), 0 0 0 1px rgba(59, 130, 246, 0.3)',
                      '0 15px 30px -4px rgba(0, 0, 0, 0.5)'
                    ]
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut",
                    times: [0, 0.5, 1]
                  }}
                >
                  {/* Animated Ring Background */}
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 opacity-30"
                    style={{
                      borderColor: '#3b82f6'
                    }}
                    animate={{
                      rotate: [0, 360, 0],
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      duration: 8,
                      repeat: Infinity,
                      ease: "easeInOut",
                      times: [0, 0.5, 1]
                    }}
                  />
                  
                  {/* Main Icon with NTN text */}
                  <motion.div
                    className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-full flex items-center justify-center text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold transition-all duration-500 bg-gradient-to-br from-blue-400 to-purple-500 text-white"
                    animate={{
                      background: [
                        'linear-gradient(135deg, #60a5fa, #a78bfa)',
                        'linear-gradient(135deg, #2563eb, #7c3aed, #0891b2)',
                        'linear-gradient(135deg, #60a5fa, #a78bfa)'
                      ]
                    }}
                    transition={{
                      duration: 8,
                      repeat: Infinity,
                      ease: "easeInOut",
                      times: [0, 0.5, 1]
                    }}
                  >
                    NTN
                  </motion.div>

                  {/* Floating Particles - Optimized */}
                  {[...Array(2)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1 h-1 rounded-full bg-blue-400"
                      style={{
                        top: `${20 + i * 30}%`,
                        left: `${75 + i * 15}%`,
                      }}
                      animate={{
                        y: [0, -6, 0],
                        opacity: [0.6, 1, 0.6],
                        scale: [0.8, 1.1, 0.8],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        delay: i * 0.4,
                        ease: [0.4, 0.0, 0.2, 1]
                      }}
                    />
                  ))}

                  {/* Shine Effect */}
                  <motion.div
                    className="absolute inset-0 rounded-xl opacity-0 pointer-events-none"
                    style={{
                      background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)',
                    }}
                    animate={{
                      opacity: [0, 1, 0],
                      x: [-60, 60],
                    }}
                    transition={{
                      duration: 6,
                      repeat: Infinity,
                      ease: [0.4, 0.0, 0.2, 1],
                      times: [0, 0.5, 1]
                    }}
                  />
                </motion.div>
              </div>
              
              {/* Subtitle with Icon Overlay */}
              <div className="relative">
                <p className="relative z-10 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-gray-300 font-medium tracking-wide mb-4">
                  <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
                    E&G Funny
                  </span>
                </p>
                
                {/* Icon positioned to overlap with the subtitle text */}
                <motion.div
                  className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-12 z-20"
                  animate={{
                    rotate: [-6, 6, -6],
                    scale: [1, 1.03, 1]
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    times: [0, 0.5, 1]
                  }}
                >
                  {/* Icon Circle - overlapping with subtitle */}
                  <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 border border-white/30 rounded-full flex items-center justify-center relative bg-gradient-to-br from-white/10 to-transparent backdrop-blur-sm shadow-lg">
                    {/* Subtle glowing effect */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400/15 via-cyan-400/15 to-teal-400/15 blur-sm" />
                    
                    {/* Movie Camera Icon */}
                    <div className="relative z-10">
                      <svg 
                        width="16" 
                        height="16" 
                        viewBox="0 0 24 24" 
                        fill="currentColor" 
                        className="text-white/60 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7"
                      >
                        <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/>
                      </svg>
                    </div>
                  </div>
                  
                  {/* Small sparkles around the overlapping icon - Optimized */}
                  <motion.div
                    className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-yellow-400/50 rounded-full"
                    animate={{
                      scale: [1, 1.15, 1],
                      opacity: [0.3, 0.7, 0.3]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: [0.4, 0.0, 0.2, 1],
                      times: [0, 0.5, 1]
                    }}
                  />
                  <motion.div
                    className="absolute -bottom-0.5 -left-0.5 w-0.5 h-0.5 bg-cyan-400/50 rounded-full"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.4, 0.8, 0.4]
                    }}
                    transition={{
                      duration: 3.5,
                      repeat: Infinity,
                      ease: [0.4, 0.0, 0.2, 1],
                      delay: 0.5,
                      times: [0, 0.5, 1]
                    }}
                  />
                </motion.div>
              </div>
              
              {/* Decorative line under the logo */}
              <motion.div
                className="relative z-10 mx-auto mt-4 w-20 sm:w-24 md:w-28 lg:w-32 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent"
                animate={{
                  scaleX: [0, 1, 0],
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: [0.4, 0.0, 0.2, 1],
                  times: [0, 0.5, 1]
                }}
              />
            </motion.div>
          </motion.div>

          {/* Fade out overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 1 }}
            transition={{ duration: 1.2, ease: [0.4, 0.0, 0.2, 1] }}
            className="absolute inset-0 bg-black pointer-events-none"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
