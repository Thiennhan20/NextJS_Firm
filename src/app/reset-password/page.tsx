'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  // Validate token on mount to avoid showing form when link is invalid/used/expired
  useEffect(() => {
    const validate = async () => {
      if (!email || !token) {
        setTokenError('Liên kết không hợp lệ hoặc đã hết hạn');
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
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Liên kết đã hết hiệu lực. Vui lòng thử lại';
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
      toast.error(tokenError || 'Liên kết không hợp lệ hoặc đã hết hạn');
      return;
    }

    if (!email || !token) {
      toast.error('Liên kết không hợp lệ hoặc đã hết hạn');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Xác nhận mật khẩu không khớp');
      return;
    }

    if (!validatePassword(newPassword)) {
      toast.error('Mật khẩu phải có tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt');
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
      toast.success('Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại');
      setTimeout(() => router.push('/login'), 1200);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Không thể đặt lại mật khẩu. Vui lòng thử lại';
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
            <p className="text-center text-yellow-100">Đang kiểm tra liên kết...</p>
          ) : !isTokenValid ? (
            <div className="space-y-4 text-center">
              <h1 className="text-xl font-semibold text-yellow-200 mb-2">
                Liên kết không hợp lệ
              </h1>
              <p className="text-sm text-yellow-100/80 mb-4">
                {tokenError}
              </p>
              <button
                type="button"
                onClick={() => router.push('/forgot-password')}
                className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-black font-semibold rounded-lg transition duration-200 ease-in-out shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-black mx-auto min-w-[220px]"
              >
                Yêu cầu liên kết mới
              </button>
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="block mx-auto mt-2 text-sm text-yellow-300 hover:text-yellow-100 transition-colors duration-200"
              >
                Quay lại đăng nhập
              </button>
            </div>
          ) : (
            <>
          <h1 className="text-xl font-semibold text-yellow-200 mb-4 text-center">
            Đặt lại mật khẩu
          </h1>
          <p className="text-sm text-yellow-100/80 mb-6 text-center">
            Nhập mật khẩu mới cho tài khoản {email ? <span className="font-semibold">{email}</span> : 'của bạn'}.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-yellow-200 mb-1">
                Mật khẩu mới
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 block w-full px-4 py-3 bg-black/40 border border-yellow-700 rounded-lg text-white placeholder-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200"
                placeholder="Nhập mật khẩu mới"
                required
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-yellow-200 mb-1">
                Xác nhận mật khẩu
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full px-4 py-3 bg-black/40 border border-yellow-700 rounded-lg text-white placeholder-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200"
                placeholder="Nhập lại mật khẩu mới"
                required
                disabled={isSubmitting}
              />
            </div>
            <p className="text-xs text-yellow-100/70">
              Mật khẩu phải có tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
            </p>
            <motion.button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center justify-center px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-black font-semibold rounded-lg transition duration-200 ease-in-out shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed mx-auto min-w-[220px]"
              whileHover={{ scale: isSubmitting ? 1 : 1.005 }}
              whileTap={{ scale: isSubmitting ? 1 : 0.995 }}
            >
              {isSubmitting ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
            </motion.button>
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="block mx-auto mt-2 text-sm text-yellow-300 hover:text-yellow-100 transition-colors duration-200"
            >
              Quay lại đăng nhập
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
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4 bg-black">
        <p className="text-yellow-100">Đang tải...</p>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}

