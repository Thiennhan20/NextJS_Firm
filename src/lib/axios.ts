import axios from 'axios';

let baseURL = process.env.NEXT_PUBLIC_API_URL;

if (typeof window !== 'undefined') {
  if (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  ) {
    baseURL = 'http://localhost:3001/api';
  } else {
    // Production URL
    baseURL = 'https://server-nextjs-firm.onrender.com/api';
  }
}

console.log('API baseURL:', baseURL);

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Thay vì redirect ngay lập tức, chỉ clear token và để component tự xử lý
      localStorage.removeItem('token');
      // Không redirect tự động, để component tự xử lý logout
    }
    return Promise.reject(error);
  }
);

export default api; 