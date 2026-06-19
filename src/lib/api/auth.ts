import apiClient, { getCsrfCookie } from './client';
import type { LoginRequest, RegisterRequest, AuthResponse } from '@/types/api';
import type { User } from '@/types/models';
import Cookies from 'js-cookie';

const isValidToken = (token: unknown): token is string =>
  typeof token === 'string' && token.trim() !== '' && token !== 'undefined' && token !== 'null';

export const authApi = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    await getCsrfCookie();
    const response = await apiClient.post<AuthResponse>('/api/v1/auth/login', data);
    const token = response.data.token;

    if (!isValidToken(token)) {
      Cookies.remove('collabsearch_token');
      throw new Error('Authentification echouee : token manquant.');
    }

    Cookies.set('collabsearch_token', token, { expires: 1 });
    return response.data;
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    await getCsrfCookie();
    const response = await apiClient.post<AuthResponse>('/api/v1/auth/register', data);
    const token = response.data.token;

    if (!isValidToken(token)) {
      Cookies.remove('collabsearch_token');
      throw new Error('Inscription echouee : token manquant.');
    }

    Cookies.set('collabsearch_token', token, { expires: 1 });
    return response.data;
  },

  async logout(): Promise<void> {
    try {
      // Utilise le bearer token courant — route auth:sanctum
      await apiClient.post('/api/v1/auth/logout');
    } catch {
      // Ignorer les erreurs reseau : le cookie sera supprime de toute facon
    } finally {
      Cookies.remove('collabsearch_token');
    }
  },

  async getMe(): Promise<User> {
    const response = await apiClient.get<{ user?: User; data?: User }>('/api/v1/auth/me');
    return response.data.user ?? response.data.data!;
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await apiClient.put<{ user?: User; data?: User }>('/api/v1/auth/profile', data);
    return response.data.user ?? response.data.data!;
  },

  async changePassword(data: { current_password: string; password: string; password_confirmation: string }): Promise<void> {
    await apiClient.put('/api/v1/auth/change-password', data);
  },

  async refreshToken(): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/v1/auth/refresh');
    Cookies.set('collabsearch_token', response.data.token, { expires: 30 });
    return response.data;
  },
};
