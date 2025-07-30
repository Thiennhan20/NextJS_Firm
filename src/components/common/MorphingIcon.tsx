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
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false });

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % iconPaths.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Start horizontal animation after 5 seconds when in view
  useEffect(() => {
    if (isInView && !hasStartedHorizontalAnimation) {
      const timer = setTimeout(() => {
        setHasStartedHorizontalAnimation(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isInView, hasStartedHorizontalAnimation]);

  // Different animation patterns for left and right
  const animationConfig = direction === 'left' 
    ? {
        x: [-100, 0, 100, 0, -100],
        times: [0, 0.25, 0.5, 0.75, 1]
      }
    : {
        x: [100, 0, -100, 0, 100],
        times: [0, 0.25, 0.5, 0.75, 1]
      };

  return (
    <motion.div 
      ref={ref}
      className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 flex items-center justify-center"
      initial={{ y: -200, opacity: 0 }}
      animate={{
        y: isInView ? 0 : -200,
        opacity: isInView ? 1 : 0,
        x: hasStartedHorizontalAnimation ? animationConfig.x : 0
      }}
      transition={{
        y: {
          duration: 1.5,
          ease: "easeOut",
          type: "spring",
          stiffness: 100,
          damping: 10
        },
        opacity: {
          duration: 1,
          ease: "easeOut"
        },
        x: {
          duration: 12,
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
        <path d={iconPaths[currentIndex]} />
      </svg>
    </motion.div>
  );
};