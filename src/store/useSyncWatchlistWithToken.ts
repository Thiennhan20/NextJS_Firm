"use client";
import { useEffect } from 'react';
import { useWatchlistStore } from './store';

export default function useSyncWatchlistWithToken(token: string | null) {
  const { fetchWatchlistFromServer } = useWatchlistStore();
  useEffect(() => {
    if (token) {
      fetchWatchlistFromServer(token);
    }
  }, [token, fetchWatchlistFromServer]);
} 