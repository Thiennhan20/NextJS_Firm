import { useState } from 'react';
import { useAuthStore } from '@/store/store';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { FaGoogle, FaFacebook } from 'react-icons/fa';

export default function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const login = useAuthStore((state) => state.login);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Mật khẩu không khớp!');
      return;
    }
    if (!agreedToTerms) {
      toast.error('Bạn phải đồng ý với Điều khoản & Điều kiện!');
      return;
    }

    if (email && name && password) {
      // For demo purposes, we'll just create a mock user
      login({
        id: '1',
        email,
        name,
      });
      toast.success('Đăng ký thành công!');
    } else {
      toast.error('Đăng ký thất bại. Vui lòng điền đầy đủ thông tin.');
    }
  };

  const inputVariants = {
    rest: { scale: 1, borderColor: '#B8860B' },
    hover: { scale: 1.01, borderColor: '#FFD700' },
    focus: { scale: 1.01, borderColor: '#FFD700', boxShadow: '0 0 0 3px rgba(255, 215, 0, 0.3)' },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto p-6 bg-gradient-to-br from-red-900/80 to-black/80 backdrop-blur-lg rounded-xl shadow-2xl border border-yellow-600 transform transition-all duration-300 hover:shadow-yellow-500/50"
    >
      <h2 className="text-3xl font-bold text-center mb-8 text-yellow-400 drop-shadow-lg">Register</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-yellow-200 mb-1">
            Name
          </label>
          <motion.input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full px-4 py-3 bg-black/40 border border-yellow-700 rounded-lg text-white placeholder-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200 appearance-none"
            placeholder="Enter your name"
            required
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full px-4 py-3 bg-black/40 border border-yellow-700 rounded-lg text-white placeholder-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200 appearance-none"
            placeholder="Enter your email"
            required
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-4 py-3 bg-black/40 border border-yellow-700 rounded-lg text-white placeholder-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200 pr-10 appearance-none"
              placeholder="Enter your password"
              required
              variants={inputVariants}
              whileHover="hover"
              whileFocus="focus"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-yellow-500 hover:text-yellow-300 focus:outline-none transition-colors duration-200"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
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
            <motion.input
              type={showPassword ? 'text' : 'password'}
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full px-4 py-3 bg-black/40 border border-yellow-700 rounded-lg text-white placeholder-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200 pr-10 appearance-none"
              placeholder="Confirm your password"
              required
              variants={inputVariants}
              whileHover="hover"
              whileFocus="focus"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-yellow-500 hover:text-yellow-300 focus:outline-none transition-colors duration-200"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
        <div className="flex items-center">
          <input
            id="terms"
            name="terms"
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
            required
          />
          <label htmlFor="terms" className="ml-2 block text-sm text-yellow-200">
            I agree to the
            <a href="#" className="font-medium text-yellow-300 hover:text-yellow-100 ml-1">Terms & Conditions</a>
          </label>
        </div>
        <motion.button
          type="submit"
          className="w-full py-3 px-4 bg-yellow-600 hover:bg-yellow-700 text-black font-semibold rounded-lg transition duration-200 ease-in-out transform hover:scale-[1.01] shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-black"
          whileHover={{ scale: 1.01, boxShadow: '0 8px 30px -5px rgba(255, 215, 0, 0.6)' }}
          whileTap={{ scale: 0.99 }}
        >
          Register
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
          >
            <FaGoogle className="w-5 h-5 mr-2" />
            Google
          </motion.button>
          <motion.button
            type="button"
            className="flex items-center justify-center w-full py-3 px-4 bg-blue-800 hover:bg-blue-900 text-white font-semibold rounded-lg transition duration-200 ease-in-out transform hover:scale-[1.01] shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black"
            whileHover={{ scale: 1.01, boxShadow: '0 5px 15px -5px rgba(0, 0, 255, 0.4)' }}
            whileTap={{ scale: 0.99 }}
          >
            <FaFacebook className="w-5 h-5 mr-2" />
            Facebook
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
} 