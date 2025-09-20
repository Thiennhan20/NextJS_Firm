'use client'

import dynamic from 'next/dynamic';

// Lazy load heavy components
const FloatingChatbox = dynamic(() => import('@/components/FloatingChatbox'), {
  ssr: false,
  loading: () => null
});

const WatchlistSyncer = dynamic(() => import('@/components/WatchlistSyncer'), {
  ssr: false,
  loading: () => null
});

export { FloatingChatbox, WatchlistSyncer };
