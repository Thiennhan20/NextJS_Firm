"use client";
import { useEffect } from 'react';
import { useWatchlistStore } from './store';

/**
 * Đồng bộ watchlist từ server mỗi khi token thay đổi (đăng nhập/đăng xuất).
 * Token nên được lấy từ AuthStore và truyền vào hook này.
 */
export default function useSyncWatchlistWithToken(token: string | null) {
  const { fetchWatchlistFromServer, clearWatchlist } = useWatchlistStore();
  useEffect(() => {
    if (token) {
      fetchWatchlistFromServer(token);
    } else {
      // Clear watchlist khi không có token (logout hoặc chưa đăng nhập)
      clearWatchlist();
    }
  }, [token, fetchWatchlistFromServer, clearWatchlist]);
} 