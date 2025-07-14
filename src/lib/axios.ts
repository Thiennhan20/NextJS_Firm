import axios from 'axios';

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
  withCredentials: true,
});

// Add a request interceptor
// Không cần interceptor để thêm Authorization nữa vì dùng cookie

// Add a response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Không tự động redirect về /login ở đây nữa để tránh lặp vô hạn
    return Promise.reject(error);
  }
);

export default api; 