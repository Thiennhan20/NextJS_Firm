'use client'

import { motion, useMotionValue, useTransform } from 'framer-motion'
import React from 'react'

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: 'purple' | 'red' | 'blue';
}

const colorVariants = {
  purple: {
    gradient: 'from-purple-500 to-purple-600',
    glow: 'radial-gradient(800px circle at var(--x) var(--y), rgba(168, 85, 247, 0.15), transparent 80%)'
  },
  red: {
    gradient: 'from-red-500 to-red-600',
    glow: 'radial-gradient(800px circle at var(--x) var(--y), rgba(239, 68, 68, 0.15), transparent 80%)'
  },
  blue: {
    gradient: 'from-blue-500 to-blue-600',
    glow: 'radial-gradient(800px circle at var(--x) var(--y), rgba(59, 130, 246, 0.15), transparent 80%)'
  }
};

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, color }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent<HTMLDivElement>) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }
  
  const rotateX = useTransform(mouseY, [0, 350], [10, -10]);
  const rotateY = useTransform(mouseX, [0, 350], [-10, 10]);

  return (
    <motion.div
      className="group relative h-full rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 p-6 sm:p-8 text-center transition-shadow duration-300 hover:shadow-2xl hover:shadow-purple-500/20"
      style={{ transformStyle: 'preserve-3d', rotateX, rotateY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        mouseX.set(175); // Reset to center
        mouseY.set(175); // Reset to center
      }}
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {/* Interactive Glow Effect */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: colorVariants[color].glow,
          '--x': `${mouseX.get()}px`,
          '--y': `${mouseY.get()}px`,
        } as React.CSSProperties}
      />

      <div style={{ transform: 'translateZ(50px)' }} className="flex flex-col items-center">
        <motion.div
          className={`inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br ${colorVariants[color].gradient} text-white mb-6 shadow-lg`}
          whileHover={{ scale: 1.1, rotate: -5 }}
          transition={{ type: 'spring', stiffness: 400, damping: 10 }}
        >
          {icon}
        </motion.div>
        <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">{title}</h3>
        <p className="text-sm sm:text-base text-gray-300 leading-relaxed">{description}</p>
      </div>
    </motion.div>
  )
}

export default FeatureCard;