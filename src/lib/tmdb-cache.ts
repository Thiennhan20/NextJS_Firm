/**
 * TMDB API fetch helper with caching - Using Next.js proxy to backend server
 * Reduces API calls and improves performance
 */

interface FetchOptions {
  revalidate?: number // Cache duration in seconds
  cache?: RequestCache
}

const API_BASE = '/api/tmdb-proxy';

/**
 * Fetch data from TMDB API via backend server with caching
 * @param endpoint - API endpoint (e.g., '/movie/popular')
 * @param params - Query parameters
 * @param options - Fetch options with cache configuration
 */
export async function fetchTMDB<T>(
  endpoint: string,
  params: Record<string, string | number> = {},
  options: FetchOptions = {}
): Promise<T> {
  const { revalidate = 300, cache = 'force-cache' } = options

  // Build query parameters
  const searchParams = new URLSearchParams({
    endpoint,
    ...Object.fromEntries(
      Object.entries(params).map(([key, value]) => [key, String(value)])
    )
  });

  const url = `${API_BASE}?${searchParams.toString()}`;

  try {
    const response = await fetch(url, {
      next: { revalidate }, // ISR cache
      cache, // Browser cache
    })

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`)
    }

    return response.json()
  } catch (error) {
    console.error('TMDB fetch error:', error)
    throw error
  }
}

/**
 * Presets for common cache durations
 */
export const CachePresets = {
  SHORT: { revalidate: 60 }, // 1 minute
  MEDIUM: { revalidate: 300 }, // 5 minutes
  LONG: { revalidate: 3600 }, // 1 hour
  VERY_LONG: { revalidate: 86400 }, // 24 hours
}
