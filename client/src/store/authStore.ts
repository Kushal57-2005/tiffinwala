/* eslint-disable @typescript-eslint/no-unused-vars */
import { create } from 'zustand';
import { api } from '../utils/api';
import type { IUser } from '../types/auth.types';

interface AuthState {
    user: IUser | null;
    isLoading: boolean;
    isAuthenticated: boolean;

    fetchUser: () => Promise<void>;
    logout: () => Promise<void>;
    setUser: (user: IUser | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isLoading: true,
    isAuthenticated: false,

    fetchUser: async () => {
        try {
            const res = await api.get('/auth/me');
            set({
                user: res.data.data,
                isAuthenticated: true,
                isLoading: false,
            });
        } catch (error) {
            localStorage.removeItem('token');
            set({ user: null, isAuthenticated: false, isLoading: false });
        }
    },

    logout: async () => {
        try {
            await api.post('/auth/logout');
        } catch {
            // Ignore errors — we always clear local state
        }
        localStorage.removeItem('token');
        set({ user: null, isAuthenticated: false });
    },

    setUser: (user) => {
        set({ user, isAuthenticated: !!user });
    },
}));
