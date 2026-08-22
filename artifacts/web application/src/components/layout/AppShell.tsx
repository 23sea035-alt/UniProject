'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { GovBanner } from './GovBanner';
import { NotificationDrawer } from '../common/NotificationDrawer';
import { useAuth } from '../../context/AuthContext';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auth guard — redirect to login if not authenticated
  useEffect(() => {
    if (mounted && !isAuthenticated && pathname !== '/login') {
      router.push('/login');
    }
  }, [isAuthenticated, pathname, router, mounted]);

  // Prevent hydration mismatch: render nothing until client mounts
  if (!mounted) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center">
        <div className="animate-pulse text-xs text-slate-500">Loading...</div>
      </main>
    );
  }

  // Login page layout without sidebar & header
  if (pathname === '/login') {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <GovBanner />
        <div className="flex-1 flex items-center justify-center p-4">
          {children}
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <GovBanner />

      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col lg:pl-72 min-w-0">
          <Header
            onMenuToggle={() => setSidebarOpen((prev) => !prev)}
            onNotificationToggle={() => setNotificationDrawerOpen(true)}
          />

          <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
            {children}
          </main>

          {/* Footer */}
          <footer className="border-t border-slate-800/80 bg-slate-950 py-4 px-6 text-center text-xs text-slate-500">
            <p>
              © {new Date().getFullYear()} National Water Supply & Drainage Board (NWSDB) • Ministry of Water Supply • Democratic Socialist Republic of Sri Lanka
            </p>
          </footer>
        </div>
      </div>

      <NotificationDrawer
        isOpen={notificationDrawerOpen}
        onClose={() => setNotificationDrawerOpen(false)}
      />
    </div>
  );
};
