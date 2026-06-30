import apiClient from './api';
import type { LoginRequest, RegisterRequest, GoogleLoginRequest, AuthResponse } from '@types';

export const authService = {
  login(email: string, password: string): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/auth/login', { email, password }, false);
  },

  register(email: string, password: string, mobile: string, consents: { communityContribution: boolean }): Promise<void> {
    return apiClient.post<void>('/auth/register', { email, password, mobile, ...consents }, false);
  },

  googleLogin(idToken: string): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/auth/google', { idToken }, false);
  },

  refreshToken(refreshToken: string): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/auth/refresh', { refreshToken }, false);
  },
};
