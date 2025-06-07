'use client';

import { useState } from 'react';
import LoginForm from '@/components/auth/LoginForm';
import RegisterForm from '@/components/auth/RegisterForm';
import dynamic from 'next/dynamic';
import ThreeBackground from '@/components/common/ThreeBackground';
import { motion } from 'framer-motion';

const MotionDiv = dynamic(() => import('framer-motion').then(mod => mod.motion.div), { ssr: false });

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
              className={`px-6 py-2 rounded-lg transition-all duration-300 font-semibold ${
                isLogin ? 'bg-red-800 text-yellow-300 shadow-md' : 'text-gray-400 hover:bg-red-900 hover:text-yellow-300'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Login
            </motion.button>
            <motion.button
              onClick={() => setIsLogin(false)}
              className={`px-6 py-2 rounded-lg transition-all duration-300 font-semibold ${
                !isLogin ? 'bg-red-800 text-yellow-300 shadow-md' : 'text-gray-400 hover:bg-red-900 hover:text-yellow-300'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Register
            </motion.button>
          </div>
        </div>
        <MotionDiv
          key={isLogin ? 'login' : 'register'}
          initial={{ opacity: 0, x: isLogin ? -50 : 50, rotateY: isLogin ? -90 : 90, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, rotateY: 0, scale: 1 }}
          exit={{ opacity: 0, x: isLogin ? 50 : -50, rotateY: isLogin ? 90 : -90, scale: 0.8 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {isLogin ? <LoginForm /> : <RegisterForm />}
        </MotionDiv>
      </div>
    </div>
  );
} 