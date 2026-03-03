'use client'

import { useEffect, useState, useCallback } from 'react'

// Định nghĩa kiểu Movie
interface Movie {
    id: number;
    title: string;
    duration: string;
    year: number | '';
    releaseDate?: string;
    director: string;
    cast: string[];
    genre: string;
    description: string;
    poster: string;
    backdrop: string;
    trailer: string;
    movieUrl: string;
    scenes: string[];
}

// Nguonc.com API types
interface NguoncEpisodeItem {
    name: string;
    slug: string;
    embed: string;
    m3u8: string;
}

interface NguoncEpisodeServer {
    server_name: string;
    items: NguoncEpisodeItem[];
}

interface NguoncCategory {
    [key: string]: {
        group: { id: string; name: string };
        list: { id: string; name: string }[];
    };
}

interface NguoncMovie {
    id: string;
    name: string;
    slug: string;
    original_name: string;
    thumb_url: string;
    poster_url: string;
    description: string;
    total_episodes: number;
    current_episode: string;
    time: string;
    quality: string;
    language: string;
    director: string;
    casts: string;
    episodes: NguoncEpisodeServer[];
    category?: NguoncCategory;
}

interface WatchNowMoviesServer3Props {
    movie: Movie;
    server1Ready?: boolean;
    onLinksChange?: (links: { vietsub: string; dubbed: string; m3u8: string }) => void;
    onLoadingChange?: (loading: boolean) => void;
    onSearchComplete?: (completed: boolean) => void;
}

// Nguonc.com search result item
interface NguoncSearchItem {
    name: string;
    slug: string;
    original_name: string;
    thumb_url: string;
    poster_url: string;
    total_episodes: number;
    current_episode: string;
    quality: string;
    language: string;
    director?: string;
}

// Helper: normalize text for comparison (strip special chars, lowercase)
function normalizeForCompare(text: string): string {
    return text
        .toLowerCase()
        .replace(/[:\-–—.,'"!?()\[\]{}]/g, ' ') // Replace special chars with space
        .replace(/\s+/g, ' ')                     // Collapse multiple spaces
        .trim();
}

// Helper: check if directors match (handles comma-separated lists)
function directorsMatch(tmdbDirector: string, nguoncDirector: string): boolean {
    if (!tmdbDirector || !nguoncDirector) return false;
    const normalize = (s: string) => s.toLowerCase().trim();
    const tmdbNames = tmdbDirector.split(',').map(normalize);
    const nguoncNames = nguoncDirector.split(',').map(normalize);
    return tmdbNames.some(t => nguoncNames.some(n => n.includes(t) || t.includes(n)));
}

// Function helper to check if strings are similar enough
function isSimilar(str1: string, str2: string): boolean {
    const s1 = str1.toLowerCase().replace(/[^a-z0-9]/g, '');
    const s2 = str2.toLowerCase().replace(/[^a-z0-9]/g, '');
    return s1.includes(s2) || s2.includes(s1);
}

// Helper: split title into parts and check if at least one matches
function hasPartialMatch(tmdbTitle: string, nguoncOriginalName: string, nguoncName: string): boolean {
    // split title into words/parts, ignoring special chars
    const getParts = (str: string) => str.toLowerCase().replace(/[:\-()]/g, ' ').split(/\s+/).filter(Boolean);

    const tmdbParts = getParts(tmdbTitle);
    const nguoncOriginalParts = getParts(nguoncOriginalName);
    const nguoncNameParts = getParts(nguoncName);

    // If any significant part matches, consider it a match
    return tmdbParts.some(part =>
        part.length > 3 && (nguoncOriginalParts.includes(part) || nguoncNameParts.includes(part))
    );
}

// Better title matching logic
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _isTitleMatch(tmdbTitle: string, nguoncOriginalName: string, nguoncName: string): boolean {
    // 1. Check strict similarity first
    if (isSimilar(tmdbTitle, nguoncOriginalName) || isSimilar(tmdbTitle, nguoncName)) {
        return true;
    }

    // 2. Try partial match (like main title words)
    if (hasPartialMatch(tmdbTitle, nguoncOriginalName, nguoncName)) {
        return true;
    }

    // 3. Very loose fallback - check if any part of the names overlap
    const tmdbNames = tmdbTitle.toLowerCase().split(/[:\-()\s]/).filter(Boolean);
    const nguoncNames = [nguoncOriginalName, nguoncName].join(' ').toLowerCase().split(/[:\-()\s]/).filter(Boolean);

    return tmdbNames.some(t => nguoncNames.some(n => n.includes(t) || t.includes(n)));
}
export default function WatchNowMoviesServer3({
    movie,
    server1Ready,
    onLinksChange,
    onLoadingChange,
    onSearchComplete
}: WatchNowMoviesServer3Props) {
    // Search state
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_searchInput, setSearchInput] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchCompleted, setSearchCompleted] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_searchError, setSearchError] = useState('');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_nguoncMovie, setNguoncMovie] = useState<NguoncMovie | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_searchResults, setSearchResults] = useState<NguoncSearchItem[]>([]);
    const [autoSearchDone, setAutoSearchDone] = useState(false);

    // Sync outward
    useEffect(() => {
        if (onLoadingChange) {
            onLoadingChange(isSearching);
        }
    }, [isSearching, onLoadingChange]);

    useEffect(() => {
        if (onSearchComplete) {
            onSearchComplete(searchCompleted);
        }
    }, [searchCompleted, onSearchComplete]);



    // Helper: extract episode links from nguonc movie data
    const extractMovieLinks = useCallback((movieData: NguoncMovie) => {
        let vietsubLink = '';
        let dubbedLink = '';
        let defaultLink = '';

        if (movieData.episodes && movieData.episodes.length > 0) {
            for (const server of movieData.episodes) {
                const serverName = server.server_name?.toLowerCase() || '';
                const isVietsub = serverName.includes('vietsub');
                const isDubbed = serverName.includes('lồng tiếng') || serverName.includes('thuyết minh') || serverName.includes('dubbed');

                if (server.items && server.items.length > 0) {
                    const item = server.items[0];
                    const link = item.embed || item.m3u8 || '';

                    if (isVietsub && !vietsubLink) {
                        vietsubLink = link;
                    } else if (isDubbed && !dubbedLink) {
                        dubbedLink = link;
                    } else if (!defaultLink) {
                        defaultLink = link;
                    }
                }
            }
        }

        if (!vietsubLink && !dubbedLink && defaultLink) {
            vietsubLink = defaultLink;
        }

        return { vietsub: vietsubLink, dubbed: dubbedLink, m3u8: defaultLink };
    }, []);

    // Fetch film detail by slug from nguonc.com
    const fetchFilmBySlug = useCallback(async (slug: string) => {
        const res = await fetch(`https://phim.nguonc.com/api/film/${encodeURIComponent(slug)}`);
        const data = await res.json();
        if (data.status === 'success' && data.movie) {
            return data.movie as NguoncMovie;
        }
        return null;
    }, []);

    // Helper: search nguonc.com API - fetches ALL pages to find exact match
    const searchNguonc = useCallback(async (keyword: string, targetOriginalName?: string, tmdbDirector?: string): Promise<NguoncSearchItem[]> => {
        const allItems: NguoncSearchItem[] = [];
        let page = 1;
        let totalPages = 1;

        while (page <= totalPages && page <= 5) {
            const res = await fetch(`https://phim.nguonc.com/api/films/search?keyword=${encodeURIComponent(keyword.trim())}&page=${page}`);
            const data = await res.json();
            if (data.status !== 'success' || !data.items || data.items.length === 0) break;

            const items = data.items as NguoncSearchItem[];
            allItems.push(...items);
            totalPages = data.paginate?.total_page || 1;

            // Early stop: only if name matches AND (no director info OR director also matches)
            if (targetOriginalName) {
                const target = normalizeForCompare(targetOriginalName);
                const nameMatch = items.find(i => normalizeForCompare(i.original_name || '') === target);
                if (nameMatch) {
                    if (!tmdbDirector || !nameMatch.director || directorsMatch(tmdbDirector, nameMatch.director)) {
                        break;
                    }
                }
            }

            if (totalPages <= 1) break;
            page++;
        }
        return allItems;
    }, []);

    // Search by keyword, then fetch film detail for the best match
    const searchAndFetch = useCallback(async (keyword: string) => {
        if (!keyword.trim()) return;

        setIsSearching(true);
        setSearchCompleted(false);
        setSearchError('');
        setNguoncMovie(null);
        setSearchResults([]);
        if (onLinksChange) onLinksChange({ vietsub: '', dubbed: '', m3u8: '' });

        try {
            const normalizedTitle = movie?.title?.toLowerCase().trim() || '';
            const cleanTitle = normalizeForCompare(movie?.title || '');
            const tmdbYear = movie?.year || (movie?.releaseDate ? parseInt(movie.releaseDate.substring(0, 4)) : 0);


            // Step 1: Search all pages by keyword, looking for exact original_name match
            let items = await searchNguonc(keyword.trim(), movie?.title, movie?.director);

            // Step 1a: If 0 results, try progressively shorter keywords
            if (items.length === 0) {
                const words = normalizeForCompare(keyword).split(' ').filter(w => w.length > 0);
                // Try removing words from the end: "Kraven the Hunter" → "Kraven the" → "Kraven"
                for (let len = words.length - 1; len >= 1; len--) {
                    const shorter = words.slice(0, len).join(' ');
                    items = await searchNguonc(shorter, movie?.title, movie?.director);
                    if (items.length > 0) {
                        break;
                    }
                }
            }

            // Step 1b: If still 0, try "title year"
            if (items.length === 0 && tmdbYear) {
                const yearKeyword = `${normalizeForCompare(keyword)} ${tmdbYear}`;
                items = await searchNguonc(yearKeyword, movie?.title, movie?.director);
            }

            // Filter items: exact name match (normalized)
            let nameMatches = items.filter((item) => {
                const origName = normalizeForCompare(item.original_name || '');
                const viName = item.name?.toLowerCase().trim() || '';
                return origName === cleanTitle || viName === normalizedTitle;
            });

            // If no exact match, try partial match (original_name contains or starts with TMDB title)
            if (nameMatches.length === 0 && cleanTitle.length > 0) {
                nameMatches = items.filter((item) => {
                    const origName = normalizeForCompare(item.original_name || '');
                    return origName.startsWith(cleanTitle + ' ') || origName.startsWith(cleanTitle + ':') || origName === cleanTitle;
                });
            }

            // Step 1c: If still no match, try "title year" search to find more results
            if (nameMatches.length === 0 && items.length > 0 && tmdbYear) {
                const retryItems = await searchNguonc(`${normalizeForCompare(keyword)} ${tmdbYear}`, movie?.title, movie?.director);
                if (retryItems.length > 0) {
                    const existingSlugs = new Set(items.map(i => i.slug));
                    for (const item of retryItems) {
                        if (!existingSlugs.has(item.slug)) {
                            items.push(item);
                            existingSlugs.add(item.slug);
                        }
                    }
                    // Re-check: exact, partial, or Vietnamese name with year
                    nameMatches = items.filter((item) => {
                        const origName = normalizeForCompare(item.original_name || '');
                        const viName = item.name?.toLowerCase().trim() || '';
                        return origName === cleanTitle || origName.startsWith(cleanTitle + ' ') ||
                            viName === normalizedTitle || viName === `${normalizedTitle} (${tmdbYear})`;
                    });
                }
            }

            if (items.length === 0) {
                setSearchError('No results found. Try a different keyword.');
                return;
            }

            setSearchResults(items);

            // Score and pick best match using name + year + director
            const tmdbDirector = movie?.director || '';
            let bestMatch = items[0];
            let bestScore = -1;

            const candidates = nameMatches.length > 0 ? nameMatches : items;
            for (const candidate of candidates) {
                let score = 0;
                const origName = normalizeForCompare(candidate.original_name || '');

                // Name scoring: exact = 3, partial = 1
                if (origName === cleanTitle) score += 3;
                else if (origName.startsWith(cleanTitle + ' ')) score += 1;

                // Director scoring: +2 if matches, -1 if mismatches
                if (tmdbDirector && candidate.director) {
                    if (directorsMatch(tmdbDirector, candidate.director)) {
                        score += 2;
                    } else {
                        score -= 1;
                    }
                }


                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = candidate;
                }
            }

            // For any match that isn't high confidence (score < 5), verify with year from detail API
            if (bestScore > 0 && bestScore < 5 && tmdbYear) {
                // Try best match first, then all name matches
                const toVerify = [bestMatch, ...nameMatches.filter(m => m.slug !== bestMatch.slug)];
                for (const candidate of toVerify) {
                    try {
                        const detail = await fetchFilmBySlug(candidate.slug);
                        if (detail?.category) {
                            const yearStr = Object.values(detail.category)
                                .find(cat => cat.group?.name === 'Năm')
                                ?.list?.[0]?.name;
                            if (yearStr && parseInt(yearStr) === tmdbYear) {
                                setNguoncMovie(detail);
                                const links = extractMovieLinks(detail);
                                if (onLinksChange) onLinksChange(links);
                                return;
                            }
                        }
                    } catch { /* skip */ }
                }
            }


            // If best match has high confidence (exact name + director match), load directly
            if (bestScore >= 5) {
                const filmData = await fetchFilmBySlug(bestMatch.slug);
                if (filmData) {
                    setNguoncMovie(filmData);
                    const links = extractMovieLinks(filmData);
                    if (onLinksChange) onLinksChange(links);
                    return;
                }
            }

            // If we got here, no verified match was found
            setSearchError('Movie not available on this server.');
        } catch {
            setSearchError('Search failed. Please try again.');
        } finally {
            setIsSearching(false);
            setSearchCompleted(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [movie?.title, movie?.year, movie?.releaseDate, fetchFilmBySlug, extractMovieLinks, searchNguonc, movie?.director]);

    // Select a specific search result
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _selectSearchResult = useCallback(async (item: NguoncSearchItem) => {
        setIsSearching(true);
        setSearchError('');
        if (onLinksChange) onLinksChange({ vietsub: '', dubbed: '', m3u8: '' });

        try {
            const filmData = await fetchFilmBySlug(item.slug);
            if (filmData) {
                setNguoncMovie(filmData);
                const links = extractMovieLinks(filmData);
                if (onLinksChange) onLinksChange(links);
            } else {
                setSearchError('Could not load movie details.');
            }
        } catch {
            setSearchError('Failed to load movie details.');
        } finally {
            setIsSearching(false);
        }
    }, [fetchFilmBySlug, extractMovieLinks, onLinksChange]);

    // Auto-search: wait for server1 to finish, then search by movie title
    useEffect(() => {
        if (autoSearchDone || !movie?.title || !server1Ready) return;
        setSearchInput(movie.title);
        searchAndFetch(movie.title);
        setAutoSearchDone(true);
    }, [movie?.title, autoSearchDone, searchAndFetch, server1Ready]);

    return null;
}
