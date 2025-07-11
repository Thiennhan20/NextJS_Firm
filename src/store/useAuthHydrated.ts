"use client";
import { useEffect, useState } from 'react';

export default function useAuthHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);
  return hydrated;
} 