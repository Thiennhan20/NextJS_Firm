'use client'

import { useEffect, useState, useCallback } from 'react'

// Định nghĩa kiểu TVShow
interface TVShow {
    id: number
    name: string
    duration: string
    year: number | ''
    firstAirDate?: string
    creator: string
    cast: string[]
    genre: string
    description: string
    poster: string
    backdrop: string
    trailer: string
    tvShowUrl: string
    scenes: string[]
    totalSeasons?: number
    totalEpisodes?: number
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

// Helper: normalize text for comparison (strip special chars, lowercase)
function normalizeForCompare(text: string): string {
    return text
        .toLowerCase()
        .replace(/[:\-–—.,'"!?()\[\]{}]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

// Helper: check if a search result's name/slug contains a season number
function extractSeasonFromTitle(name: string, slug: string): number | null {
    const text = `${name} ${slug}`.toLowerCase();
    // Match patterns: "phần 2", "phan 2", "season 2", "mùa 2", "mua 2", "s02", "s2"
    const patterns = [
        /ph[aầ]n\s*(\d+)/i,
        /season\s*(\d+)/i,
        /m[uù]a\s*(\d+)/i,
        /\bs(\d{1,2})\b/i,
    ];
    for (const p of patterns) {
        const m = text.match(p);
        if (m) return parseInt(m[1]);
    }
    // Check trailing number in slug: "toan-chuc-phap-su-2" -> season 2
    const slugTrailing = slug.match(/-(\d+)$/);
    if (slugTrailing) return parseInt(slugTrailing[1]);
    // Check trailing number in name: "Toàn Chức Pháp Sư 2" -> season 2
    const nameTrailing = name.trim().match(/\s(\d+)$/);
    if (nameTrailing) return parseInt(nameTrailing[1]);
    return null;
}

// Helper: check if a title/slug contains any season indicator (including trailing number)
function titleContainsSeason(name: string, slug?: string): boolean {
    const text = name.toLowerCase();
    if (/ph[aầ]n\s*\d/i.test(text) ||
        /season\s*\d/i.test(text) ||
        /m[uù]a\s*\d/i.test(text) ||
        /\bs\d{1,2}\b/i.test(text) ||
        /\s\d+$/.test(name.trim())) return true;
    if (slug && /-(\d+)$/.test(slug)) return true;
    return false;
}
interface WatchNowTVShowsServer3Props {
    tvShow: TVShow;
    selectedSeason: number;
    selectedEpisode: number;
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

export default function WatchNowTVShowsServer3({
    tvShow,
    selectedSeason,
    selectedEpisode,
    server1Ready,
    onLinksChange,
    onLoadingChange,
    onSearchComplete
}: WatchNowTVShowsServer3Props) {
    // Search state
    const [isSearching, setIsSearching] = useState(false);
    const [searchCompleted, setSearchCompleted] = useState(false);
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

    // Cache episodes data for quick episode switching
    const [cachedEpisodes, setCachedEpisodes] = useState<NguoncEpisodeServer[] | null>(null);

    // Extract links for a specific episode from cached episodes data
    const extractLinksForEpisode = useCallback((episodes: NguoncEpisodeServer[], episodeNumber: number) => {
        let vietsubLink = '';
        let dubbedLink = '';
        let defaultLink = '';

        for (const server of episodes) {
            const serverName = server.server_name?.toLowerCase() || '';
            const isVietsub = serverName.includes('vietsub');
            const isDubbed = serverName.includes('lồng tiếng') || serverName.includes('thuyết minh') || serverName.includes('dubbed');

            if (server.items && server.items.length > 0) {
                // Find the specific episode by matching name
                const targetItem = server.items.find((item) => {
                    const itemName = item.name?.toLowerCase() || '';
                    const epStr = String(episodeNumber);
                    const epStrPadded = episodeNumber.toString().padStart(2, '0');

                    return itemName === epStr ||
                        itemName === epStrPadded ||
                        itemName === `tập ${epStr}` ||
                        itemName === `tập ${epStrPadded}` ||
                        itemName === `tap-${epStr}` ||
                        itemName === `tap-${epStrPadded}` ||
                        item.slug === `tap-${epStr}` ||
                        item.slug === `tap-${epStrPadded}`;
                });

                if (targetItem) {
                    const link = targetItem.embed || targetItem.m3u8 || '';

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

        // If no categorized links found but default exists
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

    // Load film data and extract episode links
    const loadFilmData = useCallback(async (slug: string) => {
        const filmData = await fetchFilmBySlug(slug);
        if (filmData) {
            if (filmData.episodes) {
                setCachedEpisodes(filmData.episodes);
                const links = extractLinksForEpisode(filmData.episodes, selectedEpisode);
                if (onLinksChange) onLinksChange(links);
            }
            return true;
        }
        return false;
    }, [fetchFilmBySlug, extractLinksForEpisode, selectedEpisode, onLinksChange]);

    // Helper: search nguonc.com API - fetches ALL pages to find exact match
    const searchNguonc = useCallback(async (keyword: string, targetOriginalName?: string): Promise<NguoncSearchItem[]> => {
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

            // Early stop if we find an exact name match
            if (targetOriginalName) {
                const target = normalizeForCompare(targetOriginalName);
                const nameMatch = items.find(i => normalizeForCompare(i.original_name || '') === target);
                if (nameMatch) break;
            }

            if (totalPages <= 1) break;
            page++;
        }
        return allItems;
    }, []);

    // Search by keyword, then fetch film detail for the best match (TV show: name + year + season)
    const searchAndFetch = useCallback(async (keyword: string) => {
        if (!keyword.trim()) return;

        setIsSearching(true);
        setSearchCompleted(false);
        setCachedEpisodes(null);

        try {
            const normalizedTitle = tvShow?.name?.toLowerCase().trim() || '';
            const cleanTitle = normalizeForCompare(tvShow?.name || '');
            const tmdbYear = tvShow?.year || (tvShow?.firstAirDate ? parseInt(tvShow.firstAirDate.substring(0, 4)) : 0);
            const season = selectedSeason || 1;

            // Step 1: Search by keyword
            let items = await searchNguonc(keyword.trim(), tvShow?.name);

            // Step 1a: If season > 1, also try "title season X" and "title phần X" keywords
            if (season > 1) {
                const seasonKeywords = [
                    `${keyword.trim()} ${season}`,
                    `${keyword.trim()} phần ${season}`,
                    `${keyword.trim()} season ${season}`,
                    `${keyword.trim()} mùa ${season}`,
                ];
                for (const sk of seasonKeywords) {
                    const extra = await searchNguonc(sk, tvShow?.name);
                    const existingSlugs = new Set(items.map(i => i.slug));
                    for (const item of extra) {
                        if (!existingSlugs.has(item.slug)) {
                            items.push(item);
                            existingSlugs.add(item.slug);
                        }
                    }
                }
            }

            // Step 1b: If 0 results, try progressively shorter keywords
            if (items.length === 0) {
                const words = normalizeForCompare(keyword).split(' ').filter(w => w.length > 0);
                for (let len = words.length - 1; len >= 1; len--) {
                    const shorter = words.slice(0, len).join(' ');
                    items = await searchNguonc(shorter, tvShow?.name);
                    if (items.length > 0) break;
                }
            }

            // Step 1c: If still 0, try "title year"
            if (items.length === 0 && tmdbYear) {
                const yearKeyword = `${normalizeForCompare(keyword)} ${tmdbYear}`;
                items = await searchNguonc(yearKeyword, tvShow?.name);
            }

            if (items.length === 0) {
                return;
            }

            // Filter items: name match (normalized, checking each comma-separated alias in original_name)
            const nameMatches = items.filter((item) => {
                const viName = item.name?.toLowerCase().trim() || '';
                if (viName === normalizedTitle) return true;
                // Split original_name by comma and check each alias
                const aliases = (item.original_name || '').split(',').map(a => normalizeForCompare(a));
                return aliases.some(alias =>
                    alias === cleanTitle ||
                    alias.startsWith(cleanTitle + ' ') ||
                    alias.startsWith(cleanTitle + ':')
                );
            });

            // If no name match, use all items as candidates
            const candidates = nameMatches.length > 0 ? nameMatches : items;

            // Score and pick best match using name + season
            let bestMatch = candidates[0];
            let bestScore = -1;

            for (const candidate of candidates) {
                let score = 0;
                const viName = candidate.name?.toLowerCase().trim() || '';
                // Split original_name by comma and find best alias match
                const aliases = (candidate.original_name || '').split(',').map(a => normalizeForCompare(a));
                const hasExactAlias = aliases.some(a => a === cleanTitle);
                const hasPartialAlias = aliases.some(a => a.startsWith(cleanTitle + ' ') || a.startsWith(cleanTitle + ':'));

                // Name scoring: exact = 3, partial = 1
                if (hasExactAlias || viName === normalizedTitle) score += 3;
                else if (hasPartialAlias) score += 1;

                // Season scoring: check if the result's title/slug contains the right season
                const detectedSeason = extractSeasonFromTitle(candidate.name || '', candidate.slug || '');
                if (season === 1) {
                    // For season 1: prefer entries WITHOUT a season number (they're usually S1)
                    // or entries explicitly marked as season 1
                    if (detectedSeason === null && !titleContainsSeason(candidate.name || '', candidate.slug || '')) {
                        score += 3; // No season indicator = likely season 1
                    } else if (detectedSeason === 1) {
                        score += 3; // Explicitly season 1
                    } else if (detectedSeason !== null && detectedSeason !== 1) {
                        score -= 5; // Wrong season
                    }
                } else {
                    // For season > 1: require matching season number
                    if (detectedSeason === season) {
                        score += 5; // Exact season match
                    } else if (detectedSeason !== null && detectedSeason !== season) {
                        score -= 5; // Wrong season
                    } else {
                        score -= 2; // No season indicator for a non-S1 request
                    }
                }

                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = candidate;
                }
            }

            // Verify with detail API: check year and ensure episodes exist
            if (tmdbYear) {
                const toVerify = [bestMatch, ...candidates.filter(m => m.slug !== bestMatch.slug).slice(0, 3)];
                for (const candidate of toVerify) {
                    try {
                        const detail = await fetchFilmBySlug(candidate.slug);
                        if (detail?.category) {
                            const yearStr = Object.values(detail.category)
                                .find(cat => cat.group?.name === 'Năm')
                                ?.list?.[0]?.name;
                            const yearMatch = yearStr ? parseInt(yearStr) === tmdbYear : false;
                            // Also check season from the detail title
                            const detailSeason = extractSeasonFromTitle(detail.name || '', detail.slug || '');
                            const seasonMatch = season === 1
                                ? (detailSeason === null || detailSeason === 1)
                                : detailSeason === season;

                            if ((yearMatch || !tmdbYear) && seasonMatch && detail.episodes) {
                                setCachedEpisodes(detail.episodes);
                                const links = extractLinksForEpisode(detail.episodes, selectedEpisode);
                                if (onLinksChange) onLinksChange(links);
                                return;
                            }
                        }
                    } catch { /* skip */ }
                }
            }

            // Fallback: load best match directly if score is decent
            if (bestScore >= 3) {
                const success = await loadFilmData(bestMatch.slug);
                if (success) {
                    return;
                }
            }

        } catch {
        } finally {
            setIsSearching(false);
            setSearchCompleted(true);
        }
    }, [tvShow?.name, tvShow?.year, tvShow?.firstAirDate, selectedSeason, fetchFilmBySlug, loadFilmData, extractLinksForEpisode, selectedEpisode, searchNguonc, onLinksChange]);

    // Select a specific search result
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _selectSearchResult = useCallback(async (item: NguoncSearchItem) => {
        setIsSearching(true);
        if (onLinksChange) onLinksChange({ vietsub: '', dubbed: '', m3u8: '' });
        setCachedEpisodes(null);

        try {
            await loadFilmData(item.slug);
        } catch {
        } finally {
            setIsSearching(false);
        }
    }, [loadFilmData, onLinksChange]);

    // Auto-search: wait for server1 to finish, then search by TV show name
    useEffect(() => {
        if (autoSearchDone || !tvShow?.name || !server1Ready) return;
        searchAndFetch(tvShow.name);
        setAutoSearchDone(true);
    }, [tvShow?.name, autoSearchDone, searchAndFetch, server1Ready]);

    // Re-search when season changes (different season = different entry on nguonc.com)
    useEffect(() => {
        if (!autoSearchDone || !tvShow?.name) return;
        setCachedEpisodes(null);
        if (onLinksChange) onLinksChange({ vietsub: '', dubbed: '', m3u8: '' });
        searchAndFetch(tvShow.name);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedSeason]);

    // When episode changes, extract links from cached data
    useEffect(() => {
        if (cachedEpisodes && selectedEpisode > 0) {
            const links = extractLinksForEpisode(cachedEpisodes, selectedEpisode);
            if (onLinksChange) onLinksChange(links);
        }
    }, [selectedEpisode, cachedEpisodes, extractLinksForEpisode, onLinksChange]);

    return null;
}
