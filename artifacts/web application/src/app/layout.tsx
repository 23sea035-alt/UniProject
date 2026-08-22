import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { DataProvider } from '../context/DataContext';
import { AppShell } from '../components/layout/AppShell';

export const metadata: Metadata = {
  title: 'Sri Lanka Government - Smart Water Meter Portal | NWSDB',
  description:
    'National Water Supply & Drainage Board (NWSDB) Smart Water Meter Monitoring, Billing, Automated Solenoid Valve Control & Telemetry Management Portal.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="bg-slate-950 text-slate-100 min-h-screen" suppressHydrationWarning>
        <AuthProvider>
          <DataProvider>
            <AppShell>{children}</AppShell>
          </DataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
