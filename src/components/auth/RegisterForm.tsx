import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import useAuthStore from '@/store/useAuthStore';
import { RegisterCredentials } from '@/types/auth';
import { motion } from 'framer-motion';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import axios from 'axios';
import { useWatchlistStore } from '@/store/store';

const LoadingSpinner = () => (
  <div className="flex items-center justify-center">
    <motion.div
      className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full"
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    />
  </div>
);


// (FocusReturnReset removed: loading only starts after provider success)

const GoogleRegisterButton = () => {
  const router = useRouter();
  const { fetchWatchlistFromServer } = useWatchlistStore();
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID as string | undefined;
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    setLoading(true);
    try {
      // Send the credential (ID token) directly to server
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:3001/api' : '')}/auth/google-login`,
        { credential: credentialResponse.credential }
      );

      const { token, user } = response.data;
      localStorage.setItem('token', token);
      useAuthStore.setState({ user, token, isAuthenticated: true });

      if (token) await fetchWatchlistFromServer(token);
      toast.success('Google registration successful');
      setLoading(false);
      router.push('/');
    } catch (err: unknown) {
      const errorMessage = (err as { response?: { data?: { message?: string } }; message?: string }).response?.data?.message || (err as { response?: { data?: { message?: string } }; message?: string }).message;
      toast.error(`Google registration failed: ${errorMessage}`);
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    toast.error('Google registration failed');
    // loading only starts on success; nothing to stop here
  };

  if (!googleClientId) {
    return (
      <motion.button
        type="button"
        className="flex items-center justify-center w-full py-3 px-4 bg-gray-700 text-white font-semibold rounded-lg opacity-60 cursor-not-allowed"
        disabled
      >
        Google (missing client id)
      </motion.button>
    );
  }

  return (
    <>
      {/* Hidden Google Login component */}
      <div ref={googleButtonRef} className="hidden">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
        />
      </div>

      {/* Custom compact button */}
      <motion.button
        type="button"
        onClick={() => {
          // Trigger Google OAuth popup
          const googleButton = googleButtonRef.current?.querySelector('div[role=\"button\"]') as HTMLElement;
          if (googleButton) {
            googleButton.click();
          } else {
            toast.error('Google is not ready. Please try again.');
          }
        }}
        disabled={loading}
        className="flex items-center justify-center px-5 py-2 bg-white text-black font-semibold rounded-lg transition duration-200 ease-in-out shadow-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed mx-auto min-w-[220px]"
        whileHover={{ scale: 1.005 }}
        whileTap={{ scale: 0.995 }}
      >
        {loading ? (
          <div className="flex items-center justify-center space-x-2">
            <LoadingSpinner />
            <span>Signing up...</span>
          </div>
        ) : (
          <>
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Google
          </>
        )}
      </motion.button>

    </>
  );
};

export default function RegisterForm() {
  const router = useRouter();
  const { register, isLoading, registerError, clearError } = useAuthStore();
  const [formData, setFormData] = useState<RegisterCredentials>({
    name: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (registerError) clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(formData);
      toast.success('Please check your email to verify your account!');
      router.push(`/verify-email-info?email=${encodeURIComponent(formData.email)}`);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Registration failed!');
      } else {
        toast.error('An unexpected error occurred during registration.');
      }
    }
  };

  const inputVariants = {
    rest: { scale: 1 },
    hover: { scale: 1.005 },
    focus: { scale: 1.005 },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-sm mx-auto p-6 bg-gradient-to-br from-red-900/80 to-black/80 backdrop-blur-lg rounded-xl shadow-2xl border border-yellow-600"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-yellow-200 mb-1">
            Username
          </label>
          <motion.input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="mt-1 block w-full px-4 py-3 bg-black/40 border border-yellow-700 rounded-lg text-white placeholder-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200 appearance-none"
            placeholder="Enter your name"
            required
            disabled={isLoading}
            variants={inputVariants}
            whileHover="hover"
            whileFocus="focus"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-yellow-200 mb-1">
            Email
          </label>
          <motion.input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="mt-1 block w-full px-4 py-3 bg-black/40 border border-yellow-700 rounded-lg text-white placeholder-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200 appearance-none"
            placeholder="Enter your email"
            required
            disabled={isLoading}
            variants={inputVariants}
            whileHover="hover"
            whileFocus="focus"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-yellow-200 mb-1">
            Password
          </label>
          <div className="relative">
            <motion.input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="mt-1 block w-full px-4 py-3 bg-black/40 border border-yellow-700 rounded-lg text-white placeholder-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200 pr-10 appearance-none"
              placeholder="Enter your password"
              required
              disabled={isLoading}
              variants={inputVariants}
              whileHover="hover"
              whileFocus="focus"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-yellow-500 hover:text-yellow-300 focus:outline-none transition-colors duration-200"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              disabled={isLoading}
            >
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
        {registerError && (
          <div className="text-red-500 text-sm">{registerError}</div>
        )}
        <motion.button
          type="submit"
          disabled={isLoading}
          className="flex items-center justify-center px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-black font-semibold rounded-lg transition duration-200 ease-in-out shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed mx-auto min-w-[220px]"
          whileHover={{ scale: 1.005 }}
          whileTap={{ scale: 0.995 }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <LoadingSpinner />
              <span>Registering...</span>
            </div>
          ) : (
            'Register'
          )}
        </motion.button>
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-yellow-700"></span>
          </div>
          <div className="relative flex justify-center text-sm font-medium leading-6">
            <span className="bg-gradient-to-br from-red-900/80 to-black/80 px-4 text-yellow-200">Or continue with</span>
          </div>
        </div>
        <div className="flex items-center justify-center w-full">
          <GoogleRegisterButton />
        </div>
      </form>
    </motion.div>
  );
} 