'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import SplashScreen from './SplashScreen';

export default function SplashWrapper() {
  const [showSplash, setShowSplash] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Memoized cleanup function
  const cleanup = useCallback(() => {
    document.documentElement.classList.remove('splash-screen-active');
    document.body.classList.remove('splash-screen-active');
  }, []);

  // Check if we're updating version (skip splash)
  useEffect(() => {
    const isUpdating = sessionStorage.getItem('version_updating');
    
    if (isUpdating) {
      // Đang update version → Skip splash
      sessionStorage.removeItem('version_updating');
      setShowSplash(false);
      cleanup();
      return;
    }

    // Normal splash flow
    // Add CSS class to prevent scrolling
    document.documentElement.classList.add('splash-screen-active');
    document.body.classList.add('splash-screen-active');

    // Force show splash screen for 2 seconds on every visit/reload
    timeoutRef.current = setTimeout(() => {
      setShowSplash(false);
      // Remove CSS classes after splash screen fade out completes
      cleanupTimeoutRef.current = setTimeout(cleanup, 1200); // Wait for fade out animation to complete (1.2s)
    }, 2000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (cleanupTimeoutRef.current) clearTimeout(cleanupTimeoutRef.current);
      cleanup();
    };
  }, [cleanup]);

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
    cleanup();
  }, [cleanup]);

  if (!showSplash) return null;

  return <SplashScreen onComplete={handleSplashComplete} />;
}
