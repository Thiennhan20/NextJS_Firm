'use client';

import { useEffect } from 'react';

export default function ClearStorageOnLoad() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
    }
  }, []);
  return null;
} 