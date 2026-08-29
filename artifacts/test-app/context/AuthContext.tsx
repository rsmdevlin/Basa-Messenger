import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import * as SecureStore from 'expo-secure-store';

const API_URL = 'https://basa-messenger.onrender.com/api';

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
  register: (
    email: string,
    password: string,
    username: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);

  const getStoredToken = useCallback(async (): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync('access_token');
    } catch (error) {
      console.error('Error retrieving access token:', error);
      return null;
    }
  }, []);

  const storeToken = useCallback(
    async (accessToken: string, refreshToken?: string) => {
      try {
        await SecureStore.setItemAsync('access_token', accessToken);

        if (refreshToken) {
          await SecureStore.setItemAsync('refresh_token', refreshToken);
        }
      } catch (error) {
        console.error('Error storing tokens:', error);
      }
    },
    []
  );

  const clearTokens = useCallback(async () => {
    try {
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('refresh_token');
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }, []);

  const apiRequest = useCallback(
    async (endpoint: string, options: RequestInit = {}) => {
      const token = await getStoredToken();

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };

      if (options.headers) {
        if (options.headers instanceof Headers) {
          options.headers.forEach((value, key) => {
            headers[key] = value;
          });
        } else if (Array.isArray(options.headers)) {
          options.headers.forEach(([key, value]) => {
            headers[key] = value;
          });
        } else {
          Object.assign(headers, options.headers);
        }
      }

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const url = `${API_URL}${endpoint}`;

      console.log('API REQUEST:', options.method || 'GET', url);

      let response: Response;

      try {
        response = await fetch(url, {
          ...options,
          headers,
        });
      } catch (error) {
        console.error('NETWORK ERROR:', error);
        throw new Error(
          'Не удалось подключиться к серверу. Проверь интернет-соединение.'
        );
      }

      const responseText = await response.text();

      let data: any = {};

      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch {
          data = {
            message: responseText,
          };
        }
      }

      console.log('API RESPONSE:', response.status, data);

      if (!response.ok) {
        const message =
          data?.message ||
          data?.error ||
          data?.errors?.[0]?.message ||
          `Ошибка сервера: ${response.status}`;

        throw new Error(message);
      }

      return data;
    },
    [getStoredToken]
  );

  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);

      try {
        const data = await apiRequest('/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        });

        const accessToken =
          data?.tokens?.accessToken ||
          data?.accessToken ||
          data?.token;

        const refreshToken =
          data?.tokens?.refreshToken ||
          data?.refreshToken ||
          '';

        if (!accessToken) {
          throw new Error('Сервер не вернул access token.');
        }

        await storeToken(accessToken, refreshToken);

        const loggedUser = data?.user;

        if (!loggedUser) {
          throw new Error('Сервер не вернул данные пользователя.');
        }

        setUser({
          id: String(loggedUser.id),
          email: loggedUser.email,
          username: loggedUser.username,
        });

        setIsSignedIn(true);
      } finally {
        setIsLoading(false);
      }
    },
    [apiRequest, storeToken]
  );

  const register = useCallback(
    async (
      email: string,
      password: string,
      username: string
    ) => {
      setIsLoading(true);

      try {
        const data = await apiRequest('/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            email: email.trim(),
            password,
            username: username.trim(),
          }),
        });

        const accessToken =
          data?.tokens?.accessToken ||
          data?.accessToken ||
          data?.token;

        const refreshToken =
          data?.tokens?.refreshToken ||
          data?.refreshToken ||
          '';

        if (!accessToken) {
          throw new Error(
            'Регистрация прошла, но сервер не вернул access token.'
          );
        }

        await storeToken(accessToken, refreshToken);

        const registeredUser = data?.user;

        if (!registeredUser) {
          throw new Error(
            'Регистрация прошла, но сервер не вернул данные пользователя.'
          );
        }

        setUser({
          id: String(registeredUser.id),
          email: registeredUser.email,
          username: registeredUser.username,
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
      const token = await getStoredToken();

      if (token) {
        try {
          await apiRequest('/auth/logout', {
            method: 'POST',
          });
        } catch (error) {
          console.error('Logout API error:', error);
        }
      }
    } finally {
      await clearTokens();
      setUser(null);
      setIsSignedIn(false);
      setIsLoading(false);
    }
  }, [apiRequest, clearTokens, getStoredToken]);

  const refresh = useCallback(async () => {
    try {
      const refreshToken = await SecureStore.getItemAsync('refresh_token');

      if (!refreshToken) {
        setIsSignedIn(false);
        setUser(null);
        return;
      }

      const data = await apiRequest('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({
          refreshToken,
        }),
      });

      const accessToken =
        data?.tokens?.accessToken ||
        data?.accessToken ||
        data?.token;

      const newRefreshToken =
        data?.tokens?.refreshToken ||
        data?.refreshToken ||
        refreshToken;

      if (!accessToken) {
        throw new Error('Сервер не вернул новый access token.');
      }

      await storeToken(accessToken, newRefreshToken);

      if (data?.user) {
        setUser({
          id: String(data.user.id),
          email: data.user.email,
          username: data.user.username,
        });
      }

      setIsSignedIn(true);
    } catch (error) {
      console.error('Token refresh failed:', error);

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
        setUser(null);
        return;
      }

      const userData = await apiRequest('/auth/me');

      const loggedUser = userData?.user || userData;

      if (!loggedUser?.id) {
        throw new Error('Некорректный ответ /auth/me');
      }

      setUser({
        id: String(loggedUser.id),
        email: loggedUser.email,
        username: loggedUser.username,
      });

      setIsSignedIn(true);
    } catch (error) {
      console.error('Auth check failed:', error);

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

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}