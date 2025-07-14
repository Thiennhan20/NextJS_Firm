"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/useAuthStore";

const LEGACY_TOKEN_KEYS = ["token", "accessToken", "refreshToken", "auth-storage", "user"];

export default function ClearLegacyToken() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    let found = false;
    LEGACY_TOKEN_KEYS.forEach((key) => {
      if (typeof window !== "undefined" && localStorage.getItem(key)) {
        localStorage.removeItem(key);
        found = true;
      }
    });
    if (found) {
      logout();
      // Xóa lại toàn bộ localStorage liên quan user/token
      LEGACY_TOKEN_KEYS.forEach((key) => localStorage.removeItem(key));
      // Reload lại trang để chắc chắn state sạch
      window.location.replace("/login");
    }
  }, [logout, router]);
  return null;
} 