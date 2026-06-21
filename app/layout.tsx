import type { Metadata } from 'next';
import './globals.css';
import NavBar from '@/components/NavBar';

export const metadata: Metadata = {
  title: 'PrithviTwin — AI Digital Twin of India\'s Climate | ISRO BAH 2026',
  description: 'An interactive, explainable, district-level climate decision-support system built on IMD and ISRO satellite data. PS5 — Bharatiya Antariksh Hackathon 2026.',
  keywords: ['ISRO', 'climate twin', 'digital twin', 'India climate', 'BAH 2026', 'monsoon', 'Karnataka'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-space-navy text-white min-h-screen bg-grid scanline">
        <NavBar />
        <main className="pt-14">
          {children}
        </main>
      </body>
    </html>
  );
}
