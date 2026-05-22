import type { Metadata } from 'next';
import { ThemeProvider } from '@starter/shared/ui';
import '@starter/shared/ui/styles/globals.css';
import { AdminAuthProvider } from '@/auth/AdminAuthProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Admin',
  description: 'Admin sign-in and profile',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AdminAuthProvider>{children}</AdminAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
