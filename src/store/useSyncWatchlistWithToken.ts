"use client";
import { useEffect } from 'react';
import { useWatchlistStore } from './store';

export default function useSyncWatchlistWithToken() {
  const { fetchWatchlistFromServer } = useWatchlistStore();
  useEffect(() => {
    fetchWatchlistFromServer();
  }, [fetchWatchlistFromServer]);
} 