import { create } from 'zustand';
import type { User } from '@/types/models';
import { authApi } from '@/lib/api/auth';
import Cookies from 'js-cookie';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; first_name: string; last_name: string; email: string; password: string; password_confirmation: string; institution?: string }) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  updateUser: (user: Partial<User>) => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // true jusqu'a ce que checkAuth() termine — evite le flash

  login: async (email, password) => {
    const response = await authApi.login({ email, password });
    set({ user: response.user, isAuthenticated: true, isLoading: false });
  },

  register: async (data) => {
    const response = await authApi.register(data);
    set({ user: response.user, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    try {
      await authApi.logout();
    } finally {
      set({ user: null, isAuthenticated: false, isLoading: false });
      // Redirection forcee vers login apres deconnexion
      window.location.href = '/auth/login';
    }
  },

  fetchUser: async () => {
    try {
      const user = await authApi.getMe();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
      Cookies.remove('collabsearch_token');
    }
  },

  updateUser: async (userData) => {
    const user = await authApi.updateProfile(userData);
    set({ user });
  },

  checkAuth: async () => {
    set({ isLoading: true });
    const token = Cookies.get('collabsearch_token');
    if (!token) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }
    try {
      const user = await authApi.getMe();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
      Cookies.remove('collabsearch_token');
    }
  },
}));
