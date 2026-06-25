import React, { ReactNode } from 'react';

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  glow?: 'none' | 'green' | 'red' | 'amber';
}

export default function GlassPanel({
  children,
  className = '',
  style,
  glow = 'none',
}: GlassPanelProps) {
  const glowShadows = {
    green: '0 0 20px rgba(34,197,94,0.12)',
    red: '0 0 20px rgba(239,68,68,0.15)',
    amber: '0 0 20px rgba(245,158,11,0.12)',
    none: undefined,
  };

  const glowShadow = glowShadows[glow];

  const mergedStyle: React.CSSProperties = {
    ...style,
    ...(glowShadow ? { boxShadow: glowShadow } : {}),
  };

  return (
    <div className={`glass-panel ${className}`.trim()} style={mergedStyle}>
      {children}
    </div>
  );
}
