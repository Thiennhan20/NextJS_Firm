"use client";
import useAuthStore from "@/store/useAuthStore";
import useSyncWatchlistWithToken from "@/store/useSyncWatchlistWithToken";

export default function WatchlistSyncer() {
  const { token } = useAuthStore();
  useSyncWatchlistWithToken(token);
  return null;
} 