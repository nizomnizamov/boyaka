import axios from 'axios';
import { validateAndCleanupToken, isTokenExpired } from '../utils/tokenManager';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000, // 60s timeout — Render cold start uchun
});

// Warm-up backend (Render free tier uxlamasligi uchun)
// Faqat birinchi sahifa yuklanishida ishlaydi
let warmedUp = false;
export const warmupBackend = () => {
  if (warmedUp) return;
  warmedUp = true;
  fetch(`${API_URL.replace('/api', '')}/health`).catch(() => {});
};

// Add token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token && isTokenExpired(token)) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    return Promise.reject(new Error('Token expired'));
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 — logout, timeout — auto retry once (cold start)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // Timeout yoki network error — bir marta avtomatik qaytatib urinish (Render cold start)
    const config = error.config;
    if (!config || config._retried) return Promise.reject(error);
    const isTimeout = error.code === 'ECONNABORTED' || error.message?.includes('timeout');
    const isNetwork = !error.response && error.message === 'Network Error';
    if (isTimeout || isNetwork) {
      config._retried = true;
      // 1 sekund kutib qayta urinamiz (server endi uyg'ongan bo'ladi)
      await new Promise((r) => setTimeout(r, 1500));
      return api(config);
    }

    return Promise.reject(error);
  }
);

export default api;
