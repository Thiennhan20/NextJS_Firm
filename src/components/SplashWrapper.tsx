'use client';

import { useState, useEffect } from 'react';
import SplashScreen from './SplashScreen';

export default function SplashWrapper() {
  const [showSplash, setShowSplash] = useState(true);

  // Always show splash screen on reload/visit
  useEffect(() => {
    // Add CSS class to prevent scrolling
    document.documentElement.classList.add('splash-screen-active');
    document.body.classList.add('splash-screen-active');

    // Force show splash screen for 2 seconds on every visit/reload
    const timer = setTimeout(() => {
      setShowSplash(false);
      // Remove CSS classes after splash screen fade out completes
      setTimeout(() => {
        document.documentElement.classList.remove('splash-screen-active');
        document.body.classList.remove('splash-screen-active');
      }, 1200); // Wait for fade out animation to complete (1.2s)
    }, 2000);

    return () => {
      clearTimeout(timer);
      // Cleanup CSS classes
      document.documentElement.classList.remove('splash-screen-active');
      document.body.classList.remove('splash-screen-active');
    };
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
    // Remove CSS classes
    document.documentElement.classList.remove('splash-screen-active');
    document.body.classList.remove('splash-screen-active');
  };

  if (!showSplash) return null;

  return <SplashScreen onComplete={handleSplashComplete} />;
}
