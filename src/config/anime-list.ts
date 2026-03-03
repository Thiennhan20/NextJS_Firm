/**
 * Anime Configuration File
 * 
 * This file contains a list of anime series that should use the AnimeEpisodePlayer
 * instead of the regular season-based TV show player.
 * 
 * Add anime by TMDB ID or name to this list to enable continuous episode display.
 */

export interface AnimeConfig {
    tmdbId: number
    name: string
    totalEpisodes?: number
    // Episode to season/arc mapping (optional)
    episodeMapping?: Array<{
        start: number
        end: number
        season: number
        name: string
    }>
}

/**
 * List of anime series that should use AnimeEpisodePlayer
 * 
 * To add a new anime:
 * 1. Find its TMDB ID (from the URL when viewing the show on your site)
 * 2. Add an entry to this array with tmdbId and name
 * 3. Optionally add totalEpisodes and episodeMapping for arc names
 */
export const ANIME_LIST: AnimeConfig[] = [
    {
        tmdbId: 37854,
        name: "One Piece",
        totalEpisodes: 1155,
        episodeMapping: [
            { start: 1, end: 61, season: 1, name: "East Blue" },
            { start: 62, end: 92, season: 2, name: "Baroque Works" },
            { start: 93, end: 106, season: 3, name: "Drum Island" },
            { start: 107, end: 145, season: 4, name: "Alabasta" },
            { start: 146, end: 210, season: 5, name: "Sky Island" },
            { start: 211, end: 278, season: 6, name: "Water 7" },
            { start: 279, end: 351, season: 7, name: "Enies Lobby" },
            { start: 352, end: 396, season: 8, name: "Thriller Bark" },
            { start: 397, end: 436, season: 9, name: "Sabaody" },
            { start: 437, end: 551, season: 10, name: "Marineford" },
            { start: 552, end: 609, season: 11, name: "Fish-Man Island" },
            { start: 610, end: 671, season: 12, name: "Punk Hazard" },
            { start: 672, end: 777, season: 13, name: "Dressrosa" },
            { start: 778, end: 832, season: 14, name: "Zou" },
            { start: 833, end: 920, season: 15, name: "Whole Cake Island" },
            { start: 921, end: 1117, season: 16, name: "Wano Country" },
            { start: 1118, end: 1155, season: 17, name: "Egghead" }
        ]
    },
    // Add more anime here
    // {
    //   tmdbId: 1429,
    //   name: "Naruto",
    //   totalEpisodes: 220,
    // },
    // {
    //   tmdbId: 31910,
    //   name: "Naruto Shippuden",
    //   totalEpisodes: 500,
    // },
    // {
    //   tmdbId: 46260,
    //   name: "Bleach",
    //   totalEpisodes: 366,
    // },
    // {
    //   tmdbId: 1396,
    //   name: "Detective Conan",
    //   totalEpisodes: 1000,
    // },
]

/**
 * Check if a TV show is in the anime list
 */
export function isAnimeInList(tmdbId: number): boolean {
    return ANIME_LIST.some(anime => anime.tmdbId === tmdbId)
}

/**
 * Get anime config by TMDB ID
 */
export function getAnimeConfig(tmdbId: number): AnimeConfig | undefined {
    return ANIME_LIST.find(anime => anime.tmdbId === tmdbId)
}

/**
 * Get total episodes for an anime (from config or fallback to provided value)
 */
export function getAnimeTotalEpisodes(tmdbId: number, fallback?: number): number {
    const config = getAnimeConfig(tmdbId)
    return config?.totalEpisodes || fallback || 0
}

/**
 * Get episode mapping for an anime
 */
export function getAnimeEpisodeMapping(tmdbId: number): AnimeConfig['episodeMapping'] {
    const config = getAnimeConfig(tmdbId)
    return config?.episodeMapping || []
}
