'use client';

import { ReactNode } from 'react';

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  glow?: 'none' | 'cyan' | 'amber' | 'red' | 'violet';
  onClick?: () => void;
  hover?: boolean;
  padding?: string;
}

export default function GlassPanel({
  children,
  className = '',
  glow = 'none',
  onClick,
  hover = false,
  padding = 'p-5',
}: GlassPanelProps) {
  const glowClass = {
    none:   '',
    cyan:   'glow-cyan   border-signal-cyan/30',
    amber:  'glow-amber  border-warning-amber/30',
    red:    'glow-red    border-critical-red/30',
    violet: 'glow-violet border-ai-violet/30',
  }[glow];

  return (
    <div
      className={`glass-panel ${padding} ${glowClass} ${hover ? 'glass-panel-hover cursor-pointer' : ''} ${onClick ? 'cursor-pointer' : ''} transition-all duration-200 ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
