"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/useAuthStore";

const LEGACY_TOKEN_KEYS = ["token", "accessToken", "refreshToken"];

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
      logout(); // Xóa state user
      router.replace("/login"); // Chuyển về trang login
    }
  }, [logout, router]);
  return null;
} 