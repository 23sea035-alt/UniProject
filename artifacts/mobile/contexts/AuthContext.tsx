import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

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
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: {
    firstName: string; lastName: string; email: string; nic: string;
    phone: string; password: string; role: UserRole;
  }) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        let profile = await loadUserProfile(firebaseUser.uid);
        if (!profile) {
          profile = {
            uid: firebaseUser.uid,
            firstName: '',
            lastName: '',
            email: firebaseUser.email || '',
            nic: '',
            phone: '',
            address: '',
            meterId: '',
            role: 'user',
          };
        }
        setUser(profile);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    let profile = await loadUserProfile(result.user.uid);
    if (!profile) {
      profile = {
        uid: result.user.uid,
        firstName: '',
        lastName: '',
        email: result.user.email || '',
        nic: '',
        phone: '',
        address: '',
        meterId: '',
        role: 'user',
      };
    }
    setUser(profile);
  };

  const register = async (data: {
    firstName: string; lastName: string; email: string; nic: string;
    phone: string; password: string; role: UserRole;
  }) => {
    const result = await createUserWithEmailAndPassword(auth, data.email, data.password);
    const meterId = data.role === 'government'
      ? `GOV-${Date.now()}`
      : `WM-${Date.now()}`;

    const profile: UserProfile = {
      uid: result.user.uid,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      nic: data.nic,
      phone: data.phone,
      address: '',
      meterId,
      role: data.role,
    };

    try {
      await setDoc(doc(db, 'users', result.user.uid), {
        ...profile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (firestoreErr) {
      console.warn('Firestore write failed, user auth created but profile not saved:', firestoreErr);
    }

    setUser(profile);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, logout, register, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

async function loadUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    const data = snap.data() as UserProfile;
    return data;
  } catch (e) {
    console.warn('Failed to load user profile:', e);
    return null;
  }
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
