import axios from 'axios';

export const authClient = axios.create({
  baseURL: import.meta.env.VITE_AUTH_SERVICE_URL,
});

export const searchClient = axios.create({
  baseURL: import.meta.env.VITE_SEARCH_SERVICE_URL,
});

export const userClient = axios.create({
  baseURL: import.meta.env.VITE_USER_SERVICE_URL,
});

authClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

userClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
