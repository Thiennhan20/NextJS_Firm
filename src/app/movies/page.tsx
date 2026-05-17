import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import MoviesClient from './MoviesClient';
import { getRedisClient, buildCacheKey } from '@/lib/redis';

// Movie type matching TMDB API response
interface TMDBMovie {
  id: number;
  title: string;
  poster_path: string;
  vote_average: number;
  release_date?: string;
  original_language?: string;
  genre_ids?: number[];
}

interface Movie {
  id: number;
  title: string;
  poster_path: string;
  image?: string;
  year?: number;
  genre?: string;
  release_date?: string;
  country?: string;
}

const countryMap: { [key: string]: string } = {
  'en': 'USA', 'ja': 'Japan', 'ko': 'Korea', 'zh': 'China',
  'hi': 'India', 'fr': 'France', 'de': 'Germany', 'es': 'Spain',
  'it': 'Italy', 'pt': 'Brazil', 'ru': 'Russia', 'ar': 'Egypt',
  'th': 'Thailand', 'vi': 'Vietnam', 'id': 'Indonesia', 'ms': 'Malaysia',
  'tl': 'Philippines', 'my': 'Myanmar', 'km': 'Cambodia', 'lo': 'Laos'
};

/**
 * Server-side: Fetch first page of movies from Redis cache.
 * If Redis has data (pre-warmed by cron or previous visit), returns instantly.
 * This eliminates client-side loading spinner on initial page load.
 */
async function getInitialMovies(): Promise<Movie[]> {
  try {
    const redis = getRedisClient();
    if (!redis) return [];

    // Build the same cache key that /api/tmdb-proxy uses for discover/movie page 1
    const cacheKey = buildCacheKey('/discover/movie', {
      sort_by: 'popularity.desc',
      page: '1'
    });

    const cached = await redis.get<{ results: TMDBMovie[] }>(cacheKey);
    if (!cached || !cached.results) return [];

    return cached.results.map((movie: TMDBMovie) => ({
      id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path,
      year: movie.release_date ? Number(movie.release_date.slice(0, 4)) : undefined,
      image: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '',
      genre: '',
      release_date: movie.release_date,
      country: countryMap[movie.original_language || 'en'] || 'USA',
    }));
  } catch (error) {
    console.error('Failed to fetch initial movies from Redis:', error);
    return [];
  }
}

export default async function MoviesPage() {
  const [messages, initialMovies] = await Promise.all([
    getMessages(),
    getInitialMovies()
  ]);

  return (
    <NextIntlClientProvider messages={{ Movies: messages.Movies, Watchlist: messages.Watchlist, Filter: messages.Filter }}>
      <MoviesClient initialMovies={initialMovies} />
    </NextIntlClientProvider>
  );
}
