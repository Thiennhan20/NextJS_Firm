export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  originalAvatar?: string;
  authType?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  name: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginError: string | null;
  registerError: string | null;
  checkAuth: () => Promise<void>;
} 