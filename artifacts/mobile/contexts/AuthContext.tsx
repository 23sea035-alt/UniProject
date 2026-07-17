import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserRole = 'user' | 'government';

export interface UserProfile {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  nic: string;
  phone: string;
  address: string;
  meterId: string;
  role: UserRole;
}

interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: {
    firstName: string; lastName: string; email: string; nic: string;
    phone: string; password: string; role: UserRole;
  }) => Promise<void>;
}

const DEMO_USER: UserProfile = {
  uid: 'user-001',
  firstName: 'Kasun',
  lastName: 'Perera',
  email: 'kasun@demo.lk',
  nic: '199512345678',
  phone: '0771234567',
  address: '42/A, Galle Road, Colombo 3',
  meterId: 'WM-2024-COL-0042',
  role: 'user',
};

const DEMO_GOV: UserProfile = {
  uid: 'gov-001',
  firstName: 'Nimal',
  lastName: 'Silva',
  email: 'admin@nwsdb.lk',
  nic: '198045678901',
  phone: '0112345678',
  address: 'NWSDB Head Office, Torrington Square, Colombo 2',
  meterId: 'GOV-ADM-001',
  role: 'government',
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('auth_user').then((stored) => {
      if (stored) {
        try { setUser(JSON.parse(stored)); } catch {}
      }
      setIsLoading(false);
    });
  }, []);

  const login = async (_email: string, _password: string, role: UserRole) => {
    const profile = role === 'government' ? { ...DEMO_GOV } : { ...DEMO_USER };
    await AsyncStorage.setItem('auth_user', JSON.stringify(profile));
    setUser(profile);
  };

  const register = async (data: {
    firstName: string; lastName: string; email: string; nic: string;
    phone: string; password: string; role: UserRole;
  }) => {
    const profile: UserProfile = {
      uid: `user-${Date.now()}`,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      nic: data.nic,
      phone: data.phone,
      address: '',
      meterId: `WM-${Date.now()}`,
      role: data.role,
    };
    await AsyncStorage.setItem('auth_user', JSON.stringify(profile));
    setUser(profile);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('auth_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
