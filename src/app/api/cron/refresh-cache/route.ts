import { NextResponse } from 'next/server';
import { getRedisClient, buildCacheKey, getTTLForEndpoint } from '@/lib/redis';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const CRON_SECRET = process.env.CRON_SECRET;

/**
 * All TMDB endpoints used on the homepage
 * These will be pre-fetched and cached in Redis
 */
const HOMEPAGE_ENDPOINTS: { endpoint: string; params: Record<string, string> }[] = [
  // Trending (HeroMovies, TrendingMovies)
  { endpoint: '/trending/movie/week', params: {} },
  { endpoint: '/trending/tv/week', params: {} },
  { endpoint: '/trending/movie/day', params: {} },
  { endpoint: '/trending/tv/day', params: {} },

  // Action
  { endpoint: '/discover/movie', params: { with_genres: '28', sort_by: 'popularity.desc' } },
  { endpoint: '/discover/tv', params: { with_genres: '10759', sort_by: 'popularity.desc' } },

  // Horror
  { endpoint: '/discover/movie', params: { with_genres: '27', sort_by: 'popularity.desc' } },
  { endpoint: '/discover/tv', params: { with_genres: '9648', sort_by: 'popularity.desc' } },

  // Anime (Japanese animation)
  { endpoint: '/discover/movie', params: { with_genres: '16', with_original_language: 'ja', sort_by: 'popularity.desc' } },
  { endpoint: '/discover/tv', params: { with_genres: '16', with_original_language: 'ja', sort_by: 'popularity.desc' } },

  // Korean
  { endpoint: '/discover/movie', params: { with_original_language: 'ko', sort_by: 'popularity.desc' } },
  { endpoint: '/discover/tv', params: { with_original_language: 'ko', sort_by: 'popularity.desc' } },

  // US/UK
  { endpoint: '/discover/movie', params: { with_original_language: 'en', region: 'US', sort_by: 'popularity.desc' } },
  { endpoint: '/discover/tv', params: { with_original_language: 'en', with_origin_country: 'US|GB', sort_by: 'popularity.desc' } },

  // China
  { endpoint: '/discover/movie', params: { with_original_language: 'zh', sort_by: 'popularity.desc' } },
  { endpoint: '/discover/tv', params: { with_original_language: 'zh', sort_by: 'popularity.desc' } },
];

/**
 * Fetch data from TMDB API directly
 */
async function fetchFromTMDB(endpoint: string, params: Record<string, string>): Promise<object | null> {
  if (!TMDB_API_KEY) return null;

  try {
    const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
    url.searchParams.set('api_key', TMDB_API_KEY);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    const response = await fetch(url.toString(), {
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Compare two objects to check if data has changed
 * Uses JSON string comparison (simple but effective for our use case)
 */
function hasDataChanged(oldData: unknown, newData: unknown): boolean {
  return JSON.stringify(oldData) !== JSON.stringify(newData);
}

/**
 * Cron job: Refresh all homepage TMDB cache in Redis
 * 
 * Runs 3 times per day (configured in vercel.json):
 * - 05:00 UTC (12:00 VN)
 * - 12:00 UTC (19:00 VN)
 * - 20:00 UTC (03:00 VN next day)
 * 
 * Logic:
 * 1. Fetch fresh data from TMDB for each endpoint
 * 2. Compare with existing Redis data
 * 3. Only write to Redis if data has changed (saves commands)
 */
export async function GET(request: Request) {
  // Verify cron secret (prevent unauthorized access)
  const authHeader = request.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const redis = getRedisClient();
  if (!redis) {
    return NextResponse.json({ error: 'Redis not configured' }, { status: 500 });
  }

  if (!TMDB_API_KEY) {
    return NextResponse.json({ error: 'TMDB API key not configured' }, { status: 500 });
  }

  const startTime = Date.now();
  const results: { key: string; status: 'updated' | 'skipped' | 'failed' }[] = [];

  console.log(`\n🔄 [${new Date().toISOString()}] Starting cache refresh...`);

  for (const { endpoint, params } of HOMEPAGE_ENDPOINTS) {
    const cacheKey = buildCacheKey(endpoint, params);

    try {
      // 1. Fetch fresh data from TMDB
      const freshData = await fetchFromTMDB(endpoint, params);
      if (!freshData) {
        results.push({ key: cacheKey, status: 'failed' });
        console.log(`  ❌ ${cacheKey} — TMDB fetch failed`);
        continue;
      }

      // 2. Get existing data from Redis
      const existingData = await redis.get<object>(cacheKey);

      // 3. Compare — only write if data changed
      if (existingData && !hasDataChanged(existingData, freshData)) {
        results.push({ key: cacheKey, status: 'skipped' });
        console.log(`  ⏭️  ${cacheKey} — no change, skipped`);
        continue;
      }

      // 4. Data changed (or new) → write to Redis
      const ttl = getTTLForEndpoint(endpoint);
      await redis.set(cacheKey, freshData, { ex: ttl });
      results.push({ key: cacheKey, status: 'updated' });
      console.log(`  ✅ ${cacheKey} — updated (TTL: ${ttl}s)`);

    } catch (error) {
      results.push({ key: cacheKey, status: 'failed' });
      console.error(`  ❌ ${cacheKey} — error:`, error);
    }

    // Small delay to avoid TMDB rate limiting (40 req/10s)
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  const duration = Date.now() - startTime;
  const updated = results.filter(r => r.status === 'updated').length;
  const skipped = results.filter(r => r.status === 'skipped').length;
  const failed = results.filter(r => r.status === 'failed').length;

  const summary = {
    timestamp: new Date().toISOString(),
    duration: `${duration}ms`,
    total: results.length,
    updated,
    skipped,
    failed,
    results,
  };

  console.log(`\n📊 Cache refresh complete: ${updated} updated, ${skipped} skipped, ${failed} failed (${duration}ms)\n`);

  return NextResponse.json(summary);
}
