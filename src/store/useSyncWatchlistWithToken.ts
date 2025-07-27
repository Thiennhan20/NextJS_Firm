"use client";
import { useEffect } from 'react';
import { useWatchlistStore } from './store';

/**
 * Đồng bộ watchlist từ server mỗi khi token thay đổi (đăng nhập/đăng xuất).
 * Token nên được lấy từ AuthStore và truyền vào hook này.
 */
export default function useSyncWatchlistWithToken(token: string | null) {
  const { fetchWatchlistFromServer } = useWatchlistStore();
  useEffect(() => {
    if (token) {
      fetchWatchlistFromServer(token);
    }
  }, [token, fetchWatchlistFromServer]);
} 