import type { Metadata } from 'next';
import { ThemeProvider } from '@starter/shared/ui';
import '@starter/shared/ui/styles/globals.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Admin App',
  description: 'Starter admin frontend shell',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
