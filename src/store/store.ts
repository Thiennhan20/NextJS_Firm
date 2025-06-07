import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

interface TemporaryWatchlistState {
  temporaryWatchlist: Movie[];
  addTemporarilyToWatchlist: (movie: Movie) => void;
  removeTemporarilyFromWatchlist: (movieId: number) => void;
  isTemporarilyInWatchlist: (movieId: number) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
    }
  )
);

export const useWatchlistStore = create<WatchlistState>()(
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
    }),
    {
      name: 'watchlist-storage',
    }
  )
);

export const useTemporaryWatchlistStore = create<TemporaryWatchlistState>()((set, get) => ({
  temporaryWatchlist: [],
  addTemporarilyToWatchlist: (movie) =>
    set((state) => ({
      temporaryWatchlist: [...state.temporaryWatchlist, movie],
    })),
  removeTemporarilyFromWatchlist: (movieId) =>
    set((state) => ({
      temporaryWatchlist: state.temporaryWatchlist.filter((movie) => movie.id !== movieId),
    })),
  isTemporarilyInWatchlist: (movieId) =>
    get().temporaryWatchlist.some((movie) => movie.id === movieId),
})); 