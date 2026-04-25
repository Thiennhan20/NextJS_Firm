'use client';

import { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import SplashScreen from './SplashScreen';

export default function SplashWrapper() {
  // Always start true → matches server render → NO hydration mismatch
  const [showSplash, setShowSplash] = useState(true);

  // Stable callback
  const handleComplete = useCallback(() => {
    setShowSplash(false);
    sessionStorage.setItem('splashShown', '1');
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  }, []);

  // useLayoutEffect runs synchronously BEFORE browser paints.
  // If session already saw splash → hide it before user ever sees a frame.
  useLayoutEffect(() => {
    if (sessionStorage.getItem('splashShown')) {
      setShowSplash(false);
    }
  }, []);

  // Lock scroll while splash is active
  useEffect(() => {
    if (!showSplash) return;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [showSplash]);

  if (!showSplash) return null;

  return <SplashScreen onComplete={handleComplete} />;
}