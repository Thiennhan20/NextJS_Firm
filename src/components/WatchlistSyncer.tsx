"use client";
import useSyncWatchlistWithToken from "@/store/useSyncWatchlistWithToken";

export default function WatchlistSyncer() {
  useSyncWatchlistWithToken();
  return null;
} 