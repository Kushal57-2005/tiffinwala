import axios from 'axios';

const backendURL = import.meta.env.VITE_BACKEND_URL || '';

export const api = axios.create({
    baseURL: backendURL ? `${backendURL}/api` : '/api',
    withCredentials: true,
});
