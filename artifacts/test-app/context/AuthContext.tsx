import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const API_URL =
  Constants.expoConfig?.extra?.apiUrl || 'https://basa-messenger.onrender.com/api';

interface AuthUser {
  id: string;
  email: string;
  username: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isSignedIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);

  const getStoredToken = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      return token;
    } catch (err) {
      console.error('Error retrieving token:', err);
      return null;
    }
  }, []);

  const storeToken = useCallback(async (token: string, refreshToken: string) => {
    try {
      await SecureStore.setItemAsync('access_token', token);
      await SecureStore.setItemAsync('refresh_token', refreshToken);
    } catch (err) {
      console.error('Error storing tokens:', err);
    }
  }, []);

  const clearTokens = useCallback(async () => {
    try {
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('refresh_token');
    } catch (err) {
      console.error('Error clearing tokens:', err);
    }
  }, []);

  const apiRequest = useCallback(
    async (endpoint: string, options: RequestInit = {}) => {
      const token = await getStoredToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API error: ${response.status}`);
      }

      return response.json();
    },
    [getStoredToken]
  );

  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      try {
        const data = await apiRequest('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });

        await storeToken(data.accessToken, data.refreshToken);
        setUser({
          id: data.user.id,
          email: data.user.email,
          username: data.user.username,
        });
        setIsSignedIn(true);
      } finally {
        setIsLoading(false);
      }
    },
    [apiRequest, storeToken]
  );

  const register = useCallback(
    async (email: string, password: string, username: string) => {
      setIsLoading(true);
      try {
        const data = await apiRequest('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ email, password, username }),
        });

        await storeToken(data.accessToken, data.refreshToken);
        setUser({
          id: data.user.id,
          email: data.user.email,
          username: data.user.username,
        });
        setIsSignedIn(true);
      } finally {
        setIsLoading(false);
      }
    },
    [apiRequest, storeToken]
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout API error:', err);
    } finally {
      await clearTokens();
      setUser(null);
      setIsSignedIn(false);
      setIsLoading(false);
    }
  }, [apiRequest, clearTokens]);

  const refresh = useCallback(async () => {
    try {
      const refreshToken = await SecureStore.getItemAsync('refresh_token');
      if (!refreshToken) {
        setIsSignedIn(false);
        return;
      }

      const data = await apiRequest('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });

      await storeToken(data.accessToken, data.refreshToken);
      setIsSignedIn(true);
    } catch (err) {
      console.error('Token refresh failed:', err);
      await clearTokens();
      setIsSignedIn(false);
      setUser(null);
    }
  }, [apiRequest, storeToken, clearTokens]);

  const checkAuth = useCallback(async () => {
    try {
      const token = await getStoredToken();
      if (!token) {
        setIsSignedIn(false);
        setIsLoading(false);
        return;
      }

      const userData = await apiRequest('/auth/me');
      setUser({
        id: userData.id,
        email: userData.email,
        username: userData.username,
      });
      setIsSignedIn(true);
    } catch (err) {
      console.error('Auth check failed:', err);
      await clearTokens();
      setIsSignedIn(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [getStoredToken, apiRequest, clearTokens]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isSignedIn,
        login,
        register,
        logout,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
