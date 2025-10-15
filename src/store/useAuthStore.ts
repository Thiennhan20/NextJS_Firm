import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthState, LoginCredentials, RegisterCredentials, User } from '@/types/auth';
import api from '@/lib/axios';
import { isAxiosError } from 'axios';

interface AuthStore extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  checkAuth: () => Promise<void>;
  loginWithGoogle: (payload: { email: string; sub: string; name?: string; avatar?: string; email_verified?: boolean }) => Promise<void>;
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

      loginWithGoogle: async ({ email, sub, name, avatar, email_verified }) => {
        try {
          set({ isLoading: true, error: null });
          const response = await api.post('/auth/google-login', {
            email,
            sub,
            name,
            avatar,
            email_verified,
          });
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
              error: error.response?.data?.message || 'An error occurred during Google login',
              isLoading: false,
            });
          } else {
            set({
              error: 'An unexpected error occurred during Google login',
              isLoading: false,
            });
          }
          throw error;
        }
      },

      register: async (credentials) => {
        try {
          set({ isLoading: true, error: null });
          console.log('Auth store: Sending registration request to:', api.defaults.baseURL + '/auth/register');
          console.log('Auth store: Request data:', credentials);
          const response = await api.post('/auth/register', credentials);
          console.log('Auth store: Registration response:', response.data);
          // Chỉ hiển thị thông báo, không tự đăng nhập
          set({ isLoading: false });
          
          // Nếu có verification URL, lưu vào localStorage để hiển thị
          if (response.data.verificationUrl) {
            localStorage.setItem('verificationUrl', response.data.verificationUrl);
          }
        } catch (error: unknown) {
          console.error('Auth store: Registration error:', error);
          if (isAxiosError(error)) {
            console.error('Auth store: Axios error details:', {
              status: error.response?.status,
              data: error.response?.data,
              message: error.message,
              baseURL: api.defaults.baseURL
            });
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

      logout: async () => {
        try {
          // Gọi API logout để blacklist token và clear cookie
          await api.post('/auth/logout');
        } catch (error) {
          console.warn('Logout API call failed:', error);
        }
        
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
          // Gửi Authorization header vì không có cookies
          const response = await api.get('/auth/profile', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const prof = response.data.user;
          const normalizedUser: User = {
            id: prof.id || prof._id,
            name: prof.name,
            email: prof.email,
            createdAt: prof.createdAt,
            updatedAt: prof.updatedAt,
          };
          set({
            user: normalizedUser,
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