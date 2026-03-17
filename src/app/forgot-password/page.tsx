'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const router = useRouter();

  // Countdown timer for resend button
  useEffect(() => {
    if (cooldownSeconds <= 0) return;

    const timer = setInterval(() => {
      setCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();

    // Simple email format check before calling API
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      toast.error('Email không hợp lệ');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post('/auth/forgot-password', { email: trimmedEmail });
      toast.success('Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi');
      setCooldownSeconds(60);
    } catch {
      // API đã che giấu sự tồn tại của email; chỉ hiển thị message chung
      toast.error('Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi');
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
          <h1 className="text-xl font-semibold text-yellow-200 mb-4 text-center">
            Quên mật khẩu
          </h1>
          <p className="text-sm text-yellow-100/80 mb-6 text-center">
            Nhập email đã đăng ký. Nếu tài khoản tồn tại, chúng tôi sẽ gửi liên kết đặt lại mật khẩu.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-yellow-200 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-4 py-3 bg-black/40 border border-yellow-700 rounded-lg text-white placeholder-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200"
                placeholder="Enter your email"
                required
                disabled={isSubmitting}
              />
            </div>
            <motion.button
              type="submit"
              disabled={isSubmitting || cooldownSeconds > 0}
              className="flex items-center justify-center px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-black font-semibold rounded-lg transition duration-200 ease-in-out shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed mx-auto min-w-[220px]"
              whileHover={{ scale: isSubmitting || cooldownSeconds > 0 ? 1 : 1.005 }}
              whileTap={{ scale: isSubmitting || cooldownSeconds > 0 ? 1 : 0.995 }}
            >
              {isSubmitting
                ? 'Đang gửi...'
                : cooldownSeconds > 0
                ? `Gửi lại sau ${cooldownSeconds}s`
                : 'Gửi hướng dẫn'}
            </motion.button>
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="block mx-auto mt-2 text-sm text-yellow-300 hover:text-yellow-100 transition-colors duration-200"
            >
              Quay lại đăng nhập
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

