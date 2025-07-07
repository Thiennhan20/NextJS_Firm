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
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials) => {
        try {
          set({ isLoading: true, error: null });
          const response = await api.post('/auth/login', credentials);
          const { token, user } = response.data;
          console.log('LOGIN RESPONSE USER:', user);
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
          const response = await api.post('/auth/register', credentials);
          console.log('REGISTER RESPONSE DATA:', response.data);
          if (response.data.token && response.data.user) {
            set({
              user: response.data.user as User,
              token: response.data.token,
              isAuthenticated: true,
              isLoading: false,
            });
            localStorage.setItem('token', response.data.token);
          } else {
            const loginFn = useAuthStore.getState().login;
            await loginFn({
              email: credentials.email,
              password: credentials.password,
            });
            set({ isLoading: false });
          }
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
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore; 