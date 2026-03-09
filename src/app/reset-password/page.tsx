'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  // Validate token on mount to avoid showing form when link is invalid/used/expired
  useEffect(() => {
    const validate = async () => {
      if (!email || !token) {
        setTokenError('Invalid or expired link');
        setIsTokenValid(false);
        setIsValidating(false);
        return;
      }
      try {
        setIsValidating(true);
        await api.get('/auth/check-reset-token', {
          params: { email, token },
        });
        setIsTokenValid(true);
        setTokenError(null);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        const message =
          err?.response?.data?.message ||
          'Link has expired. Please try again';
        setIsTokenValid(false);
        setTokenError(message);
      } finally {
        setIsValidating(false);
      }
    };

    validate();
  }, [email, token]);

  const validatePassword = (value: string) => {
    const hasMinLength = value.length >= 8;
    const hasUpper = /[A-Z]/.test(value);
    const hasLower = /[a-z]/.test(value);
    const hasDigit = /[0-9]/.test(value);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);
    return hasMinLength && hasUpper && hasLower && hasDigit && hasSpecial;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isTokenValid) {
      toast.error(tokenError || 'Invalid or expired link');
      return;
    }

    if (!email || !token) {
      toast.error('Invalid or expired link');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!validatePassword(newPassword)) {
      toast.error('Password must be at least 8 characters, including uppercase, lowercase, number and special character');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post('/auth/reset-password', {
        email,
        token,
        newPassword,
        confirmPassword,
      });
      toast.success('Password reset successfully. Please log in again');
      setTimeout(() => router.push('/login'), 1200);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        'Unable to reset password. Please try again';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-black relative overflow-hidden">
      <div className="relative z-10 w-full max-w-sm">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full mx-auto p-6 bg-gradient-to-br from-red-900/80 to-black/80 backdrop-blur-lg rounded-xl shadow-2xl border border-yellow-600"
        >
          {isValidating ? (
            <p className="text-center text-yellow-100">Validating link...</p>
          ) : !isTokenValid ? (
            <div className="space-y-4 text-center">
              <h1 className="text-xl font-semibold text-yellow-200 mb-2">
                Invalid Link
              </h1>
              <p className="text-sm text-yellow-100/80 mb-4">
                {tokenError}
              </p>
              <button
                type="button"
                onClick={() => router.push('/forgot-password')}
                className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-black font-semibold rounded-lg transition duration-200 ease-in-out shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-black mx-auto min-w-[220px]"
              >
                Request New Link
              </button>
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="block mx-auto mt-2 text-sm text-yellow-300 hover:text-yellow-100 transition-colors duration-200"
              >
                Back to Login
              </button>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-semibold text-yellow-200 mb-4 text-center">
                Reset Password
              </h1>
              <p className="text-sm text-yellow-100/80 mb-6 text-center">
                Enter a new password for {email ? <span className="font-semibold">{email}</span> : 'your account'}.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-yellow-200 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="mt-1 block w-full px-4 py-3 bg-black/40 border border-yellow-700 rounded-lg text-white placeholder-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200 pr-10"
                      placeholder="Enter new password"
                      required
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-yellow-500 hover:text-yellow-300 focus:outline-none transition-colors duration-200"
                      aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                      disabled={isSubmitting}
                    >
                      {showNewPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-yellow-200 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="mt-1 block w-full px-4 py-3 bg-black/40 border border-yellow-700 rounded-lg text-white placeholder-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200 pr-10"
                      placeholder="Re-enter new password"
                      required
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-yellow-500 hover:text-yellow-300 focus:outline-none transition-colors duration-200"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      disabled={isSubmitting}
                    >
                      {showConfirmPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-yellow-100/70">
                  Password must be at least 8 characters, including uppercase, lowercase, number and special character.
                </p>
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center justify-center px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-black font-semibold rounded-lg transition duration-200 ease-in-out shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed mx-auto min-w-[220px]"
                  whileHover={{ scale: isSubmitting ? 1 : 1.005 }}
                  whileTap={{ scale: isSubmitting ? 1 : 0.995 }}
                >
                  {isSubmitting ? 'Updating...' : 'Update Password'}
                </motion.button>
                <button
                  type="button"
                  onClick={() => router.push('/login')}
                  className="block mx-auto mt-2 text-sm text-yellow-300 hover:text-yellow-100 transition-colors duration-200"
                >
                  Back to Login
                </button>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-4 bg-black relative overflow-hidden">
          <div className="relative z-10 w-full max-w-sm">
            <div className="w-full mx-auto p-6 bg-gradient-to-br from-red-900/80 to-black/80 backdrop-blur-lg rounded-xl shadow-2xl border border-yellow-600 text-center">
              <div className="w-8 h-8 border-4 border-yellow-600 border-t-transparent flex justify-center items-center rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-yellow-100">Loading...</p>
            </div>
          </div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}

