import { create } from 'zustand';
import * as Keychain from 'react-native-keychain';
import apiClient from '../services/api';
import type { AuthResponse, UserProfile } from '@types';

const TOKEN_KEY = 'auth_tokens';
const USER_KEY = 'auth_user';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  error: string | null;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  googleLogin: (idToken: string) => Promise<boolean>;
  register: (email: string, password: string, mobile: string, communityContribution: boolean) => Promise<void>;
  setMobile: (mobile: string) => Promise<void>;
  setTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  clearAuth: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  accessToken: null,
  refreshToken: null,
  error: null,

  initialize: async () => {
    try {
      const tokensData = await Keychain.getGenericPassword({ service: TOKEN_KEY });
      const userData = await Keychain.getGenericPassword({ service: USER_KEY });

      if (tokensData && userData) {
        const tokens: TokenPair = JSON.parse(tokensData.password);
        const user: UserProfile = JSON.parse(userData.password);
        set({
          user,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  login: async (email: string, password: string) => {
    set({ error: null });
    try {
      const data = await apiClient.post<AuthResponse>('/auth/login', { email, password }, false);
      const user: UserProfile = { ...data.user };
      const tokens: TokenPair = { accessToken: data.accessToken, refreshToken: data.refreshToken };
      await Keychain.setGenericPassword('tokens', JSON.stringify(tokens), { service: TOKEN_KEY });
      await Keychain.setGenericPassword('user', JSON.stringify(user), { service: USER_KEY });
      set({ user, accessToken: data.accessToken, refreshToken: data.refreshToken, isAuthenticated: true });
    } catch (err: any) {
      set({ error: err.message || 'Login failed' });
      throw err;
    }
  },

  googleLogin: async (idToken: string) => {
    set({ error: null });
    try {
      const data = await apiClient.post<AuthResponse>('/auth/google', { idToken }, false);
      const user: UserProfile = { ...data.user };
      const tokens: TokenPair = { accessToken: data.accessToken, refreshToken: data.refreshToken };
      await Keychain.setGenericPassword('tokens', JSON.stringify(tokens), { service: TOKEN_KEY });
      await Keychain.setGenericPassword('user', JSON.stringify(user), { service: USER_KEY });
      set({ user, accessToken: data.accessToken, refreshToken: data.refreshToken, isAuthenticated: true });
      return data.requiresMobile ?? false;
    } catch (err: any) {
      set({ error: err.message || 'Google login failed' });
      throw err;
    }
  },

  register: async (email: string, password: string, mobile: string, communityContribution: boolean) => {
    set({ error: null });
    try {
      await apiClient.post<void>('/auth/register', { email, password, mobile, communityContribution }, false);
    } catch (err: any) {
      set({ error: err.message || 'Registration failed' });
      throw err;
    }
  },

  setMobile: async (mobile: string) => {
    try {
      await apiClient.patch<UserProfile>('/user/profile', { mobile });
      const currentUser = get().user;
      if (currentUser) {
        const updated = { ...currentUser, mobile };
        await Keychain.setGenericPassword('user', JSON.stringify(updated), { service: USER_KEY });
        set({ user: updated });
      }
    } catch (err: any) {
      set({ error: err.message || 'Failed to update mobile' });
      throw err;
    }
  },

  setTokens: async (accessToken: string, refreshToken: string) => {
    const tokens: TokenPair = { accessToken, refreshToken };
    await Keychain.setGenericPassword('tokens', JSON.stringify(tokens), { service: TOKEN_KEY });
    set({ accessToken, refreshToken });
  },

  clearAuth: async () => {
    try {
      await Keychain.resetGenericPassword({ service: TOKEN_KEY });
      await Keychain.resetGenericPassword({ service: USER_KEY });
    } catch {
      // ignore keychain errors
    }
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, error: null });
  },

  logout: async () => {
    await get().clearAuth();
  },

  clearError: () => set({ error: null }),
}));
