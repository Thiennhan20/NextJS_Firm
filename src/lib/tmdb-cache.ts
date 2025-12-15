/**
 * TMDB API fetch helper with caching
 * Reduces API calls and improves performance
 */

const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'

interface FetchOptions {
  revalidate?: number // Cache duration in seconds
  cache?: RequestCache
}

/**
 * Fetch data from TMDB API with caching
 * @param endpoint - API endpoint (e.g., '/movie/popular')
 * @param options - Fetch options with cache configuration
 */
export async function fetchTMDB<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { revalidate = 300, cache = 'force-cache' } = options

  const url = `${TMDB_BASE_URL}${endpoint}${
    endpoint.includes('?') ? '&' : '?'
  }api_key=${TMDB_API_KEY}`

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
