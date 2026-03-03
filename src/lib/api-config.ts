// API Configuration - Centralized API base URL management

export const API_BASE = '/api/tmdb-proxy';

// Helper function to build TMDB API URLs
export function buildTMDBUrl(endpoint: string, params?: Record<string, string | number>): string {
  const searchParams = new URLSearchParams({
    endpoint,
    ...Object.fromEntries(
      Object.entries(params || {}).map(([key, value]) => [key, String(value)])
    )
  });

  return `${API_BASE}?${searchParams.toString()}`;
}