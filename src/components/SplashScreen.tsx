'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  
  const textIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mainTimerRef = useRef<NodeJS.Timeout | null>(null);
  const completeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const loadingTexts = useMemo(() => [
    "Welcome to E&G",
  ], []);

  // Optimized text animation with requestAnimationFrame
  const animateText = useCallback(() => {
    setCharIndex((prev) => {
      if (prev >= loadingTexts[textIndex].length) {
        setTimeout(() => {
          setTextIndex((prevIndex) => (prevIndex + 1) % loadingTexts.length);
          setCharIndex(0);
        }, 800);
        return prev;
      }
      return prev + 1;
    });
  }, [loadingTexts, textIndex]);

  useEffect(() => {
    // Optimized text animation with longer interval
    textIntervalRef.current = setInterval(animateText, 80); // Reduced frequency

    // Hide splash screen after 3.5 seconds
    mainTimerRef.current = setTimeout(() => {
      setIsVisible(false);
      completeTimerRef.current = setTimeout(() => {
        onComplete();
      }, 1000);
    }, 3500);

    return () => {
      if (textIntervalRef.current) clearInterval(textIntervalRef.current);
      if (mainTimerRef.current) clearTimeout(mainTimerRef.current);
      if (completeTimerRef.current) clearTimeout(completeTimerRef.current);
    };
  }, [onComplete, animateText]);

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: [0.4, 0.0, 0.2, 1] }}
          className="fixed inset-0 z-[9999] bg-gradient-to-br from-gray-900 via-blue-900 to-black flex items-center justify-center overflow-hidden"
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
          {/* Animated Background with Particles */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Animated gradient overlay */}
            <motion.div 
              className="absolute inset-0 opacity-30"
              animate={{
                background: [
                  'linear-gradient(45deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)',
                  'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(147, 51, 234, 0.15) 100%)',
                  'linear-gradient(225deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)',
                  'linear-gradient(315deg, rgba(59, 130, 246, 0.15) 0%, rgba(147, 51, 234, 0.15) 100%)',
                ]
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: "linear"
              }}
            />
            
            {/* Floating geometric shapes with improved animations */}
            <motion.div
              className="absolute top-20 left-10 w-32 h-32 border border-blue-500/20 rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 180, 360],
                opacity: [0.2, 0.5, 0.2],
                y: [0, -20, 0]
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div
              className="absolute top-40 right-20 w-24 h-24 border border-cyan-500/20 rounded-lg"
              animate={{
                scale: [1.1, 1, 1.1],
                rotate: [360, 180, 0],
                opacity: [0.3, 0.6, 0.3],
                y: [0, 15, 0]
              }}
              transition={{
                duration: 12,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div
              className="absolute bottom-40 left-20 w-20 h-20 border border-teal-500/20"
              animate={{
                scale: [1, 1.15, 1],
                rotate: [0, 90, 180, 270, 360],
                opacity: [0.1, 0.4, 0.1],
                x: [0, 15, 0]
              }}
              transition={{
                duration: 18,
                repeat: Infinity,
                ease: "linear"
              }}
            />
            
            {/* Entertainment Icons - Added many more icons */}
            {/* Popcorn Icon */}
            <motion.div
              className="absolute top-16 left-16 w-12 h-12 border border-yellow-400/30 rounded-full flex items-center justify-center bg-gradient-to-br from-yellow-400/20 to-orange-400/20 backdrop-blur-sm splash-icon"
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
                opacity: [0.3, 0.7, 0.3],
                y: [0, -10, 0]
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <svg className="w-6 h-6 text-yellow-400/70" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </motion.div>

            {/* Music Note Icon */}
            <motion.div
              className="absolute top-24 right-16 w-10 h-10 border border-pink-400/30 rounded-full flex items-center justify-center bg-gradient-to-br from-pink-400/20 to-purple-400/20 backdrop-blur-sm splash-icon"
              animate={{
                scale: [1, 1.15, 1],
                rotate: [0, -8, 8, 0],
                opacity: [0.2, 0.6, 0.2],
                x: [0, 8, 0]
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <svg className="w-5 h-5 text-pink-400/70" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            </motion.div>

            {/* Star Icon */}
            <motion.div
              className="absolute bottom-24 right-24 w-14 h-14 border border-amber-400/30 rounded-full flex items-center justify-center bg-gradient-to-br from-amber-400/20 to-yellow-400/20 backdrop-blur-sm"
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 180, 360],
                opacity: [0.3, 0.8, 0.3],
                y: [0, 12, 0]
              }}
              transition={{
                duration: 14,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <svg className="w-7 h-7 text-amber-400/70" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
              </svg>
            </motion.div>

            {/* Heart Icon */}
            <motion.div
              className="absolute top-1/3 left-1/4 w-11 h-11 border border-red-400/30 rounded-full flex items-center justify-center bg-gradient-to-br from-red-400/20 to-pink-400/20 backdrop-blur-sm"
              animate={{
                scale: [1, 1.08, 1],
                rotate: [0, 2, -2, 0],
                opacity: [0.3, 0.6, 0.3],
                y: [0, -8, 0]
              }}
              transition={{
                duration: 7,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <svg className="w-6 h-6 text-red-400/70" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </motion.div>

            {/* Lightning Icon */}
            <motion.div
              className="absolute top-1/3 right-1/4 w-12 h-12 border border-yellow-400/30 rounded-full flex items-center justify-center bg-gradient-to-br from-yellow-400/20 to-orange-400/20 backdrop-blur-sm"
              animate={{
                scale: [1, 1.12, 1],
                rotate: [0, -3, 3, 0],
                opacity: [0.4, 0.7, 0.4],
                x: [0, 10, 0]
              }}
              transition={{
                duration: 9,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <svg className="w-6 h-6 text-yellow-400/70" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7 2v11h3v9l7-12h-4l4-8z"/>
              </svg>
            </motion.div>

            {/* Game Controller Icon */}
            <motion.div
              className="absolute bottom-1/3 left-1/4 w-13 h-13 border border-green-400/30 rounded-full flex items-center justify-center bg-gradient-to-br from-green-400/20 to-teal-400/20 backdrop-blur-sm"
              animate={{
                scale: [1, 1.08, 1],
                rotate: [0, 5, -5, 0],
                opacity: [0.3, 0.6, 0.3],
                y: [0, 8, 0]
              }}
              transition={{
                duration: 11,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <svg className="w-6 h-6 text-green-400/70" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5S18.67 9 19.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
              </svg>
            </motion.div>

            {/* Film Icon */}
            <motion.div
              className="absolute top-2/3 left-1/3 w-10 h-10 border border-indigo-400/30 rounded-full flex items-center justify-center bg-gradient-to-br from-indigo-400/20 to-purple-400/20 backdrop-blur-sm"
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 10, -10, 0],
                opacity: [0.3, 0.7, 0.3],
                x: [0, -8, 0]
              }}
              transition={{
                duration: 13,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <svg className="w-5 h-5 text-indigo-400/70" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/>
              </svg>
            </motion.div>

            {/* Microphone Icon */}
            <motion.div
              className="absolute top-1/4 right-1/3 w-9 h-9 border border-rose-400/30 rounded-full flex items-center justify-center bg-gradient-to-br from-rose-400/20 to-pink-400/20 backdrop-blur-sm"
              animate={{
                scale: [1, 1.08, 1],
                rotate: [0, -5, 5, 0],
                opacity: [0.3, 0.7, 0.3],
                y: [0, -6, 0]
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <svg className="w-5 h-5 text-rose-400/70" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
              </svg>
            </motion.div>

            {/* TV Icon */}
            <motion.div
              className="absolute bottom-1/4 left-2/3 w-11 h-11 border border-cyan-400/30 rounded-full flex items-center justify-center bg-gradient-to-br from-cyan-400/20 to-blue-400/20 backdrop-blur-sm"
              animate={{
                scale: [1, 1.09, 1],
                rotate: [0, 8, -8, 0],
                opacity: [0.3, 0.7, 0.3],
                x: [0, 7, 0]
              }}
              transition={{
                duration: 11,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <svg className="w-6 h-6 text-cyan-400/70" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 1.99-.9 1.99-2L23 5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z"/>
              </svg>
            </motion.div>

            {/* Trophy Icon */}
            <motion.div
              className="absolute top-3/4 right-1/4 w-10 h-10 border border-amber-400/30 rounded-full flex items-center justify-center bg-gradient-to-br from-amber-400/20 to-orange-400/20 backdrop-blur-sm"
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, -10, 10, 0],
                opacity: [0.3, 0.7, 0.3],
                y: [0, 9, 0]
              }}
              transition={{
                duration: 12,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <svg className="w-5 h-5 text-amber-400/70" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9h10v2H7z"/>
              </svg>
            </motion.div>

            {/* Ticket Icon */}
            <motion.div
              className="absolute bottom-1/2 right-1/2 w-9 h-9 border border-emerald-400/30 rounded-full flex items-center justify-center bg-gradient-to-br from-emerald-400/20 to-green-400/20 backdrop-blur-sm"
              animate={{
                scale: [1, 1.07, 1],
                rotate: [0, 6, -6, 0],
                opacity: [0.3, 0.7, 0.3],
                x: [0, -5, 0]
              }}
              transition={{
                duration: 9,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <svg className="w-5 h-5 text-emerald-400/70" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22 10V6c0-1.11-.9-2-2-2H4c-1.1 0-1.99.89-1.99 2v4c1.1 0 1.99.9 1.99 2s-.89 2-2 2v4c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-4c-1.1 0-2-.9-2-2s.9-2 2-2zm-2-1.46c-1.19.69-2 1.99-2 3.46s.81 2.77 2 3.46V18H4v-2.54c1.19-.69 2-1.99 2-3.46 0-1.48-.8-2.77-1.99-3.46L4 6h16v2.54z"/>
              </svg>
            </motion.div>

            {/* Optimized particle effects - Reduced from 16 to 8 particles */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white/40 rounded-full splash-particle"
                style={{
                  left: `${15 + i * 10}%`,
                  top: `${20 + (i % 3) * 25}%`,
                }}
                animate={{
                  y: [0, -60, 0],
                  opacity: [0, 0.8, 0],
                  scale: [0, 1, 0]
                }}
                transition={{
                  duration: 4 + i * 0.5,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: [0.4, 0.0, 0.2, 1]
                }}
              />
            ))}
            
            {/* Optimized glowing orbs - Reduced from 4 to 2 */}
            {[...Array(2)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-40 h-40 rounded-full blur-xl opacity-20"
                style={{
                  background: i % 2 === 0 
                    ? 'radial-gradient(circle, rgba(59, 130, 246, 0.6) 0%, transparent 70%)' 
                    : 'radial-gradient(circle, rgba(168, 85, 247, 0.6) 0%, transparent 70%)',
                  left: `${25 + i * 50}%`,
                  top: `${30 + i * 30}%`,
                }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.1, 0.15, 0.1]
                }}
                transition={{
                  duration: 10 + i * 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>

          {/* Main Logo Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ 
              duration: 1.2, 
              ease: [0.4, 0.0, 0.2, 1],
            }}
            className="relative z-10 text-center"
          >
            {/* Integrated Logo with Icon */}
            <motion.div
              className="relative mx-auto mb-8"
              animate={{
                scale: [1, 1.02, 1],
                y: [0, -5, 0]
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {/* Main Logo Text */}
              <div className="relative flex justify-center mb-6">
                <motion.div
                  className="relative flex items-center justify-center p-2 rounded-2xl backdrop-blur-md border border-white/30 shadow-2xl bg-black/40 splash-logo"
                  animate={{
                    boxShadow: [
                      '0 20px 40px -4px rgba(0, 0, 0, 0.5)',
                      '0 25px 50px -12px rgba(59, 130, 246, 0.5), 0 0 0 1px rgba(59, 130, 246, 0.4)',
                      '0 20px 40px -4px rgba(0, 0, 0, 0.5)'
                    ]
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  {/* Animated Ring Background */}
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 opacity-40"
                    style={{
                      borderColor: '#3b82f6'
                    }}
                    animate={{
                      rotate: [0, 360],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 8,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />
                  
                  {/* Main Icon with NTN text */}
                  <motion.div
                    className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-full flex items-center justify-center text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold transition-all duration-500 bg-gradient-to-br from-blue-500 to-purple-600 text-white relative overflow-hidden"
                    animate={{
                      background: [
                        'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                        'linear-gradient(135deg, #2563eb, #7c3aed, #0891b2)',
                        'linear-gradient(135deg, #3b82f6, #8b5cf6)'
                      ]
                    }}
                    transition={{
                      duration: 8,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    {/* Inner shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-30" />
                    
                    {/* Text with slight shadow for depth */}
                    <span className="relative drop-shadow-md">NTN</span>
                    
                    {/* Optimized Floating Particles - Reduced from 3 to 2 */}
                    {[...Array(2)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-1.5 h-1.5 rounded-full bg-blue-400"
                        style={{
                          top: `${20 + i * 30}%`,
                          left: `${75 + i * 15}%`,
                        }}
                        animate={{
                          y: [0, -6, 0],
                          opacity: [0.6, 0.9, 0.6],
                          scale: [0.8, 1.1, 0.8],
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          delay: i * 0.5,
                          ease: [0.4, 0.0, 0.2, 1]
                        }}
                      />
                    ))}
                  </motion.div>

                  {/* Shine Effect */}
                  <motion.div
                    className="absolute inset-0 rounded-xl opacity-0 pointer-events-none"
                    style={{
                      background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%)',
                    }}
                    animate={{
                      opacity: [0, 0.8, 0],
                      x: [-80, 80],
                    }}
                    transition={{
                      duration: 6,
                      repeat: Infinity,
                      ease: [0.4, 0.0, 0.2, 1],
                      times: [0, 0.5, 1]
                    }}
                  />
                  
                  {/* Outer glow */}
                  <motion.div
                    className="absolute inset-0 rounded-full opacity-0"
                    style={{
                      boxShadow: '0 0 60px 20px rgba(59, 130, 246, 0.5)'
                    }}
                    animate={{
                      opacity: [0, 0.5, 0]
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                </motion.div>
              </div>
              
              {/* Subtitle with enhanced styling */}
              <div className="relative">
                <motion.p 
                  className="relative z-10 text-lg sm:text-xl md:text-2xl lg:text-3xl text-gray-200 font-medium tracking-wider mb-6"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 1 }}
                >
                  <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent font-semibold">
                    E&G Funny
                  </span>
                </motion.p>
                
                {/* Icon positioned to overlap with the subtitle text */}
                <motion.div
                  className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-16 z-20"
                  animate={{
                    rotate: [-8, 8, -8],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  {/* Icon Circle */}
                  <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 border border-white/40 rounded-full flex items-center justify-center relative bg-gradient-to-br from-white/20 to-transparent backdrop-blur-md shadow-lg">
                    {/* Glowing effect */}
                    <div className="absolute inset-0 rounded-full bg-blue-400/20 blur-md" />
                    
                    {/* Movie Camera Icon */}
                    <div className="relative z-10">
                      <svg 
                        width="20" 
                        height="20" 
                        viewBox="0 0 24 24" 
                        fill="currentColor" 
                        className="text-white/80 w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8"
                      >
                        <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/>
                      </svg>
                    </div>
                  </div>
                  
                  {/* Optimized Sparkles - Reduced from 3 to 2 */}
                  {[...Array(2)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1.5 h-1.5 bg-yellow-400/70 rounded-full"
                      style={{
                        top: i === 0 ? '-5px' : 'auto',
                        bottom: i === 1 ? '-5px' : 'auto',
                        left: '50%'
                      }}
                      animate={{
                        scale: [0, 1.1, 0],
                        opacity: [0, 0.8, 0]
                      }}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        delay: i * 0.8,
                        ease: [0.4, 0.0, 0.2, 1]
                      }}
                    />
                  ))}
                </motion.div>
              </div>
              
              {/* Animated text loading effect */}
              <motion.div 
                className="relative mx-auto mt-8 w-72 sm:w-80 md:w-96 h-12 flex items-center justify-center bg-gray-800/40 backdrop-blur-md rounded-xl border border-white/10 p-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <div className="flex items-center">
                  {/* Optimized animated dots */}
                  <motion.div
                    className="flex space-x-1 mr-3"
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <div className="w-2 h-2 bg-blue-400 rounded-full" />
                    <div className="w-2 h-2 bg-blue-400 rounded-full" />
                    <div className="w-2 h-2 bg-blue-400 rounded-full" />
                  </motion.div>
                  
                  {/* Typing text effect */}
                  <div className="text-sm sm:text-base text-gray-200 font-medium tracking-wide">
                    {loadingTexts[textIndex].substring(0, charIndex)}
                    <motion.span
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                      className="inline-block w-2 h-4 bg-blue-400 ml-1 align-middle"
                    />
                  </div>
                </div>
                
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent rounded-xl opacity-30" />
              </motion.div>
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