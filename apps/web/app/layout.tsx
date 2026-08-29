import type { Metadata } from 'next';
import { Geist_Mono, Roboto } from 'next/font/google';
import './globals.css';
import Providers from './providers';

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// Material You (site-wide, see docs/promptFE6.md) — Roboto is the canonical
// Material Design typeface. `--font-sans` in globals.css points at this
// variable, so every page gets Roboto via Tailwind's default font stack.
const roboto = Roboto({
  variable: '--font-roboto',
  weight: ['400', '500', '700'],
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'EERS',
  description: 'Enterprise Evaluation & Ranking System',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistMono.variable} ${roboto.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
