import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import useAuthStore from '@/store/useAuthStore';
import { LoginCredentials } from '@/types/auth';
import { motion } from 'framer-motion';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { FaGoogle, FaFacebook } from 'react-icons/fa';
import axios from 'axios';

const LoadingSpinner = () => (
  <div className="flex items-center justify-center">
    <motion.div
      className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full"
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    />
  </div>
);

export default function LoginForm() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [formData, setFormData] = useState<LoginCredentials>({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(formData);
      toast.success('Đăng nhập thành công!');
      router.push('/');
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Đăng nhập thất bại!');
      } else {
        toast.error('An unexpected error occurred during login.');
      }
    }
  };

  const inputVariants = {
    rest: { scale: 1, borderColor: '#B8860B' }, // Dark Gold border
    hover: { scale: 1.01, borderColor: '#FFD700' }, // Gold accent on hover
    focus: { scale: 1.01, borderColor: '#FFD700', boxShadow: '0 0 0 3px rgba(255, 215, 0, 0.3)' }, // Soft gold glow on focus
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto p-6 bg-gradient-to-br from-red-900/80 to-black/80 backdrop-blur-lg rounded-xl shadow-2xl border border-yellow-600 transform transition-all duration-300 hover:shadow-yellow-500/50"
    >
      <h2 className="text-3xl font-bold text-center mb-8 text-yellow-400 drop-shadow-lg">Login</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
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
          <div className="text-right text-sm">
            <a href="#" className="font-medium text-yellow-300 hover:text-yellow-100 transition-colors duration-200">
              Forgot password?
            </a>
          </div>
        </div>
        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}
        <motion.button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 bg-yellow-600 hover:bg-yellow-700 text-black font-semibold rounded-lg transition duration-200 ease-in-out transform hover:scale-[1.01] shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed"
          whileHover={{ scale: 1.01, boxShadow: '0 8px 30px -5px rgba(255, 215, 0, 0.6)' }}
          whileTap={{ scale: 0.99 }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <LoadingSpinner />
              <span>Đang đăng nhập...</span>
            </div>
          ) : (
            'Đăng nhập'
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
        <div className="grid grid-cols-2 gap-4">
          <motion.button
            type="button"
            className="flex items-center justify-center w-full py-3 px-4 bg-gray-700 hover:bg-gray-800 text-white font-semibold rounded-lg transition duration-200 ease-in-out transform hover:scale-[1.01] shadow-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-black"
            whileHover={{ scale: 1.01, boxShadow: '0 5px 15px -5px rgba(0, 0, 0, 0.4)' }}
            whileTap={{ scale: 0.99 }}
            disabled={isLoading}
          >
            <FaGoogle className="w-5 h-5 mr-2" />
            Google
          </motion.button>
          <motion.button
            type="button"
            className="flex items-center justify-center w-full py-3 px-4 bg-blue-800 hover:bg-blue-900 text-white font-semibold rounded-lg transition duration-200 ease-in-out transform hover:scale-[1.01] shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black"
            whileHover={{ scale: 1.01, boxShadow: '0 5px 15px -5px rgba(0, 0, 255, 0.4)' }}
            whileTap={{ scale: 0.99 }}
            disabled={isLoading}
          >
            <FaFacebook className="w-5 h-5 mr-2" />
            Facebook
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
} 