"use client";
import { useEffect } from 'react';
import useAuthStore from './useAuthStore';

// Hook đồng bộ token từ zustand persist vào localStorage
export function useSyncTokenToLocalStorage() {
  const token = useAuthStore((state) => state.token);
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);
} 