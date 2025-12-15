"use client";
import { useEffect, useRef } from "react";
import useAuthStore from "@/store/useAuthStore";

export default function AuthChecker() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    // Only check auth once on mount, not on every render
    if (hasCheckedRef.current) {
      return;
    }
    
    hasCheckedRef.current = true;
    
    // Nếu chưa xác thực, chỉ gọi checkAuth một lần khi mount
    if (!isAuthenticated) {
      useAuthStore.getState().checkAuth().catch(() => {
        // Nếu checkAuth thất bại, logout để clear state
        useAuthStore.getState().logout().catch(console.error);
      });
    }

    let timeout: NodeJS.Timeout | null = null;
    function handleVisibilityChange() {
      // Chỉ gọi checkAuth khi đã đăng nhập và chuyển sang tab này
      if (document.visibilityState === 'visible' && useAuthStore.getState().isAuthenticated) {
        useAuthStore.getState().checkAuth().catch(() => {
          // Nếu checkAuth thất bại, logout để clear state
          useAuthStore.getState().logout().catch(console.error);
        });
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
          useAuthStore.getState().checkAuth().catch(() => {
            useAuthStore.getState().logout().catch(console.error);
          });
        }, 2000);
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (timeout) clearTimeout(timeout);
    };
  }, [isAuthenticated]); // Include isAuthenticated dependency
  
  return null;
} 