import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import TVShowsClient from './TVShowsClient';
import { getRedisClient, buildCacheKey } from '@/lib/redis';

// TV Show type matching TMDB API response
interface TMDBTV {
  id: number;
  name: string;
  poster_path: string;
  vote_average: number;
  first_air_date?: string;
  original_language?: string;
  number_of_seasons?: number;
  number_of_episodes?: number;
  genre_ids?: number[];
}

interface TVShow {
  id: number;
  name: string;
  poster_path: string;
  image?: string;
  year?: number;
  genre?: string;
  first_air_date?: string;
  country?: string;
  totalSeasons?: number;
  totalEpisodes?: number;
}

const countryMap: { [key: string]: string } = {
  'en': 'USA', 'ja': 'Japan', 'ko': 'Korea', 'zh': 'China',
  'hi': 'India', 'fr': 'France', 'de': 'Germany', 'es': 'Spain',
  'it': 'Italy', 'pt': 'Brazil', 'ru': 'Russia', 'ar': 'Egypt',
  'th': 'Thailand', 'vi': 'Vietnam', 'id': 'Indonesia', 'ms': 'Malaysia',
  'tl': 'Philippines', 'my': 'Myanmar', 'km': 'Cambodia', 'lo': 'Laos'
};

/**
 * Server-side: Fetch first page of TV shows from Redis cache.
 * If Redis has data (pre-warmed by cron or previous visit), returns instantly.
 * This eliminates client-side loading spinner on initial page load.
 */
async function getInitialTVShows(): Promise<TVShow[]> {
  try {
    const redis = getRedisClient();
    if (!redis) return [];

    // Build the same cache key that /api/tmdb-proxy uses for discover/tv page 1
    const cacheKey = buildCacheKey('/discover/tv', {
      sort_by: 'popularity.desc',
      page: '1'
    });

    const cached = await redis.get<{ results: TMDBTV[] }>(cacheKey);
    if (!cached || !cached.results) return [];

    return cached.results.map((tvShow: TMDBTV) => ({
      id: tvShow.id,
      name: tvShow.name,
      poster_path: tvShow.poster_path,
      year: tvShow.first_air_date ? Number(tvShow.first_air_date.slice(0, 4)) : undefined,
      image: tvShow.poster_path ? `https://image.tmdb.org/t/p/w500${tvShow.poster_path}` : '',
      genre: '',
      first_air_date: tvShow.first_air_date,
      country: countryMap[tvShow.original_language || 'en'] || 'USA',
      totalSeasons: tvShow.number_of_seasons || 0,
      totalEpisodes: tvShow.number_of_episodes || 0,
    }));
  } catch (error) {
    console.error('Failed to fetch initial TV shows from Redis:', error);
    return [];
  }
}

export default async function TVShowsPage() {
  const [messages, initialTVShows] = await Promise.all([
    getMessages(),
    getInitialTVShows()
  ]);

  return (
    <NextIntlClientProvider messages={{ TVShows: messages.TVShows, Watchlist: messages.Watchlist, Filter: messages.Filter }}>
      <TVShowsClient initialTVShows={initialTVShows} />
    </NextIntlClientProvider>
  );
}
