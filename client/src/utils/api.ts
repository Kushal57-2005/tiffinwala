import axios from 'axios';

const backendURL = import.meta.env.VITE_BACKEND_URL || '';

export const api = axios.create({
    baseURL: backendURL ? `${backendURL}/api` : '/api',
});

// Attach JWT token from localStorage to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
});

const PUBLIC_PATHS = ['/', '/login', '/register', '/forget-password', '/reset-password'];

// Auto-logout on 401 (expired / invalid token) — but NOT on public pages
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const isPublic = PUBLIC_PATHS.includes(window.location.pathname);
        if (error.response?.status === 401 && !isPublic) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    },
);
