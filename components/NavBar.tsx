'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/',            label: 'India Twin',   icon: '🌏' },
  { href: '/karnataka',   label: 'Karnataka PoC', icon: '📍' },
  { href: '/xai',         label: 'XAI / Engines', icon: '🧠' },
  { href: '/research',    label: 'Research',       icon: '📄' },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 glass-panel rounded-none border-x-0 border-t-0 border-b border-white/8">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between relative">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-6 h-6 relative">
            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
              <circle cx="12" cy="12" r="10" stroke="#00E5FF" strokeWidth="1.5" opacity="0.3" />
              <circle cx="12" cy="12" r="6" stroke="#00E5FF" strokeWidth="1.5" opacity="0.6" />
              <circle cx="12" cy="12" r="2" fill="#00E5FF" />
              <ellipse cx="12" cy="12" rx="10" ry="4" stroke="#00E5FF" strokeWidth="1" opacity="0.2" transform="rotate(-30 12 12)" />
            </svg>
          </div>
          <span className="font-display font-bold text-white text-sm tracking-wide group-hover:text-signal-cyan transition-colors">
            Prithvi<span className="text-signal-cyan">Twin</span>
          </span>
          <span className="hidden sm:block text-[9px] font-mono text-text-dim uppercase tracking-widest border border-white/10 px-1.5 py-0.5 rounded">
            ISRO BAH 2026
          </span>
        </Link>

        {/* Nav links (centered) */}
        <div className="flex items-center gap-1 absolute left-1/2 transform -translate-x-1/2">
          {NAV_ITEMS.map(item => {
            const isActive = item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-signal-cyan/10 text-signal-cyan border border-signal-cyan/25 glow-cyan-sm'
                    : 'text-text-dim hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="text-sm">{item.icon}</span>
                <span className="hidden sm:block">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Status indicator (right-aligned) */}
        <div className="hidden sm:flex items-center gap-2 ml-auto">
          <div className="w-1.5 h-1.5 rounded-full bg-signal-cyan animate-pulse" />
          <span className="text-[11px] font-mono text-text-dim">LIVE TWIN ACTIVE</span>
        </div>
      </div>
    </nav>
  );
}