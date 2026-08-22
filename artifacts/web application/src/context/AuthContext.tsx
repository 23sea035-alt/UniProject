'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { GovernmentOfficer, OfficerRole } from '../types';
import { AuditLogger } from '../lib/auditLogger';

interface AuthContextType {
  officer: GovernmentOfficer | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: OfficerRole) => void;
  sessionRemainingSeconds: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [officer, setOfficer] = useState<GovernmentOfficer | null>(null);
  const [sessionRemainingSeconds, setSessionRemainingSeconds] = useState<number>(3600);

  // Restore session from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('nwsdb_gov_officer');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setOfficer(parsed);
        // Re-authenticate with Firebase silently if we have credentials
        restoreFirebaseAuth(parsed.email);
      } catch {
        localStorage.removeItem('nwsdb_gov_officer');
      }
    }
  }, []);

  const restoreFirebaseAuth = async (email: string) => {
    try {
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      const { auth } = await import('../lib/firebase');
      if (!auth) return;
      // If user is already signed in, skip
      if (auth.currentUser) return;
      // We can't silently sign in without password, so rely on onAuthStateChanged
      // for session persistence — Firebase Auth already persists by default in web
    } catch (err) {
      console.warn('[Auth] Firebase silent restore failed:', err);
    }
  };

  // Listen for Firebase Auth state changes to keep sessions in sync
  useEffect(() => {
    const setupListener = async () => {
      try {
        const { onAuthStateChanged } = await import('firebase/auth');
        const { auth } = await import('../lib/firebase');
        if (!auth) return;

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser && !officer) {
            // Firebase user exists but no officer profile loaded yet
            // Try to load from localStorage first
            const saved = localStorage.getItem('nwsdb_gov_officer');
            if (saved) {
              try {
                setOfficer(JSON.parse(saved));
              } catch {}
            }
          }
        });
        return unsubscribe;
      } catch {
        return () => {};
      }
    };
    const unsub = setupListener();
    return () => { unsub.then?.((fn) => fn?.()); };
  }, []);

  // Session timer countdown
  useEffect(() => {
    if (!officer) return;
    const interval = setInterval(() => {
      setSessionRemainingSeconds((prev) => {
        if (prev <= 1) {
          logout();
          return 3600;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [officer]);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Sign in with Firebase Auth
    const { signInWithEmailAndPassword } = await import('firebase/auth');
    const { auth } = await import('../lib/firebase');

    if (!auth) throw new Error('Firebase not initialised');

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (authErr: any) {
      // If user doesn't exist in Firebase Auth, throw
      throw new Error('Invalid credentials. Officer account not found.');
    }

    // Load officer profile from Firestore governmentOfficers collection
    const { doc, getDoc } = await import('firebase/firestore');
    const { db } = await import('../lib/firebase');

    let profile: GovernmentOfficer | null = null;

    if (db) {
      try {
        const officerSnap = await getDoc(doc(db, 'governmentOfficers', auth.currentUser!.uid));
        if (officerSnap.exists()) {
          const d = officerSnap.data();
          profile = {
            id: auth.currentUser!.uid,
            name: d.name || d.fullName || email.split('@')[0],
            email: d.email || email,
            badgeNumber: d.badgeNumber || 'NWSDB-001',
            department: d.department || 'Water Supply',
            role: (d.role || 'OFFICER') as OfficerRole,
            phone: d.phone || '',
            active: d.active !== false,
            lastLogin: new Date().toISOString(),
          };
        }
      } catch (err) {
        console.warn('[Auth] Failed to load officer profile from Firestore:', err);
      }
    }

    // Fallback: create profile from email
    if (!profile) {
      profile = {
        id: auth.currentUser!.uid,
        name: email.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        email,
        badgeNumber: 'NWSDB-001',
        department: 'Water Supply & Drainage Board',
        role: 'SUPER_ADMIN',
        phone: '',
        active: true,
        lastLogin: new Date().toISOString(),
      };
    }

    setOfficer(profile);
    setSessionRemainingSeconds(3600);
    localStorage.setItem('nwsdb_gov_officer', JSON.stringify(profile));

    AuditLogger.createLog({
      officer: profile,
      action: 'OFFICER_LOGIN',
      actionCategory: 'AUTH',
      targetEntity: 'GovernmentOfficer',
      targetId: profile.id,
      status: 'SUCCESS',
      details: `Successful authentication by ${profile.name} (${profile.role})`,
    });

    return true;
  };

  const logout = useCallback(() => {
    if (officer) {
      AuditLogger.createLog({
        officer: officer,
        action: 'OFFICER_LOGOUT',
        actionCategory: 'AUTH',
        targetEntity: 'GovernmentOfficer',
        targetId: officer.id,
        status: 'SUCCESS',
        details: `Session terminated for ${officer.name}`,
      });
    }

    // Sign out from Firebase Auth
    import('firebase/auth').then(({ signOut }) =>
      import('../lib/firebase').then(({ auth }) => {
        if (auth) signOut(auth).catch(() => {});
      })
    );

    setOfficer(null);
    localStorage.removeItem('nwsdb_gov_officer');
    router.push('/login');
  }, [officer, router]);

  const switchRole = (role: OfficerRole) => {
    if (!officer) return;
    const updated = { ...officer, role };
    setOfficer(updated);
    localStorage.setItem('nwsdb_gov_officer', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{
        officer,
        isAuthenticated: !!officer,
        login,
        logout,
        switchRole,
        sessionRemainingSeconds,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
