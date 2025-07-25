'use client';

import { useEffect } from 'react';

export default function ClearStorageOnLoad() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.clear();
      localStorage.clear();
    }
  }, []);
  return null;
} 