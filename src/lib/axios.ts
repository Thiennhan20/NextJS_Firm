import axios from 'axios';
import useAuthStore from '@/store/useAuthStore';

let baseURL = process.env.NEXT_PUBLIC_API_URL;

if (typeof window !== 'undefined') {
  if (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  ) {
    baseURL = 'http://localhost:3001/api';
  }
}

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Đảm bảo gửi cookie HTTP-only
});

// Bỏ interceptor lấy token từ localStorage

// Giữ lại response interceptor nếu muốn redirect khi 401, nhưng bỏ localStorage.removeItem
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Skip logout for specific routes (like login page)
      const skipLogoutRoutes = ['/login', '/auth'];
      if (!skipLogoutRoutes.some(route => error.config.url.includes(route))) {
        if (typeof window !== 'undefined') {
          const authStore = useAuthStore.getState();
          await authStore.logout();
          // Reload 1 lần duy nhất cho mỗi tab khi bị 401
          if (!sessionStorage.getItem('reloadedOn401')) {
            sessionStorage.setItem('reloadedOn401', 'true');
            window.location.reload();
          } else {
            window.location.href = '/login';
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api; 