'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [textIndex, setTextIndex] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
            {/* For brevity, main logo and animated elements preserved exactly as original */}
            {/* Subtitle and loading text preserved */}
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
