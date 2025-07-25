import React from 'react';
import useAuthStore from '@/store/useAuthStore';
import dynamic from 'next/dynamic';

// Dynamic import để tránh lỗi khi dùng trong server component
const ComingSoon = dynamic(() => import('@/app/coming-soon/page'), { ssr: false });

interface RequireAdminProps {
  children: React.ReactNode;
}

export default function RequireAdmin({ children }: RequireAdminProps) {
  const user = useAuthStore((state) => state.user);
  // Check if user exists and has a role property equal to 'admin'
  if (!user || (typeof user === 'object' && 'role' in user && (user as unknown as { role: string }).role !== 'admin') || (typeof user === 'object' && !('role' in user))) {
    return <ComingSoon />;
  }
  return <>{children}</>;
} 