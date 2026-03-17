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

// Guard to prevent duplicate checkAuth calls
let _checkAuthPromise: Promise<void> | null = null;

const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      loginError: null,
      registerError: null,

      login: async (credentials) => {
        try {
          set({ isLoading: true, loginError: null });
          const response = await api.post('/auth/login', credentials);
          const { token, user } = response.data;
          localStorage.setItem('token', token);
          localStorage.setItem('cached_user_data', JSON.stringify(user));
          set({
            user: user as User,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: unknown) {
          if (isAxiosError(error)) {
            set({
              loginError: error.response?.data?.message || 'An error occurred during login',
              isLoading: false,
            });
          } else {
            set({
              loginError: 'An unexpected error occurred during login',
              isLoading: false,
            });
          }
          throw error;
        }
      },

      loginWithGoogle: async ({ email, sub, name, avatar, email_verified }) => {
        try {
          set({ isLoading: true, loginError: null });
          const response = await api.post('/auth/google-login', {
            email,
            sub,
            name,
            avatar,
            email_verified,
          });
          const { token, user } = response.data;
          localStorage.setItem('token', token);
          localStorage.setItem('cached_user_data', JSON.stringify(user));
          set({
            user: user as User,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: unknown) {
          if (isAxiosError(error)) {
            set({
              loginError: error.response?.data?.message || 'An error occurred during Google login',
              isLoading: false,
            });
          } else {
            set({
              loginError: 'An unexpected error occurred during Google login',
              isLoading: false,
            });
          }
          throw error;
        }
      },

      register: async (credentials) => {
        try {
          set({ isLoading: true, registerError: null });
          console.log('Auth store: Sending registration request to:', api.defaults.baseURL + '/auth/register');
          const response = await api.post('/auth/register', credentials);
          console.log('Auth store: Registration response:', response.data);
          // Chỉ hiển thị thông báo, không tự đăng nhập
          set({ isLoading: false });
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
              registerError: error.response?.data?.message || 'An error occurred during registration',
              isLoading: false,
            });
          } else {
            set({
              registerError: 'An unexpected error occurred during registration',
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
        localStorage.removeItem('cached_user_data');
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
          loginError: null,
          registerError: null,
        });
      },

      clearError: () => set({ loginError: null, registerError: null }),

      checkAuth: async () => {
        // Deduplicate: if already checking, return existing promise
        if (_checkAuthPromise) return _checkAuthPromise;

        const doCheck = async () => {
          const token = localStorage.getItem('token');
          if (!token) {
            set({ user: null, token: null, isAuthenticated: false });
            return;
          }
          
          // Load cached user data immediately for instant display
          const cachedUserData = localStorage.getItem('cached_user_data');
          if (cachedUserData) {
            try {
              const cachedUser = JSON.parse(cachedUserData) as User;
              set({
                user: cachedUser,
                token,
                isAuthenticated: true,
                isLoading: true, // Still loading fresh data
              });
            } catch (error) {
              console.warn('Failed to parse cached user data:', error);
            }
          }
          
          try {
            // Gửi Authorization header vì không có cookies
            const response = await api.get('/auth/profile', {
              headers: { Authorization: `Bearer ${token}` },
            });
            const prof = response.data.user;
            const normalizedUser: User = {
              id: prof.id || prof._id,
              name: prof.name,
              email: prof.email,
              avatar: prof.avatar && prof.avatar.trim() !== '' ? prof.avatar : undefined,
              originalAvatar: prof.originalAvatar && prof.originalAvatar.trim() !== '' ? prof.originalAvatar : undefined,
              authType: prof.authType,
              createdAt: prof.createdAt,
              updatedAt: prof.updatedAt,
            };
            
            // Cache user data for next time
            localStorage.setItem('cached_user_data', JSON.stringify(normalizedUser));
            
            set({
              user: normalizedUser,
              token,
              isAuthenticated: true,
              isLoading: false,
            });
          } catch {
            localStorage.removeItem('token');
            localStorage.removeItem('cached_user_data');
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
        };

        _checkAuthPromise = doCheck().finally(() => { _checkAuthPromise = null; });
        return _checkAuthPromise;
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);

export default useAuthStore; 