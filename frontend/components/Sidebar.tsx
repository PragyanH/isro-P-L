'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Dashboard',
      href: '/',
      icon: (
        <svg
          stroke="currentColor"
          fill="none"
          strokeWidth={1.5}
          viewBox="0 0 24 24"
          width={16}
          height={16}
        >
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      ),
    },
    {
      label: 'What-If Simulator',
      href: '/simulator',
      icon: (
        <svg
          stroke="currentColor"
          fill="none"
          strokeWidth={1.5}
          viewBox="0 0 24 24"
          width={16}
          height={16}
        >
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="18" x2="20" y2="18" />
          <circle cx="8" cy="6" r="2" fill="currentColor" />
          <circle cx="16" cy="12" r="2" fill="currentColor" />
          <circle cx="12" cy="18" r="2" fill="currentColor" />
        </svg>
      ),
    },
    {
      label: 'Forensic Reports',
      href: '/reports',
      icon: (
        <svg
          stroke="currentColor"
          fill="none"
          strokeWidth={1.5}
          viewBox="0 0 24 24"
          width={16}
          height={16}
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
    },
    {
      label: 'Case Study',
      href: '/casestudy',
      icon: (
        <svg
          stroke="currentColor"
          fill="none"
          strokeWidth={1.5}
          viewBox="0 0 24 24"
          width={16}
          height={16}
        >
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
          <line x1="4" y1="22" x2="4" y2="15" />
        </svg>
      ),
    },
    { type: 'divider' },
    {
      label: 'XAI / Methodology',
      href: '/xai',
      icon: (
        <svg
          stroke="currentColor"
          fill="none"
          strokeWidth={1.5}
          viewBox="0 0 24 24"
          width={16}
          height={16}
        >
          <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
          <rect x="9" y="9" width="6" height="6" />
          <line x1="9" y1="1" x2="9" y2="4" />
          <line x1="15" y1="1" x2="15" y2="4" />
          <line x1="9" y1="20" x2="9" y2="23" />
          <line x1="15" y1="20" x2="15" y2="23" />
          <line x1="20" y1="9" x2="23" y2="9" />
          <line x1="20" y1="15" x2="23" y2="15" />
          <line x1="1" y1="9" x2="4" y2="9" />
          <line x1="1" y1="15" x2="4" y2="15" />
        </svg>
      ),
    },
    {
      label: 'Research',
      href: '/research',
      icon: (
        <svg
          stroke="currentColor"
          fill="none"
          strokeWidth={1.5}
          viewBox="0 0 24 24"
          width={16}
          height={16}
        >
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      ),
    },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-name">
          Prithvi<span>Twin</span>
        </div>
        <div className="sidebar-logo-sub">AI Climate Digital Twin</div>
        <div className="badge badge-violet" style={{ marginTop: '8px' }}>
          ISRO BAH 2026
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item, index) => {
          if (item.type === 'divider') {
            return <div key={`sep-${index}`} className="nav-sep" />;
          }

          const isActive =
            pathname === item.href ||
            (item.href !== '/' && pathname?.startsWith(item.href || ''));

          return (
            <Link
              key={item.href}
              href={item.href || '/'}
              className={isActive ? 'nav-item active' : 'nav-item'}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer" style={{ marginTop: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div className="pulse-dot" />
          <span style={{ color: 'var(--green)', fontSize: '11px', fontWeight: 500 }}>
            System Operational
          </span>
        </div>
        <div style={{ fontSize: '10px', color: 'var(--dim)', marginTop: '4px' }}>
          Last updated 6 hrs ago
        </div>
      </div>
    </aside>
  );
}
