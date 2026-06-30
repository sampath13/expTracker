import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  mobile: string | null;
  tier: 'free' | 'premium' | 'founder';
  googleLinked: boolean;
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  tokens: {
    accessToken: string | null;
    refreshToken: string | null;
  };
  error: string | null;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
  clearAuth: () => void;
  initialize: () => void;
}

const initialState = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
  tokens: {
    accessToken: null,
    refreshToken: null,
  },
  error: null,
};

export const useAuthStore = create<AuthState>((set) => ({
  ...initialState,
  setTokens: (_accessToken: string, _refreshToken: string) => {
    // Stub — implemented in S1.10
  },
  setUser: (_user: User) => {
    // Stub
  },
  setLoading: (_loading: boolean) => {
    // Stub
  },
  clearAuth: () => {
    // Stub
  },
  initialize: () => {
    // Stub — implemented in S1.10
  },
}));
