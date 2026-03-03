// TMDB API Client - Using Next.js proxy to backend server

const API_BASE = '/api/tmdb-proxy';

export interface TMDBRequestOptions {
  endpoint: string;
  params?: Record<string, string | number>;
}

export async function tmdbFetch<T>({ endpoint, params = {} }: TMDBRequestOptions): Promise<T> {
  const searchParams = new URLSearchParams({
    endpoint,
    ...Object.fromEntries(
      Object.entries(params).map(([key, value]) => [key, String(value)])
    )
  });

  const response = await fetch(`${API_BASE}?${searchParams.toString()}`);

  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.statusText}`);
  }

  return response.json();
}

// Helper functions
export const tmdb = {
  movie: {
    details: (id: number, params?: Record<string, string>) =>
      tmdbFetch({ endpoint: `/movie/${id}`, params }),
    
    popular: (page = 1) =>
      tmdbFetch({ endpoint: '/movie/popular', params: { page } }),
    
    trending: (timeWindow: 'day' | 'week' = 'week') =>
      tmdbFetch({ endpoint: `/trending/movie/${timeWindow}` }),
    
    upcoming: (page = 1) =>
      tmdbFetch({ endpoint: '/movie/upcoming', params: { page } }),
    
    nowPlaying: (page = 1) =>
      tmdbFetch({ endpoint: '/movie/now_playing', params: { page } }),
    
    topRated: (page = 1) =>
      tmdbFetch({ endpoint: '/movie/top_rated', params: { page } }),
    
    similar: (id: number, page = 1) =>
      tmdbFetch({ endpoint: `/movie/${id}/similar`, params: { page } }),
    
    recommendations: (id: number, page = 1) =>
      tmdbFetch({ endpoint: `/movie/${id}/recommendations`, params: { page } }),
    
    credits: (id: number) =>
      tmdbFetch({ endpoint: `/movie/${id}/credits` }),
    
    videos: (id: number) =>
      tmdbFetch({ endpoint: `/movie/${id}/videos` }),
  },

  tv: {
    details: (id: number, params?: Record<string, string>) =>
      tmdbFetch({ endpoint: `/tv/${id}`, params }),
    
    popular: (page = 1) =>
      tmdbFetch({ endpoint: '/tv/popular', params: { page } }),
    
    trending: (timeWindow: 'day' | 'week' = 'week') =>
      tmdbFetch({ endpoint: `/trending/tv/${timeWindow}` }),
    
    airingToday: (page = 1) =>
      tmdbFetch({ endpoint: '/tv/airing_today', params: { page } }),
    
    onTheAir: (page = 1) =>
      tmdbFetch({ endpoint: '/tv/on_the_air', params: { page } }),
    
    topRated: (page = 1) =>
      tmdbFetch({ endpoint: '/tv/top_rated', params: { page } }),
    
    similar: (id: number, page = 1) =>
      tmdbFetch({ endpoint: `/tv/${id}/similar`, params: { page } }),
    
    recommendations: (id: number, page = 1) =>
      tmdbFetch({ endpoint: `/tv/${id}/recommendations`, params: { page } }),
    
    credits: (id: number) =>
      tmdbFetch({ endpoint: `/tv/${id}/credits` }),
    
    videos: (id: number) =>
      tmdbFetch({ endpoint: `/tv/${id}/videos` }),
    
    season: (id: number, seasonNumber: number) =>
      tmdbFetch({ endpoint: `/tv/${id}/season/${seasonNumber}` }),
  },

  search: {
    multi: (query: string, page = 1) =>
      tmdbFetch({ endpoint: '/search/multi', params: { query, page } }),
    
    movie: (query: string, page = 1) =>
      tmdbFetch({ endpoint: '/search/movie', params: { query, page } }),
    
    tv: (query: string, page = 1) =>
      tmdbFetch({ endpoint: '/search/tv', params: { query, page } }),
  },

  discover: {
    movie: (params: Record<string, string | number>) =>
      tmdbFetch({ endpoint: '/discover/movie', params }),
    
    tv: (params: Record<string, string | number>) =>
      tmdbFetch({ endpoint: '/discover/tv', params }),
  },
};
