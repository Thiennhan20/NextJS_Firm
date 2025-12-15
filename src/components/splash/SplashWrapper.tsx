'use client';

import { useState, useEffect, useRef } from 'react';
import SplashScreen from './SplashScreen';

export default function SplashWrapper() {
  const [showSplash, setShowSplash] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Prevent scrolling during splash
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    // Auto hide after 2s
    timerRef.current = setTimeout(() => {
      setShowSplash(false);
      
      // Restore scroll immediately after hiding
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }, 2000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      // Always restore scroll on cleanup
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  if (!showSplash) return null;

  return <SplashScreen onComplete={() => setShowSplash(false)} />;
}