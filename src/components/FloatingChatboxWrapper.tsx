'use client'

import dynamic from 'next/dynamic';

const FloatingChatbox = dynamic(() => import("@/components/FloatingChatbox"), { ssr: false });

export default function FloatingChatboxWrapper() {
  return <FloatingChatbox />;
}
