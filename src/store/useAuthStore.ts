import { create } from 'zustand';
import { LoginCredentials, RegisterCredentials, User } from '@/types/auth';
import api from '@/lib/axios';
import { isAxiosError } from 'axios';
import { useWatchlistStore } from './store';

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

const useAuthStore = create<AuthStore>()(
  (set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,

    login: async (credentials) => {
      set({ isLoading: true, error: null });
      try {
        // Gọi API đăng nhập, server sẽ set cookie HTTP-only
        const response = await api.post('/auth/login', credentials, { withCredentials: true });
        set({
          user: response.data.user,
          isAuthenticated: true,
          isLoading: false,
        });
        useWatchlistStore.getState().fetchWatchlistFromServer();
      } catch (error: unknown) {
        set({
          error: (isAxiosError(error) && error.response?.data?.message) || 'An error occurred during login',
          isLoading: false,
        });
        throw error;
      }
    },
    register: async (credentials) => {
      set({ isLoading: true, error: null });
      try {
        await api.post('/auth/register', credentials, { withCredentials: true });
        set({ isLoading: false });
      } catch (error: unknown) {
        set({
          error: (isAxiosError(error) && error.response?.data?.message) || 'An error occurred during registration',
          isLoading: false,
        });
        throw error;
      }
    },
    logout: async () => {
      set({ isLoading: true, error: null });
      try {
        await api.post('/auth/logout', {}, { withCredentials: true });
        set({ user: null, isAuthenticated: false, isLoading: false });
        useWatchlistStore.getState().clearWatchlist();
      } catch (error: unknown) {
        set({
          error: (isAxiosError(error) && error.response?.data?.message) || 'An error occurred during logout',
          isLoading: false,
        });
        useWatchlistStore.getState().clearWatchlist();
      }
    },
    checkAuth: async () => {
      try {
        const response = await api.get('/auth/profile', { withCredentials: true });
        if (response.data && response.data.user) {
          set({ user: response.data.user, isAuthenticated: true });
          useWatchlistStore.getState().fetchWatchlistFromServer();
        } else {
          // Nếu không hợp lệ, gọi logout để server clear cookie
          await api.post('/auth/logout', {}, { withCredentials: true });
          set({ user: null, isAuthenticated: false });
          useWatchlistStore.getState().clearWatchlist();
        }
      } catch {
        // Nếu lỗi, cũng gọi logout để server clear cookie
        try {
          await api.post('/auth/logout', {}, { withCredentials: true });
        } catch {}
        set({ user: null, isAuthenticated: false });
        useWatchlistStore.getState().clearWatchlist();
      }
    },
    clearError: () => set({ error: null }),
  })
);

export default useAuthStore; 