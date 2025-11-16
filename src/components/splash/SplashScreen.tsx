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

  const loadingTexts = useMemo(() => ["Welcome to E&G"], []);

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
    textIntervalRef.current = setInterval(animateText, 100);
    
    const completeSplash = () => {
      setIsVisible(false);
      completeTimerRef.current = setTimeout(onComplete, 800);
    };
    
    // Hoàn thành splash sau 2 giây
    mainTimerRef.current = setTimeout(() => {
      completeSplash();
    }, 2000);

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
          transition={{ duration: 0.8, ease: 'easeOut' }} // Simplified transition
          className="fixed inset-0 z-[9999] bg-gradient-to-br from-gray-900 to-blue-900 flex items-center justify-center overflow-hidden"
        >
          {/* Simplified Background */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Reduced gradient animation */}
            <motion.div 
              className="absolute inset-0 opacity-20"
              animate={{
                background: [
                  'linear-gradient(45deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1))',
                  'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(147, 51, 234, 0.15))',
                ]
              }}
              transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            />

            {/* Reduced geometric shapes to 2 */}
            <motion.div
              className="absolute top-20 left-10 w-24 h-24 border border-blue-500/20 rounded-full"
              animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute bottom-20 right-20 w-20 h-20 border border-cyan-500/20 rounded-lg"
              animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Reduced icons to 3 key entertainment icons */}
            <motion.div
              className="absolute top-16 left-16 w-10 h-10 border border-yellow-400/30 rounded-full flex items-center justify-center bg-gradient-to-br from-yellow-400/20 to-orange-400/20"
              animate={{ scale: [1, 1.1, 1], y: [0, -8, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            >
              <svg className="w-5 h-5 text-yellow-400/70" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </motion.div>

            <motion.div
              className="absolute top-24 right-16 w-10 h-10 border border-pink-400/30 rounded-full flex items-center justify-center bg-gradient-to-br from-pink-400/20 to-purple-400/20"
              animate={{ scale: [1, 1.1, 1], x: [0, 6, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
            >
              <svg className="w-5 h-5 text-pink-400/70" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            </motion.div>

            <motion.div
              className="absolute bottom-24 right-24 w-10 h-10 border border-amber-400/30 rounded-full flex items-center justify-center bg-gradient-to-br from-amber-400/20 to-yellow-400/20"
              animate={{ scale: [1, 1.1, 1], y: [0, 8, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            >
              <svg className="w-5 h-5 text-amber-400/70" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
              </svg>
            </motion.div>

            {/* Reduced particles to 4 */}
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white/40 rounded-full"
                style={{ left: `${20 + i * 15}%`, top: `${25 + (i % 2) * 30}%` }}
                animate={{ y: [0, -40, 0], opacity: [0, 0.6, 0] }}
                transition={{ duration: 3 + i * 0.3, repeat: Infinity, delay: i * 0.2, ease: 'easeOut' }}
              />
            ))}

            {/* Removed glowing orbs for simplicity */}
          </div>

          {/* Main Logo Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="relative z-10 text-center"
          >
            <motion.div
              className="relative mx-auto mb-6"
              animate={{ scale: [1, 1.01, 1], y: [0, -4, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <motion.div
                className="relative flex items-center justify-center p-2 rounded-xl bg-black/40 border border-white/20"
                animate={{
                  boxShadow: [
                    '0 10px 20px -2px rgba(0, 0, 0, 0.4)',
                    '0 15px 30px -6px rgba(59, 130, 246, 0.4)',
                    '0 10px 20px -2px rgba(0, 0, 0, 0.4)',
                  ]
                }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <motion.div
                  className="w-20 sm:w-24 md:w-28 rounded-full flex items-center justify-center text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white"
                  animate={{
                    background: [
                      'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                      'linear-gradient(135deg, #2563eb, #7c3aed)',
                      'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                    ]
                  }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <span className="relative drop-shadow-sm">NTN</span>
                  
                <motion.p 
                  className="text-lg sm:text-xl text-gray-200 font-medium tracking-wider mt-4"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                >
                  <span className="bg-gradient-to-r from-yellow-400 to-red-400 bg-clip-text text-transparent">
                    E&G Funny
                  </span>
                </motion.p>
                </motion.div>
              </motion.div>

            </motion.div>

            {/* Simplified text loading effect */}
            <motion.div 
              className="mx-auto mt-6 w-64 sm:w-72 h-10 flex items-center justify-center bg-gray-800/30 rounded-lg border border-white/10 p-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex items-center">
                <motion.div
                  className="flex space-x-1 mr-2"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                </motion.div>
                <div className="text-sm text-gray-200 font-medium">
                  {loadingTexts[textIndex].substring(0, charIndex)}
                  <motion.span
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
                    className="inline-block w-1.5 h-3 bg-blue-400 ml-1 align-middle"
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Simplified fade out */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute inset-0 bg-black pointer-events-none"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}