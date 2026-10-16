import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: { email: string; password: string; fullName: string; phone: string; drivingLicenseNumber?: string; address?: string }) => Promise<User>;
  logout: () => void;
  updateUser: (updatedUser: User) => void;
  isCustomer: boolean;
  isStaff: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('swiftdrive_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadUser() {
      const storedToken = localStorage.getItem('swiftdrive_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.auth.getMe();
        if (response.success && response.user) {
          setUser(response.user);
        } else {
          logout();
        }
      } catch {
        logout();
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const response = await api.auth.login({ email, password });
    if (response.success) {
      localStorage.setItem('swiftdrive_token', response.token);
      setToken(response.token);
      setUser(response.user);
      return response.user;
    }
    throw new Error('Authentication failed');
  };

  const register = async (data: {
    email: string;
    password: string;
    fullName: string;
    phone: string;
    drivingLicenseNumber?: string;
    address?: string;
  }): Promise<User> => {
    const response = await api.auth.register(data);
    if (response.success) {
      localStorage.setItem('swiftdrive_token', response.token);
      setToken(response.token);
      setUser(response.user);
      return response.user;
    }
    throw new Error('Registration failed');
  };

  const logout = () => {
    localStorage.removeItem('swiftdrive_token');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const isCustomer = user?.role === 'customer';
  const isStaff = user?.role === 'staff' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        updateUser,
        isCustomer,
        isStaff,
        isAdmin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
