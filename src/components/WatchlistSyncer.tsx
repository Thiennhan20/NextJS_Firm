"use client";
import useSyncWatchlistWithToken from "@/store/useSyncWatchlistWithToken";
import useAuthStore from "@/store/useAuthStore";

export default function WatchlistSyncer() {
  const { token, isAuthenticated } = useAuthStore();
  useSyncWatchlistWithToken(isAuthenticated ? token : null);
  return null;
} 