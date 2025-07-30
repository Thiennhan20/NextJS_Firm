import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/axios';

interface Movie {
  id: number;
  title: string;
  poster_path: string;
}

interface WatchlistState {
  watchlist: Movie[];
  addToWatchlist: (movie: Movie) => void;
  removeFromWatchlist: (movieId: number) => void;
  isInWatchlist: (movieId: number) => boolean;
  clearWatchlist: () => void;
}

interface UIState {
  isNavDropdownOpen: boolean;
  setNavDropdownOpen: (isOpen: boolean) => void;
}



export const useWatchlistStore = create<WatchlistState & {
  fetchWatchlistFromServer: (token: string) => Promise<void>;
}>()(
  persist(
    (set, get) => ({
      watchlist: [],
      addToWatchlist: (movie) =>
        set((state) => ({
          watchlist: [...state.watchlist, movie],
        })),
      removeFromWatchlist: (movieId) =>
        set((state) => ({
          watchlist: state.watchlist.filter((movie) => movie.id !== movieId),
        })),
      isInWatchlist: (movieId) =>
        get().watchlist.some((movie) => movie.id === movieId),
      clearWatchlist: () => set({ watchlist: [] }),
      fetchWatchlistFromServer: async (token) => {
        if (!token) {
          set({ watchlist: [] });
          return;
        }
        try {
          const response = await api.get('/auth/watchlist', {
            headers: { Authorization: `Bearer ${token}` },
          });
          set({ watchlist: response.data.watchlist || [] });
        } catch {
          set({ watchlist: [] });
        }
      },
    }),
    {
      name: 'watchlist-storage',
    }
  )
);

export const useUIStore = create<UIState>()((set) => ({
  isNavDropdownOpen: false,
  setNavDropdownOpen: (isOpen) => set({ isNavDropdownOpen: isOpen }),
}));