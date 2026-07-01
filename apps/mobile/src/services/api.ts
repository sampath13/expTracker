import { API_BASE_URL } from '@constants/config';
import { useAuthStore } from '@store';

interface ApiClientConfig {
  baseURL: string;
  timeout: number;
}

class ApiClient {
  private baseURL: string;
  private timeout: number;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(config: ApiClientConfig) {
    this.baseURL = config.baseURL;
    this.timeout = config.timeout;
  }

  private getHeaders(authenticated: boolean = true): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (authenticated) {
      const token = useAuthStore.getState().accessToken;
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private async handleRefresh(): Promise<boolean> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        if (!refreshToken) {
          return false;
        }

        const response = await fetch(`${this.baseURL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) {
          useAuthStore.getState().clearAuth();
          return false;
        }

        const data = await response.json();
        useAuthStore.getState().setTokens(data.accessToken, data.refreshToken);
        return true;
      } catch {
        useAuthStore.getState().clearAuth();
        return false;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  async request<T>(
    path: string,
    options: {
      method?: string;
      body?: unknown;
      authenticated?: boolean;
      headers?: Record<string, string>;
    } = {}
  ): Promise<T> {
    const { method = 'GET', body, authenticated = true, headers: extraHeaders } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const headers = { ...this.getHeaders(authenticated), ...extraHeaders };

      const response = await fetch(`${this.baseURL}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (response.status === 401 && authenticated) {
        const refreshed = await this.handleRefresh();
        if (refreshed) {
          const retryHeaders = { ...this.getHeaders(authenticated), ...extraHeaders };
          const retryResponse = await fetch(`${this.baseURL}${path}`, {
            method,
            headers: retryHeaders,
            body: body ? JSON.stringify(body) : undefined,
          });
          return this.parseResponse<T>(retryResponse);
        }
      }

      return this.parseResponse<T>(response);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async parseResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorBody = await response.text();
      let errorMessage: string;
      try {
        errorMessage = JSON.parse(errorBody).message || errorBody;
      } catch {
        errorMessage = errorBody || `HTTP ${response.status}`;
      }
      throw new Error(errorMessage);
    }

    const text = await response.text();
    if (!text) {
      return undefined as unknown as T;
    }
    return JSON.parse(text) as T;
  }

  get<T>(path: string, authenticated = true): Promise<T> {
    return this.request<T>(path, { method: 'GET', authenticated });
  }

  post<T>(path: string, body?: unknown, authenticated = true): Promise<T> {
    return this.request<T>(path, { method: 'POST', body, authenticated });
  }

  put<T>(path: string, body?: unknown, authenticated = true): Promise<T> {
    return this.request<T>(path, { method: 'PUT', body, authenticated });
  }

  patch<T>(path: string, body?: unknown, authenticated = true): Promise<T> {
    return this.request<T>(path, { method: 'PATCH', body, authenticated });
  }

  delete<T>(path: string, authenticated = true): Promise<T> {
    return this.request<T>(path, { method: 'DELETE', authenticated });
  }
}

export const apiClient = new ApiClient({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

export default apiClient;
