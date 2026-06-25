import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/Sidebar';
// Imported but not used directly in this layout as requested
import Topbar from '@/components/Topbar';

export const metadata: Metadata = {
  title: 'PrithviTwin — AI Climate Digital Twin | ISRO BAH 2026',
  description: 'District-level AI climate decision system built on IMD and ISRO satellite data.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <Sidebar />
          <div className="main-content">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
