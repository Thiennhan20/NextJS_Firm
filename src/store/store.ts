import { create } from 'zustand';
import api from '@/lib/axios';

interface User {
  id: string;
  email: string;
  name: string;
}

interface Movie {
  id: number;
  title: string;
  poster_path: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

interface WatchlistState {
  watchlist: Movie[];
  addToWatchlist: (movie: Movie) => void;
  removeFromWatchlist: (movieId: number) => void;
  isInWatchlist: (movieId: number) => boolean;
}

interface UIState {
  isNavDropdownOpen: boolean;
  setNavDropdownOpen: (isOpen: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  (set) => ({
    user: null,
    isAuthenticated: false,
    login: (user) => set({ user, isAuthenticated: true }),
    logout: () => set({ user: null, isAuthenticated: false }),
  })
);

export const useWatchlistStore = create<WatchlistState & {
  fetchWatchlistFromServer: () => Promise<void>;
  clearWatchlist: () => void;
}>()(
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
    fetchWatchlistFromServer: async () => {
      try {
        const response = await api.get('/auth/watchlist');
        set({ watchlist: response.data.watchlist || [] });
      } catch {
        set({ watchlist: [] });
      }
    },
    clearWatchlist: () => set({ watchlist: [] }),
  })
);

export const useUIStore = create<UIState>()((set) => ({
  isNavDropdownOpen: false,
  setNavDropdownOpen: (isOpen) => set({ isNavDropdownOpen: isOpen }),
}));