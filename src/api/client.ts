import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

export const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const key = localStorage.getItem('apiKey');
  if (key) {
    config.headers = config.headers ?? {};
    config.headers['x-api-key'] = key;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('apiKey');
      if (location.pathname !== '/login') location.href = '/login';
    }
    return Promise.reject(err);
  },
);
