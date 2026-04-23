'use client';

import { useState, useEffect, useRef } from 'react';
import SplashScreen from './SplashScreen';

export default function SplashWrapper() {
  // Only show splash once per session
  const [showSplash, setShowSplash] = useState(() => {
    if (typeof window !== 'undefined') {
      return !sessionStorage.getItem('splashShown');
    }
    return true;
  });
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!showSplash) return;

    // Prevent scrolling during splash
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    // Auto hide after 1.2s (reduced from 2s)
    timerRef.current = setTimeout(() => {
      setShowSplash(false);
      sessionStorage.setItem('splashShown', '1');
      
      // Restore scroll immediately after hiding
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }, 1200);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      // Always restore scroll on cleanup
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [showSplash]);

  if (!showSplash) return null;

  return <SplashScreen onComplete={() => { setShowSplash(false); sessionStorage.setItem('splashShown', '1'); }} />;
}