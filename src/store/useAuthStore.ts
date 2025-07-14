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
}

const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials) => {
        try {
          set({ isLoading: true, error: null });
          const response = await api.post('/auth/login', credentials);
          const { user } = response.data;
          set({
            user: user as User,
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
          const response = await api.post('/auth/register', credentials);
          const { user } = response.data;
          set({
            user: user as User,
            isAuthenticated: true,
            isLoading: false,
          });
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

      logout: async () => {
        await api.post('/auth/logout');
        set({
          user: null,
          isAuthenticated: false,
          error: null,
        });
        // Xóa toàn bộ thông tin user trong localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth-storage'); // key persist của Zustand
          localStorage.removeItem('user'); // nếu có
          localStorage.removeItem('token'); // nếu có
          localStorage.removeItem('accessToken'); // nếu có
          localStorage.removeItem('refreshToken'); // nếu có
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore; 