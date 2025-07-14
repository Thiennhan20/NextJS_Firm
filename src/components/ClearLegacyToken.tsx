"use client";

import { useEffect } from "react";

const LEGACY_TOKEN_KEYS = ["token", "accessToken", "refreshToken"];

export default function ClearLegacyToken() {
  useEffect(() => {
    LEGACY_TOKEN_KEYS.forEach((key) => {
      if (typeof window !== "undefined" && localStorage.getItem(key)) {
        localStorage.removeItem(key);
      }
    });
  }, []);
  return null;
} 