'use client';

import { useState, useEffect, useRef } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [charIndex, setCharIndex] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const text = "Welcome to E&G";

  useEffect(() => {
    // Text animation
    const textInterval = setInterval(() => {
      setCharIndex((prev) => {
        if (prev >= text.length) {
          clearInterval(textInterval);
          return prev;
        }
        return prev + 1;
      });
    }, 80);

    // Auto hide after 2s
    timerRef.current = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 600); // Wait for fade out
    }, 2000);

    return () => {
      clearInterval(textInterval);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [onComplete]);

  if (!isVisible) {
    return (
      <div className="splash-fade-out fixed inset-0 z-[9999] bg-gradient-to-br from-gray-900 to-blue-900 pointer-events-none" />
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-gray-900 to-blue-900 flex items-center justify-center overflow-hidden">
      {/* Simplified Background - CSS only */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="splash-gradient absolute inset-0 opacity-20" />
        
        {/* Static shapes - no JS animation */}
        <div className="splash-shape-1 absolute top-20 left-10 w-24 h-24 border border-blue-500/20 rounded-full" />
        <div className="splash-shape-2 absolute bottom-20 right-20 w-20 h-20 border border-cyan-500/20 rounded-lg" />

        {/* Minimal icons */}
        <div className="splash-icon-1 absolute top-16 left-16 w-10 h-10 border border-yellow-400/30 rounded-full flex items-center justify-center bg-gradient-to-br from-yellow-400/20 to-orange-400/20">
          <svg className="w-5 h-5 text-yellow-400/70" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>

        <div className="splash-icon-2 absolute top-24 right-16 w-10 h-10 border border-pink-400/30 rounded-full flex items-center justify-center bg-gradient-to-br from-pink-400/20 to-purple-400/20">
          <svg className="w-5 h-5 text-pink-400/70" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
          </svg>
        </div>

        <div className="splash-icon-3 absolute bottom-24 right-24 w-10 h-10 border border-amber-400/30 rounded-full flex items-center justify-center bg-gradient-to-br from-amber-400/20 to-yellow-400/20">
          <svg className="w-5 h-5 text-amber-400/70" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
          </svg>
        </div>

        {/* CSS-only particles */}
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="splash-particle absolute w-1 h-1 bg-white/40 rounded-full"
            style={{ 
              left: `${20 + i * 15}%`, 
              top: `${25 + (i % 2) * 30}%`,
              animationDelay: `${i * 0.2}s`
            }}
          />
        ))}
      </div>

      {/* Main Logo - CSS animations only */}
      <div className="splash-content relative z-10 text-center">
        <div className="splash-logo-wrapper relative mx-auto mb-6">
          <div className="splash-logo-border relative flex items-center justify-center p-2 rounded-xl bg-black/40 border border-white/20">
            <div className="splash-logo w-20 sm:w-24 md:w-28 rounded-full flex items-center justify-center text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              <span className="relative drop-shadow-sm">NTN</span>
            </div>
          </div>
          <p className="splash-subtitle text-lg sm:text-xl text-gray-200 font-medium tracking-wider mt-4">
            <span className="bg-gradient-to-r from-yellow-400 to-red-400 bg-clip-text text-transparent">
              E&G Funny
            </span>
          </p>
        </div>

        {/* Loading text */}
        <div className="splash-loading-box mx-auto mt-6 w-64 sm:w-72 h-10 flex items-center justify-center bg-gray-800/30 rounded-lg border border-white/10 p-2">
          <div className="flex items-center">
            <div className="splash-dots flex space-x-1 mr-2">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
            </div>
            <div className="text-sm text-gray-200 font-medium">
              {text.substring(0, charIndex)}
              <span className="splash-cursor inline-block w-1.5 h-3 bg-blue-400 ml-1 align-middle" />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        /* Fade out animation */
        .splash-fade-out {
          animation: fadeOut 0.6s ease-out forwards;
        }

        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }

        /* Background gradient animation */
        .splash-gradient {
          animation: gradientShift 10s linear infinite;
          background: linear-gradient(45deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1));
        }

        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        /* Shape animations - optimized */
        .splash-shape-1 {
          animation: pulse1 10s ease-in-out infinite;
        }

        .splash-shape-2 {
          animation: pulse2 8s ease-in-out infinite;
        }

        @keyframes pulse1 {
          0%, 100% { transform: scale(1); opacity: 0.2; }
          50% { transform: scale(1.1); opacity: 0.4; }
        }

        @keyframes pulse2 {
          0%, 100% { transform: scale(1); opacity: 0.2; }
          50% { transform: scale(1.1); opacity: 0.4; }
        }

        /* Icon animations */
        .splash-icon-1 {
          animation: float1 6s ease-in-out infinite;
        }

        .splash-icon-2 {
          animation: float2 7s ease-in-out infinite;
        }

        .splash-icon-3 {
          animation: float3 8s ease-in-out infinite;
        }

        @keyframes float1 {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-8px) scale(1.1); }
        }

        @keyframes float2 {
          0%, 100% { transform: translateX(0) scale(1); }
          50% { transform: translateX(6px) scale(1.1); }
        }

        @keyframes float3 {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(8px) scale(1.1); }
        }

        /* Particle animation */
        .splash-particle {
          animation: particleFloat 3s ease-out infinite;
        }

        @keyframes particleFloat {
          0% { transform: translateY(0); opacity: 0; }
          50% { opacity: 0.6; }
          100% { transform: translateY(-40px); opacity: 0; }
        }

        /* Logo animations */
        .splash-logo-wrapper {
          animation: logoFloat 5s ease-in-out infinite;
        }

        @keyframes logoFloat {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-4px) scale(1.01); }
        }

        .splash-logo-border {
          animation: shadowPulse 5s ease-in-out infinite;
        }

        @keyframes shadowPulse {
          0%, 100% { box-shadow: 0 10px 20px -2px rgba(0, 0, 0, 0.4); }
          50% { box-shadow: 0 15px 30px -6px rgba(59, 130, 246, 0.4); }
        }

        .splash-logo {
          animation: gradientShiftLogo 6s ease-in-out infinite;
        }

        @keyframes gradientShiftLogo {
          0%, 100% { background: linear-gradient(135deg, #3b82f6, #8b5cf6); }
          50% { background: linear-gradient(135deg, #2563eb, #7c3aed); }
        }

        /* Content fade in */
        .splash-content {
          animation: contentFadeIn 0.8s ease-out;
        }

        @keyframes contentFadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }

        .splash-subtitle {
          animation: subtitleFadeIn 0.6s ease-out 0.4s both;
        }

        @keyframes subtitleFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Loading box */
        .splash-loading-box {
          animation: loadingBoxFadeIn 0.6s ease-out 0.6s both;
        }

        @keyframes loadingBoxFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* Loading dots */
        .splash-dots {
          animation: dotsPulse 1.5s ease-in-out infinite;
        }

        @keyframes dotsPulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        /* Cursor blink */
        .splash-cursor {
          animation: cursorBlink 0.8s ease-in-out infinite;
        }

        @keyframes cursorBlink {
          0%, 100% { opacity: 0; }
          50% { opacity: 1; }
        }

        /* Performance optimizations */
        .splash-gradient,
        .splash-shape-1,
        .splash-shape-2,
        .splash-icon-1,
        .splash-icon-2,
        .splash-icon-3,
        .splash-particle,
        .splash-logo-wrapper,
        .splash-logo-border,
        .splash-logo {
          will-change: transform;
        }
      `}</style>
    </div>
  );
}