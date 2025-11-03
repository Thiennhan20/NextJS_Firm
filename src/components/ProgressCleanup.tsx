'use client';

import { useEffect } from 'react';

export default function ProgressCleanup() {
  useEffect(() => {
    const cleanupExpiredProgress = () => {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('movie-progress-') || key.startsWith('tvshow-progress-'))) {
          const value = localStorage.getItem(key);
          if (value) {
            try {
              const progressData = JSON.parse(value);
              if (progressData.expiresAt) {
                const expiresAt = new Date(progressData.expiresAt);
                const now = new Date();
                if (now > expiresAt) {
                  keysToRemove.push(key);
                }
              }
            } catch {
              // Skip invalid data
            }
          }
        }
      }
      
      // Remove expired progress
      keysToRemove.forEach(key => localStorage.removeItem(key));
    };
    
    // Run cleanup immediately when component mounts (every page load)
    cleanupExpiredProgress();
    
    // Run cleanup every 30 seconds
    const interval = setInterval(cleanupExpiredProgress, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return null; // This component doesn't render anything
}
