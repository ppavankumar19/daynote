import type { Metadata } from 'next';
import { Noto_Sans, Noto_Sans_Telugu, Noto_Sans_Devanagari } from 'next/font/google';
import { ThemeProvider } from '@/components/ui/theme-provider';
import { AppInitializer } from '@/components/layout/app-initializer';
import './globals.css';

const notoSans = Noto_Sans({
  subsets: ['latin'],
  variable: '--font-noto-sans',
  display: 'swap',
});

const notoSansTelugu = Noto_Sans_Telugu({
  subsets: ['telugu'],
  variable: '--font-noto-telugu',
  display: 'swap',
});

const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  variable: '--font-noto-devanagari',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'DayNote',
  description: 'A privacy-first, multilingual note-taking app organised by day',
  manifest: '/manifest.json',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${notoSans.variable} ${notoSansTelugu.variable} ${notoSansDevanagari.variable}`}
    >
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AppInitializer />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
