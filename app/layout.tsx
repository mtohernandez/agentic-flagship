import type { Metadata } from 'next';
import { Geist, Geist_Mono, DM_Sans } from 'next/font/google';
import './globals.css';

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-sans' });

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Agentic Flagship',
  description: 'Agent to scrape websites.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={dmSans.variable}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</body>
    </html>
  );
}
