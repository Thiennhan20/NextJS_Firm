import { create } from 'zustand'

export interface RecentlyWatchedItem {
  id: string
  server: string
  audio: string
  currentTime: number
  duration?: number
  title?: string
  poster?: string
  lastWatched?: string
  isTVShow?: boolean
  season?: number
  episode?: number
}

interface RecentlyWatchedStore {
  /** Cached items from server (page 1 — shared between Home & Recently Watched) */
  cachedItems: RecentlyWatchedItem[]
  /** Timestamp of last fetch */
  lastFetchedAt: number
  /** Set cached items (called after API fetch) */
  setCachedItems: (items: RecentlyWatchedItem[]) => void
  /** Update a single item's progress in the cache (called after video player saves) */
  upsertItem: (item: RecentlyWatchedItem) => void
  /** Remove an item from the cache */
  removeItem: (id: string, isTVShow?: boolean, season?: number, episode?: number) => void
  /** Clear entire cache (on logout) */
  clearCache: () => void
  /** Check if cache is still fresh (within given ms, default 60s) */
  isFresh: (maxAgeMs?: number) => boolean
}

export const useRecentlyWatchedStore = create<RecentlyWatchedStore>((set, get) => ({
  cachedItems: [],
  lastFetchedAt: 0,

  setCachedItems: (items) => set({ cachedItems: items, lastFetchedAt: Date.now() }),

  upsertItem: (item) => set((state) => {
    const idx = state.cachedItems.findIndex(
      (i) => i.id === item.id && i.isTVShow === item.isTVShow &&
        i.season === item.season && i.episode === item.episode
    )
    const updated = [...state.cachedItems]
    if (idx >= 0) {
      updated[idx] = { ...updated[idx], ...item, lastWatched: new Date().toISOString() }
    } else {
      // New item — prepend (most recent first)
      updated.unshift({ ...item, lastWatched: new Date().toISOString() })
    }
    return { cachedItems: updated }
  }),

  removeItem: (id, isTVShow, season, episode) => set((state) => ({
    cachedItems: state.cachedItems.filter(
      (i) => !(i.id === id && i.isTVShow === !!isTVShow && i.season === season && i.episode === episode)
    )
  })),

  clearCache: () => set({ cachedItems: [], lastFetchedAt: 0 }),

  isFresh: (maxAgeMs = 60_000) => {
    const { lastFetchedAt } = get()
    return lastFetchedAt > 0 && (Date.now() - lastFetchedAt) < maxAgeMs
  }
}))
