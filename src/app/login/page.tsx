'use client';

import { useState } from 'react';
import LoginForm from '@/components/auth/LoginForm';
import RegisterForm from '@/components/auth/RegisterForm';
import dynamic from 'next/dynamic';
import ThreeBackground from '@/components/common/ThreeBackground';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = dynamic(() => import('framer-motion').then(mod => mod.motion.div), { ssr: false });

const pageVariants = {
  initial: {
    opacity: 0,
    scale: 0.95,
    y: 20,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1], // Custom easing for smoother animation
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -20,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 1, 1],
    },
  },
};

const buttonVariants = {
  hover: {
    scale: 1.02,
    transition: {
      duration: 0.2,
      ease: "easeOut",
    },
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: 0.1,
      ease: "easeIn",
    },
  },
};

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      <ThreeBackground />
      <div className="relative z-10 w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="bg-black/50 rounded-lg p-1 shadow-inner-lg shadow-red-900/50 border border-yellow-600">
            <motion.button
              onClick={() => setIsLogin(true)}
              className={`px-6 py-2 rounded-lg transition-colors duration-200 font-semibold ${
                isLogin ? 'bg-red-800 text-yellow-300 shadow-md' : 'text-gray-400 hover:bg-red-900 hover:text-yellow-300'
              }`}
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              Login
            </motion.button>
            <motion.button
              onClick={() => setIsLogin(false)}
              className={`px-6 py-2 rounded-lg transition-colors duration-200 font-semibold ${
                !isLogin ? 'bg-red-800 text-yellow-300 shadow-md' : 'text-gray-400 hover:bg-red-900 hover:text-yellow-300'
              }`}
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              Register
            </motion.button>
          </div>
        </div>
        <AnimatePresence mode="wait">
          <MotionDiv
            key={isLogin ? 'login' : 'register'}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full"
          >
            {isLogin ? <LoginForm /> : <RegisterForm />}
          </MotionDiv>
        </AnimatePresence>
      </div>
    </div>
  );
} 