import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthState, LoginCredentials, RegisterCredentials, User } from '@/types/auth';
import api from '@/lib/axios';
import { isAxiosError } from 'axios';

interface AuthStore extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  checkAuth: () => Promise<void>;
}

const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials) => {
        try {
          set({ isLoading: true, error: null });
          const response = await api.post('/auth/login', credentials);
          const { token, user } = response.data;
          localStorage.setItem('token', token);
          set({
            user: user as User,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: unknown) {
          if (isAxiosError(error)) {
            set({
              error: error.response?.data?.message || 'An error occurred during login',
              isLoading: false,
            });
          } else {
            set({
              error: 'An unexpected error occurred during login',
              isLoading: false,
            });
          }
          throw error;
        }
      },

      register: async (credentials) => {
        try {
          set({ isLoading: true, error: null });
          await api.post('/auth/register', credentials);
          // Chỉ hiển thị thông báo, không tự đăng nhập
          set({ isLoading: false });
        } catch (error: unknown) {
          if (isAxiosError(error)) {
            set({
              error: error.response?.data?.message || 'An error occurred during registration',
              isLoading: false,
            });
          } else {
            set({
              error: 'An unexpected error occurred during registration',
              isLoading: false,
            });
          }
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        // Clear watchlist khi logout - import trong function để tránh circular dependency
        try {
          import('./store').then(({ useWatchlistStore }) => {
            const { clearWatchlist } = useWatchlistStore.getState();
            clearWatchlist();
          });
        } catch (error) {
          console.warn('Could not clear watchlist:', error);
        }
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      clearError: () => set({ error: null }),

      checkAuth: async () => {
        const token = localStorage.getItem('token');
        if (!token) {
          set({ user: null, token: null, isAuthenticated: false });
          return;
        }
        try {
          set({ isLoading: true, error: null });
          // You may need to adjust the endpoint to match your backend's user/profile endpoint
          const response = await api.get('/auth/profile', {
            headers: { Authorization: `Bearer ${token}` },
          });
          set({
            user: response.data.user as User,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch {
          localStorage.removeItem('token');
          // Clear watchlist khi token không hợp lệ
          try {
            import('./store').then(({ useWatchlistStore }) => {
              const { clearWatchlist } = useWatchlistStore.getState();
              clearWatchlist();
            });
          } catch (error) {
            console.warn('Could not clear watchlist:', error);
          }
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);

export default useAuthStore; 