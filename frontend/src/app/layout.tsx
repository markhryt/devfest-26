import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { AppBillingRoot } from '@/contexts/AppBillingContext';
import { AppHeader } from '@/components/AppHeader';
import './globals.css';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
});
const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'AI Block Marketplace',
  description: 'Modular AI-powered blocks with Flowglad billing',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased bg-zinc-950 text-zinc-100 min-h-screen font-sans`}>
        <AppBillingRoot>
          <div className="flex flex-col min-h-screen">
            <AppHeader />
            <main className="flex-1 flex flex-col min-h-0">{children}</main>
          </div>
        </AppBillingRoot>
      </body>
    </html>
  );
}
