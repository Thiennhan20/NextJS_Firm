// components/MorphingIcon.tsx
'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'

// Simple SVG path data that works reliably
const iconPaths = [
  // Star
  "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  // Circle
  "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z",
  // Square
  "M4 4h16v16H4V4z",
  // Triangle
  "M12 2L2 22h20L12 2z"
];

interface MorphingIconProps {
  direction?: 'left' | 'right';
}

export const MorphingIcon = ({ direction = 'left' }: MorphingIconProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasStartedHorizontalAnimation, setHasStartedHorizontalAnimation] = useState(false);
  const [randomWiggle, setRandomWiggle] = useState(0);
  const [isExploding, setIsExploding] = useState(false);
  const [explosionProgress, setExplosionProgress] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { 
    once: false, 
    margin: "-20% 0px -20% 0px",
    amount: 0.3
  });

  // Shape morphing effect
  useEffect(() => {
    const interval = setInterval(() => {
      // Start explosion effect
      setIsExploding(true);
      setExplosionProgress(0);
      
      // After explosion, change shape
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % iconPaths.length);
        setIsExploding(false);
        setExplosionProgress(0);
      }, 1500); // Explosion duration
    }, 3000); // Change shape every 3 seconds

    return () => clearInterval(interval);
  }, []);

  // Smooth random wiggle effect during movement
  useEffect(() => {
    if (hasStartedHorizontalAnimation) {
      // Initialize first wiggle
      setRandomWiggle(Math.random() * 40 - 20);
      
      const wiggleInterval = setInterval(() => {
        setRandomWiggle(Math.random() * 40 - 20);
      }, 4000); // Change wiggle every 4 seconds

      return () => clearInterval(wiggleInterval);
    }
  }, [hasStartedHorizontalAnimation]);

  // Start horizontal animation after 2 seconds when in view
  useEffect(() => {
    if (isInView && !hasStartedHorizontalAnimation) {
      const timer = setTimeout(() => {
        setHasStartedHorizontalAnimation(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isInView, hasStartedHorizontalAnimation]);

  // Explosion progress animation
  useEffect(() => {
    if (isExploding) {
      const explosionInterval = setInterval(() => {
        setExplosionProgress(prev => {
          if (prev >= 1) return 1;
          return prev + 0.02; // Smooth explosion progress
        });
      }, 30); // 30fps for smooth explosion

      return () => clearInterval(explosionInterval);
    }
  }, [isExploding]);
  
  // Explosion effect calculation
  const explosionOffset = isExploding ? (explosionProgress * 100) : 0;
  const explosionScale = isExploding ? (1 + explosionProgress * 0.5) : 1;
  const explosionRotation = isExploding ? (explosionProgress * 720) : 0; // 2 full rotations
  
  // Different animation patterns for left and right with smooth transitions and wiggle
  const animationConfig = direction === 'left' 
    ? {
        x: [0, 50, 100, 50, 0, -50, -100, -50, 0],
        y: [0, randomWiggle, -randomWiggle/2, randomWiggle, -randomWiggle, randomWiggle/2, -randomWiggle, randomWiggle, 0],
        times: [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1]
      }
    : {
        x: [0, -50, -100, -50, 0, 50, 100, 50, 0],
        y: [0, -randomWiggle, randomWiggle/2, -randomWiggle, randomWiggle, -randomWiggle/2, randomWiggle, -randomWiggle, 0],
        times: [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1]
      };

  return (
    <motion.div 
      ref={ref}
      className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 flex items-center justify-center"
      initial={{ y: -100, opacity: 0, scale: 0.8, x: 0 }}
      animate={{
        y: isInView ? (hasStartedHorizontalAnimation ? animationConfig.y : 0) : -100,
        opacity: isInView ? (isExploding ? 0.3 : 1) : 0,
        scale: isInView ? explosionScale : 0.8,
        x: hasStartedHorizontalAnimation ? animationConfig.x : 0,
        rotate: explosionRotation
      }}
      transition={{
        y: hasStartedHorizontalAnimation ? {
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
          times: animationConfig.times,
          delay: 0
        } : {
          duration: 0.8,
          ease: "easeOut",
          type: "spring",
          stiffness: 120,
          damping: 15
        },
        opacity: {
          duration: 0.6,
          ease: "easeOut"
        },
        scale: {
          duration: isExploding ? 1.5 : 0.6,
          ease: isExploding ? "easeInOut" : "easeOut"
        },
        rotate: {
          duration: isExploding ? 1.5 : 0.6,
          ease: "easeInOut"
        },
        x: {
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
          times: animationConfig.times,
          delay: hasStartedHorizontalAnimation ? 0 : 0
        }
      }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-full h-full text-purple-300/70 transition-all duration-500 ease-in-out"
      >
        {/* Main icon */}
        <path d={iconPaths[currentIndex]} />
        
        {/* Explosion particles */}
        {isExploding && Array.from({ length: 8 }).map((_, i) => (
          <motion.circle
            key={i}
            cx={12 + Math.cos(i * Math.PI / 4) * explosionOffset}
            cy={12 + Math.sin(i * Math.PI / 4) * explosionOffset}
            r={1}
            fill="currentColor"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: explosionProgress > 0.3 ? 1 : 0,
              scale: explosionProgress > 0.3 ? 1 : 0
            }}
            transition={{ duration: 0.3, delay: i * 0.1 }}
          />
        ))}
      </svg>
    </motion.div>
  );
};