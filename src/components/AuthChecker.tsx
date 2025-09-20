"use client";
import { useEffect } from "react";
import useAuthStore from "@/store/useAuthStore";

export default function AuthChecker() {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const logout = useAuthStore((state) => state.logout);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    // Nếu chưa xác thực, chỉ gọi checkAuth một lần khi mount
    if (!isAuthenticated) {
      checkAuth().catch(() => {
        // Nếu checkAuth thất bại, logout để clear state
        logout().catch(console.error);
      });
    }

    let timeout: NodeJS.Timeout | null = null;
    function handleVisibilityChange() {
      // Chỉ gọi checkAuth khi đã đăng nhập và chuyển sang tab này
      if (document.visibilityState === 'visible' && isAuthenticated) {
        checkAuth().catch(() => {
          // Nếu checkAuth thất bại, logout để clear state
          logout().catch(console.error);
        });
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
          checkAuth().catch(() => {
            logout().catch(console.error);
          });
        }, 2000);
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (timeout) clearTimeout(timeout);
    };
  }, [checkAuth, logout, isAuthenticated]);
  return null;
} 